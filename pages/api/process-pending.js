import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { connectDB } from '../../lib/mongodb.js';
import { ObjectId } from 'mongodb';
import { 
  getAssemblyLanguageCode, 
  getLanguageForAI,
  getAvailableFeatures 
} from '../../utils/languages.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Simple auth check - you can add a secret key here
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.WEBHOOK_SECRET || 'your-webhook-secret'}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const dbConnection = await connectDB();
    if (!dbConnection || !dbConnection.db) {
      console.error('❌ Database connection failed');
      return res.status(500).json({ error: 'Database connection failed' });
    }
    
    const { db } = dbConnection;
    
    // Find files that are stuck in processing status for more than 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const stuckFiles = await db.collection('files').find({
      status: 'processing',
      updatedAt: { $lt: tenMinutesAgo }
    }).limit(5).toArray(); // Process max 5 at a time

    console.log(`Found ${stuckFiles.length} stuck files to process`);

    const results = [];
    
    for (const file of stuckFiles) {
      try {
        console.log(`Processing stuck file: ${file._id}`);
        await processTranscription(file._id.toString(), file.url, file.settings);
        results.push({ fileId: file._id, status: 'restarted' });
      } catch (error) {
        console.error(`Failed to restart processing for file ${file._id}:`, error);
        results.push({ fileId: file._id, status: 'failed', error: error.message });
      }
    }

    res.status(200).json({
      success: true,
      processed: results.length,
      results
    });

  } catch (error) {
    console.error('Process pending error:', error);
    res.status(500).json({ 
      error: 'Failed to process pending files',
      details: error.message 
    });
  }
}

async function processTranscription(fileId, fileUrl, settings) {
  try {
    const { db } = await connectDB();
    await db.collection('files').updateOne(
      { _id: new ObjectId(fileId) },
      { $set: { status: 'processing', updatedAt: new Date() } }
    );

    const assemblyLanguageCode = getAssemblyLanguageCode(settings.language);
    const availableFeatures = getAvailableFeatures(settings.language);

    const requestBody = {
      audio_url: encodeURI(fileUrl),
      language_code: assemblyLanguageCode,
    };

    if (availableFeatures.speaker_labels && settings.speakerIdentification) {
      requestBody.speaker_labels = true;
    }
    if (availableFeatures.filter_profanity && settings.filterProfanity) {
      requestBody.filter_profanity = true;
    }
    if (availableFeatures.punctuate && settings.autoPunctuation) {
      requestBody.punctuate = true;
    }
    if (settings.includeTimestamps) {
      requestBody.word_details = true;
    }
    if (settings.quality === 'enhanced') {
      requestBody.speech_model = 'best';
    }

    console.log('Submitting to AssemblyAI:', requestBody.audio_url);

    const assemblyResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ASSEMBLYAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const transcriptData = await assemblyResponse.json();
    if (!assemblyResponse.ok || !transcriptData.id) {
      throw new Error(`Failed to submit to AssemblyAI: ${transcriptData.error || 'Unknown error'}`);
    }

    console.log(`AssemblyAI job submitted with ID: ${transcriptData.id}`);
    
    // Store the AssemblyAI job ID for later polling
    await db.collection('files').updateOne(
      { _id: new ObjectId(fileId) },
      { $set: { assemblyJobId: transcriptData.id, updatedAt: new Date() } }
    );

    // Start polling in the background
    setTimeout(() => {
      pollTranscriptionStatus(fileId, transcriptData.id, settings).catch(error => {
        console.error('Polling error:', error);
      });
    }, 5000);

  } catch (error) {
    console.error('Transcription processing error:', error);
    const { db } = await connectDB();
    await db.collection('files').updateOne(
      { _id: new ObjectId(fileId) },
      { $set: { status: 'error', error: error.message, updatedAt: new Date() } }
    );
  }
}

async function pollTranscriptionStatus(fileId, transcriptId, settings) {
  const { db } = await connectDB();
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes max

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    attempts++;

    try {
      const response = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: { 'Authorization': `Bearer ${process.env.ASSEMBLYAI_API_KEY}` },
      });

      const data = await response.json();
      console.log(`Transcription status check ${attempts}: ${data.status}`);

      if (data.status === 'completed') {
        let transcriptText = data.text;
        let speakers = [];
        let timestamps = [];

        if (settings.speakerIdentification && data.utterances && data.utterances.length > 0) {
          speakers = extractSpeakers(data.utterances);
          transcriptText = data.utterances.map(u => `Speaker ${u.speaker}: ${u.text}`).join('\n\n');
        }

        if (settings.includeTimestamps && data.words && data.words.length > 0) {
            timestamps = data.words.map(word => ({
                text: word.text,
                start: word.start,
                end: word.end,
                speaker: word.speaker || null
            }));
        }

        const summaryResult = await generateSummary(transcriptText, settings.language);

        await db.collection('files').updateOne(
          { _id: new ObjectId(fileId) },
          {
            $set: {
              status: 'completed',
              transcript: transcriptText,
              summary: summaryResult.summary,
              topic: summaryResult.topic,
              topics: summaryResult.topics,
              insights: summaryResult.insights,
              speakers,
              timestamps,
              duration: data.audio_duration,
              wordCount: data.words?.length || 0,
              language: settings.language,
              updatedAt: new Date(),
            }
          }
        );
        return;
      } else if (data.status === 'error') {
        throw new Error(`AssemblyAI transcription failed: ${data.error}`);
      }
    } catch (error) {
      console.error(`Error polling transcription status (attempt ${attempts}):`, error);
    }
  }
  throw new Error('Transcription timeout');
}

async function generateSummary(text, targetLanguage = 'en') {
  try {
    const maxTranscriptLength = 32000;
    const truncatedText = text.length > maxTranscriptLength ? text.substring(0, maxTranscriptLength) : text;
    const languageName = getLanguageForAI(targetLanguage);
    
    const summaryPrompt = `Analyze this transcript and respond in ${languageName}:\n\n"${truncatedText}"\n\nProvide your response in ${languageName} with:\n1. SUMMARY: A 2-3 sentence summary.\n2. TOPICS: 3-5 main topics, comma-separated.\n3. INSIGHTS: 1-2 key insights.\n\nFormat your response exactly like this:\nSUMMARY: [Your summary]\nTOPICS: [topic1, topic2]\nINSIGHTS: [Your insights]`;
    
    console.log(`Generating AI summary in ${languageName}`);
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: summaryPrompt }] }] })
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    const summaryMatch = generatedText.match(/SUMMARY:\s*(.+?)(?=TOPICS:|$)/s);
    const topicsMatch = generatedText.match(/TOPICS:\s*(.+?)(?=INSIGHTS:|$)/s);
    const insightsMatch = generatedText.match(/INSIGHTS:\s*(.+?)$/s);
    
    return {
      summary: summaryMatch ? summaryMatch[1].trim() : 'Summary not available.',
      topics: topicsMatch ? topicsMatch[1].trim().split(",").map(t => t.trim()).filter(Boolean) : [],
      topic: topicsMatch ? topicsMatch[1].trim().split(",")[0].trim() : 'General',
      insights: insightsMatch ? insightsMatch[1].trim() : 'No insights generated.'
    };
  } catch (error) {
    console.error('⚠️ Summary generation failed:', error);
    return {
      summary: 'Summary not available due to an error.',
      topics: [],
      topic: 'General',
      insights: 'No insights generated.'
    };
  }
}

function extractSpeakers(utterances) {
  if (!utterances || !Array.isArray(utterances)) return [];
  
  const speakers = new Set();
  utterances.forEach(utterance => {
    if (utterance.speaker) {
      speakers.add(utterance.speaker);
    }
  });
  
  return Array.from(speakers);
}