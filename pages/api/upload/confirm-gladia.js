import { verifyToken, getTokenFromRequest } from '../../../utils/auth.js';
import { connectDB } from '../../../lib/mongodb.js';
import { ObjectId } from 'mongodb';
import { 
  getAssemblyLanguageCode, 
  languageNeedsTranslation, 
  translateText, 
  getLanguageForAI,
  getAvailableFeatures 
} from '../../../utils/languages.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const token = getTokenFromRequest(req);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find user in MongoDB
    const { db } = await connectDB();
    const user = await db.collection('users').findOne({ email: decoded.email });
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const { 
      fileName, 
      fileSize, 
      fileType, 
      fileUrl, 
      fileKey,
      language = 'en',
      quality = 'enhanced', // Default to enhanced for Gladia
      speakerIdentification = false,
      includeTimestamps = true,
      filterProfanity = false,
      autoPunctuation = true
    } = req.body;

    if (!fileName || !fileSize || !fileType || !fileUrl || !fileKey) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Prepare transcription settings
    const settings = {
      language,
      quality,
      speakerIdentification: speakerIdentification === 'true' || speakerIdentification === true,
      includeTimestamps: includeTimestamps === 'true' || includeTimestamps === true,
      filterProfanity: filterProfanity === 'true' || filterProfanity === true,
      autoPunctuation: autoPunctuation === 'true' || autoPunctuation === true,
    };

    console.log('⚙️ Enhanced Gladia transcription settings:', settings);

    // Create file record in MongoDB
    const fileRecord = {
      userId: user.id || user._id.toString(),
      name: fileName,
      size: fileSize,
      type: fileType,
      url: fileUrl,
      key: fileKey,
      status: 'processing',
      settings,
      provider: 'gladia', // Mark as Gladia transcription
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('💾 Creating MongoDB record:', { ...fileRecord, userId: 'REDACTED' });

    const result = await db.collection('files').insertOne(fileRecord);
    const fileId = result.insertedId.toString();

    console.log('✅ File record created with ID:', fileId);

    // Start Gladia transcription process in background
    processGladiaTranscription(fileId, fileUrl, settings).catch(error => {
      console.error('❌ Background Gladia transcription error:', error);
    });

    res.status(200).json({
      success: true,
      fileId,
      message: 'File uploaded successfully. Enhanced transcription started with Gladia.',
      provider: 'gladia',
      estimatedTime: getGladiaEstimatedTime(fileSize)
    });

  } catch (error) {
    console.error('Gladia upload confirmation error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

async function processGladiaTranscription(fileId, fileUrl, settings) {
  try {
    console.log(`🔄 Starting enhanced Gladia transcription for file ${fileId}`);
    const { db } = await connectDB();
    
    // Check environment variables
    const missingVars = [];
    if (!process.env.GLADIA_API_KEY) missingVars.push('GLADIA_API_KEY');
    if (!process.env.GEMINI_API_KEY) missingVars.push('GEMINI_API_KEY');
    if (missingVars.length > 0) {
      console.error('❌ Missing environment variables:', missingVars);
      await db.collection('files').updateOne(
        { _id: new ObjectId(fileId) },
        { $set: { status: 'error', error: `Missing environment variables: ${missingVars.join(', ')}`, missingConfig: missingVars, updatedAt: new Date() } }
      );
      return;
    }

    console.log('🚀 Starting enhanced Gladia transcription process');
    console.log('🔗 Audio URL:', fileUrl);
    console.log('⚙️ Settings:', settings);

    // Step 1: Upload file to Gladia (they need their own URL)
    console.log('📤 Uploading file to Gladia...');
    
    // Fetch the file from our R2 URL
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      throw new Error(`Failed to fetch file from R2: ${fileResponse.status} ${fileResponse.statusText}`);
    }
    
    const fileBlob = await fileResponse.blob();
    
    const formData = new FormData();
    formData.append('audio', fileBlob);
    
    const uploadResponse = await fetch('https://api.gladia.io/v2/upload', {
      method: 'POST',
      headers: {
        'x-gladia-key': process.env.GLADIA_API_KEY,
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      throw new Error(`Gladia upload failed: ${errorData.error || 'Unknown error'} (Status: ${uploadResponse.status})`);
    }

    const uploadData = await uploadResponse.json();
    const gladiaAudioUrl = uploadData.audio_url;
    console.log('✅ File uploaded to Gladia:', gladiaAudioUrl);

    // Step 2: Submit transcription request with enhanced auto-correction
    const requestBody = {
      audio_url: gladiaAudioUrl,
      detect_language: true, // Auto-detect language
    };

    // Add diarization if requested
    if (settings.speakerIdentification) {
      requestBody.diarization = true;
    }

    // Add subtitles if timestamps requested
    if (settings.includeTimestamps) {
      requestBody.subtitles = true;
    }

    // Add profanity filtering if requested
    if (settings.filterProfanity) {
      requestBody.enable_profanity_filter = true;
    }

    // Only set language hint if user explicitly chose a language other than auto-detect
    if (settings.language && settings.language !== 'en' && settings.language !== 'auto') {
      requestBody.language = settings.language;
    }

    console.log('📤 Submitting Gladia transcription request:', JSON.stringify(requestBody, null, 2));

    const transcriptionResponse = await fetch('https://api.gladia.io/v2/pre-recorded', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-gladia-key': process.env.GLADIA_API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    if (!transcriptionResponse.ok) {
      const errorData = await transcriptionResponse.json().catch(() => ({}));
      console.error('❌ Gladia transcription submission failed:', {
        status: transcriptionResponse.status,
        statusText: transcriptionResponse.statusText,
        errorData,
        requestBody
      });
      throw new Error(`Gladia transcription submission failed: ${errorData.error || errorData.message || transcriptionResponse.statusText || 'Unknown error'} (Status: ${transcriptionResponse.status})`);
    }

    const transcriptionData = await transcriptionResponse.json();
    console.log('✅ Gladia transcription submitted. ID:', transcriptionData.id);
    console.log('🔗 Result URL:', transcriptionData.result_url);

    // Update file record with transcript ID
    await db.collection('files').updateOne(
      { _id: new ObjectId(fileId) },
      { $set: { transcriptId: transcriptionData.id, resultUrl: transcriptionData.result_url, updatedAt: new Date() } }
    );

    // Step 3: Poll for results
    await pollGladiaTranscriptionStatus(fileId, transcriptionData.id, transcriptionData.result_url, settings);

  } catch (error) {
    console.error(`❌ Gladia transcription error for file ${fileId}:`, error);
    const { db } = await connectDB();
    await db.collection('files').updateOne(
      { _id: new ObjectId(fileId) },
      { $set: { status: 'error', error: error.message, updatedAt: new Date() } }
    );
  }
}

async function pollGladiaTranscriptionStatus(fileId, transcriptId, resultUrl, settings) {
  const { db } = await connectDB();
  let attempts = 0;
  const maxAttempts = 600; // 50 minutes (5 second intervals)

  console.log('🔄 Starting to poll Gladia transcription status...');

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    attempts++;

    try {
      console.log(`🔍 Checking Gladia transcription status (attempt ${attempts}/${maxAttempts})...`);
      
      const response = await fetch(resultUrl, {
        headers: { 
          'x-gladia-key': process.env.GLADIA_API_KEY,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        console.log(`⚠️ Status check failed with ${response.status}, retrying...`);
        continue;
      }

      const data = await response.json();
      console.log(`📊 Transcription status: ${data.status || 'unknown'}`);

      if (data.result && data.result.transcription) {
        console.log('✅ Gladia transcription completed successfully!');
        
        const transcriptionResult = data.result.transcription;
        let transcriptText = transcriptionResult.full_transcript || '';
        let speakers = [];
        let timestamps = [];

        // Extract detected language
        const detectedLanguage = transcriptionResult.language || settings.language || 'en';
        console.log(`🌍 Detected language: ${detectedLanguage}`);

        // Process speaker diarization if available
        if (settings.speakerIdentification && transcriptionResult.utterances && transcriptionResult.utterances.length > 0) {
          console.log('👥 Processing speaker diarization...');
          speakers = extractGladiaSpeakers(transcriptionResult.utterances);
          
          // Format transcript with speakers and timestamps
          const formattedUtterances = transcriptionResult.utterances.map((utterance, index) => {
            const timestamp = formatTimestamp(utterance.start * 1000); // Convert to milliseconds
            return `Speaker ${utterance.speaker}    ${timestamp}    ${utterance.text}`;
          });
          
          transcriptText = formattedUtterances.join('\n') + '\n\n[END]';
        }

        // Process word-level timestamps if available
        if (settings.includeTimestamps && transcriptionResult.words && transcriptionResult.words.length > 0) {
          console.log('⏱️ Processing word-level timestamps...');
          timestamps = transcriptionResult.words.map(word => ({
            text: word.word,
            start: word.start,
            end: word.end,
            confidence: word.confidence,
            speaker: word.speaker || null
          }));
        }

        // Generate summary using our existing function
        console.log('📝 Generating enhanced summary...');
        const summaryResult = await generateGladiaSummary(transcriptText, detectedLanguage);

        // Apply Gemini AI auto-correction for enhanced quality
        console.log('🤖 Applying AI auto-correction for enhanced accuracy...');
        const correctedTranscript = await applyGeminiAutoCorrection(transcriptText, detectedLanguage);

        // Update database with results
        await db.collection('files').updateOne(
          { _id: new ObjectId(fileId) },
          {
            $set: {
              status: 'completed',
              transcript: correctedTranscript, // Use AI-corrected transcript
              originalTranscript: transcriptText, // Keep original for reference
              summary: summaryResult.summary,
              topic: summaryResult.topic,
              topics: summaryResult.topics,
              insights: summaryResult.insights,
              speakers,
              timestamps,
              duration: transcriptionResult.metadata?.audio_duration || 0,
              wordCount: transcriptionResult.words?.length || 0,
              language: detectedLanguage,
              provider: 'gladia',
              enhanced: true, // Mark as enhanced with AI correction
              confidence: transcriptionResult.metadata?.confidence || null,
              updatedAt: new Date(),
            }
          }
        );

        console.log('✅ Gladia transcription processing completed successfully!');
        return;

      } else if (data.status === 'error' || (data.result && data.result.error)) {
        const errorMessage = data.result?.error || data.error || 'Unknown Gladia error';
        throw new Error(`Gladia transcription failed: ${errorMessage}`);
      }

      // Continue polling if still processing
      if (attempts % 12 === 0) { // Log every minute
        console.log(`⏳ Still processing... (${Math.round(attempts * 5 / 60)} minutes elapsed)`);
      }

    } catch (error) {
      console.error(`❌ Error polling Gladia transcription status (attempt ${attempts}):`, error);
      
      // Don't fail immediately on network errors, but do fail on API errors
      if (error.message.includes('Gladia transcription failed')) {
        throw error;
      }
    }
  }
  
  throw new Error('Gladia transcription timeout after 50 minutes');
}

// Helper function to extract speakers from Gladia utterances
function extractGladiaSpeakers(utterances) {
  if (!utterances || !Array.isArray(utterances)) return [];
  
  const speakers = new Set();
  utterances.forEach(utterance => {
    if (utterance.speaker !== undefined && utterance.speaker !== null) {
      speakers.add(utterance.speaker);
    }
  });
  
  return Array.from(speakers).sort();
}

// Helper function to format timestamp from seconds to HH:MM:SS
function formatTimestamp(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

async function generateGladiaSummary(text, targetLanguage = 'en') {
  try {
    const maxTranscriptLength = 32000;
    const truncatedText = text.length > maxTranscriptLength ? text.substring(0, maxTranscriptLength) : text;
    const languageName = getLanguageForAI(targetLanguage);
    
    const summaryPrompt = `Analyze this enhanced transcript and respond in ${languageName}:\n\n"${truncatedText}"\n\nProvide your response in ${languageName} with:\n1. SUMMARY: A 2-3 sentence summary.\n2. TOPICS: 3-5 main topics, comma-separated.\n3. INSIGHTS: 1-2 key insights.\n\nFormat your response exactly like this:\nSUMMARY: [Your summary]\nTOPICS: [topic1, topic2]\nINSIGHTS: [Your insights]`;
    
    console.log(`🤖 Generating enhanced AI summary in ${languageName}`);
    
    // Try different models in order of preference
    const models = [
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-1.0-pro'
    ];
    
    for (const model of models) {
      console.log(`🔄 Trying model: ${model}`);
      
      let attempts = 0;
      const maxAttempts = 3;
      const baseDelay = 2000;
      
      while (attempts < maxAttempts) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                contents: [{ parts: [{ text: summaryPrompt }] }],
                generationConfig: {
                  temperature: 0.7,
                  topK: 40,
                  topP: 0.95,
                  maxOutputTokens: 1024,
                }
              })
            }
          );
          
          if (response.status === 503) {
            attempts++;
            if (attempts < maxAttempts) {
              const delay = baseDelay * Math.pow(2, attempts - 1);
              console.log(`Gemini API (${model}) overloaded, retrying in ${delay}ms (attempt ${attempts}/${maxAttempts})`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            } else {
              console.log(`Model ${model} overloaded after all retries, trying next model...`);
              break;
            }
          }
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Gemini API (${model}) error: ${response.status} - ${errorText}`);
            if (attempts < maxAttempts - 1) {
              attempts++;
              const delay = baseDelay * Math.pow(2, attempts - 1);
              console.log(`Retrying ${model} in ${delay}ms (attempt ${attempts}/${maxAttempts})`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            } else {
              console.log(`Model ${model} failed after all retries, trying next model...`);
              break;
            }
          }
          
          const data = await response.json();
          const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          
          const summaryMatch = generatedText.match(/SUMMARY:\s*(.+?)(?=TOPICS:|$)/s);
          const topicsMatch = generatedText.match(/TOPICS:\s*(.+?)(?=INSIGHTS:|$)/s);
          const insightsMatch = generatedText.match(/INSIGHTS:\s*(.+?)$/s);
          
          console.log(`✅ Successfully generated enhanced summary using ${model}`);
          
          return {
            summary: summaryMatch ? summaryMatch[1].trim() : 'Enhanced summary not available.',
            topics: topicsMatch ? topicsMatch[1].trim().split(",").map(t => t.trim()).filter(Boolean) : [],
            topic: topicsMatch ? topicsMatch[1].trim().split(",")[0].trim() : 'General',
            insights: insightsMatch ? insightsMatch[1].trim() : 'No enhanced insights generated.'
          };
          
        } catch (error) {
          attempts++;
          if (attempts >= maxAttempts) {
            console.log(`Model ${model} error after all retries, trying next model...`);
            break;
          }
          const delay = baseDelay * Math.pow(2, attempts - 1);
          console.log(`Gemini API (${model}) error, retrying in ${delay}ms (attempt ${attempts}/${maxAttempts}):`, error.message);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // If all models failed, use fallback
    console.log('All Gemini models failed, using enhanced fallback summary');
    return generateEnhancedFallbackSummary(truncatedText, languageName);
    
  } catch (error) {
    console.error('⚠️ Enhanced summary generation failed after all retries:', error);
    return generateEnhancedFallbackSummary(text, getLanguageForAI(targetLanguage));
  }
}

// Enhanced fallback summary for Gladia
function generateEnhancedFallbackSummary(text, languageName) {
  try {
    console.log('🔄 Using enhanced intelligent fallback summary generation');
    
    // Clean and prepare the text
    const cleanText = text.replace(/\s+/g, ' ').trim();
    const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 15);
    const words = cleanText.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    
    // Enhanced stop words list
    const stopWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs', 'a', 'an', 'as', 'so', 'than', 'too', 'very', 'just', 'now', 'then', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'also', 'well', 'even', 'still', 'back', 'get', 'go', 'come', 'make', 'take', 'see', 'know', 'think', 'say', 'tell', 'ask', 'work', 'seem', 'feel', 'try', 'leave', 'call', 'good', 'new', 'first', 'last', 'long', 'great', 'little', 'own', 'other', 'old', 'right', 'big', 'high', 'different', 'small', 'large', 'next', 'early', 'young', 'important', 'few', 'public', 'bad', 'same', 'able'
    ]);
    
    // Analyze word frequency and importance
    const wordCount = {};
    const wordPositions = {};
    
    words.forEach((word, index) => {
      const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();
      if (cleanWord.length > 2 && !stopWords.has(cleanWord)) {
        wordCount[cleanWord] = (wordCount[cleanWord] || 0) + 1;
        if (!wordPositions[cleanWord]) wordPositions[cleanWord] = [];
        wordPositions[cleanWord].push(index);
      }
    });
    
    // Get meaningful topics (words that appear multiple times and are not just noise)
    const meaningfulWords = Object.entries(wordCount)
      .filter(([word, count]) => count > 1 && word.length > 3)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 6)
      .map(([word]) => word);
    
    // Find the most representative sentence (contains most key topics)
    let bestSentence = '';
    let bestScore = 0;
    
    sentences.forEach(sentence => {
      const sentenceWords = sentence.toLowerCase().split(/\s+/);
      let score = 0;
      let topicCount = 0;
      
      meaningfulWords.forEach(topic => {
        if (sentenceWords.some(word => word.includes(topic))) {
          score += wordCount[topic] || 1;
          topicCount++;
        }
      });
      
      // Prefer sentences with multiple topics and good length
      if (topicCount > 0 && sentence.length > 30 && sentence.length < 200) {
        const finalScore = score * topicCount;
        if (finalScore > bestScore) {
          bestScore = finalScore;
          bestSentence = sentence.trim();
        }
      }
    });
    
    // If no good sentence found, use the first substantial sentence
    if (!bestSentence && sentences.length > 0) {
      bestSentence = sentences[0].trim();
    }
    
    // Generate enhanced intelligent summary
    let summary = '';
    const wordCountTotal = words.length;
    const sentenceCount = sentences.length;
    const avgWordsPerSentence = sentenceCount > 0 ? Math.round(wordCountTotal / sentenceCount) : 0;
    
    if (bestSentence) {
      // Start with the most representative sentence
      summary = bestSentence;
      
      // Add context about key topics if they exist
      if (meaningfulWords.length > 0) {
        const primaryTopics = meaningfulWords.slice(0, 3);
        summary = `Enhanced analysis: The discussion centers around ${primaryTopics.join(', ')}. ${summary}`;
      }
      
      // Add meaningful context about the conversation
      if (sentenceCount > 1) {
        summary += ` The conversation includes ${sentenceCount} distinct exchanges`;
        if (avgWordsPerSentence > 12) {
          summary += ` with detailed responses`;
        } else if (avgWordsPerSentence < 8) {
          summary += ` with brief interactions`;
        }
        summary += `.`;
      }
    } else {
      // Fallback for very short content
      summary = `Enhanced: This transcript contains ${wordCountTotal} words`;
      if (meaningfulWords.length > 0) {
        summary += ` discussing ${meaningfulWords.slice(0, 2).join(' and ')}`;
      }
      summary += `.`;
    }
    
    // Generate enhanced intelligent insights
    let insights = '';
    
    if (meaningfulWords.length > 0) {
      insights = `Enhanced analysis - Key themes: ${meaningfulWords.slice(0, 4).join(', ')}. `;
    }
    
    // Analyze conversation characteristics
    if (sentenceCount > 10) {
      insights += `Extended discussion with ${sentenceCount} exchanges`;
    } else if (sentenceCount > 5) {
      insights += `Moderate conversation with ${sentenceCount} exchanges`;
    } else {
      insights += `Brief conversation with ${sentenceCount} exchanges`;
    }
    
    if (avgWordsPerSentence > 15) {
      insights += ` featuring detailed responses`;
    } else if (avgWordsPerSentence < 8) {
      insights += ` with concise exchanges`;
    }
    
    insights += `. Enhanced content analysis indicates `;
    
    // Determine conversation type based on content analysis
    const uniqueWords = new Set(words).size;
    const vocabularyDiversity = uniqueWords / wordCountTotal;
    
    if (vocabularyDiversity > 0.6) {
      insights += `diverse vocabulary suggesting formal or technical discussion`;
    } else if (meaningfulWords.some(word => word.length > 6)) {
      insights += `specialized terminology indicating professional content`;
    } else {
      insights += `casual conversation style`;
    }
    
    insights += `. Generated using enhanced intelligent text analysis with Gladia.`;
    
    return {
      summary: summary,
      topics: meaningfulWords.slice(0, 5),
      topic: meaningfulWords[0] || 'Conversation',
      insights: insights
    };
    
  } catch (error) {
    console.error('⚠️ Enhanced intelligent fallback summary generation failed:', error);
    return {
      summary: 'Enhanced summary generation temporarily unavailable. Please try again later.',
      topics: [],
      topic: 'General',
      insights: 'Enhanced content analysis temporarily unavailable.'
    };
  }
}

function getGladiaEstimatedTime(fileSize) {
  const fileSizeInMB = fileSize / (1024 * 1024);
  
  if (fileSizeInMB > 100) {
    return '25-50 minutes for very large files with enhanced quality';
  } else if (fileSizeInMB > 50) {
    return '12-25 minutes for large files with enhanced quality';
  } else if (fileSizeInMB > 20) {
    return '6-12 minutes with enhanced quality';
  } else {
    return '3-8 minutes with enhanced quality';
  }
}

// AI Auto-Correction using Gemini
async function applyGeminiAutoCorrection(transcript, language = 'en') {
  try {
    console.log('🤖 Starting Gemini AI auto-correction...');
    
    // Don't apply correction if transcript is too short
    if (transcript.length < 50) {
      console.log('⚠️ Transcript too short for auto-correction, returning original');
      return transcript;
    }

    const languageName = getLanguageForAI(language);
    
    const correctionPrompt = `You are an expert transcription corrector. Your task is to improve the accuracy of this transcription while preserving the original meaning and style.

Please correct:
- Grammar and punctuation errors
- Spelling mistakes
- Word recognition errors (homophones, unclear words)
- Sentence structure issues
- Missing punctuation and capitalization

Keep the same:
- Original speaking style and tone
- All speaker markers (if present)
- Timestamps (if present)
- Length and overall structure
- Casual language and colloquialisms

Language: ${languageName}

Original transcript:
"${transcript}"

Provide the corrected transcript in ${languageName}, maintaining the exact same format and structure:`;

    console.log(`🔄 Applying AI correction in ${languageName}...`);
    
    // Try different models for auto-correction
    const models = [
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-1.0-pro'
    ];
    
    for (const model of models) {
      console.log(`🤖 Trying correction with model: ${model}`);
      
      let attempts = 0;
      const maxAttempts = 2; // Fewer attempts for auto-correction
      const baseDelay = 1000;
      
      while (attempts < maxAttempts) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                contents: [{ parts: [{ text: correctionPrompt }] }],
                generationConfig: {
                  temperature: 0.3, // Lower temperature for more conservative corrections
                  topK: 40,
                  topP: 0.95,
                  maxOutputTokens: Math.min(2048, Math.ceil(transcript.length * 1.5)), // Adaptive token limit
                }
              })
            }
          );
          
          if (response.status === 503) {
            attempts++;
            if (attempts < maxAttempts) {
              const delay = baseDelay * Math.pow(2, attempts - 1);
              console.log(`Gemini API (${model}) overloaded, retrying in ${delay}ms (attempt ${attempts}/${maxAttempts})`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            } else {
              console.log(`Model ${model} overloaded, trying next model...`);
              break;
            }
          }
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Gemini API (${model}) error: ${response.status} - ${errorText}`);
            if (attempts < maxAttempts - 1) {
              attempts++;
              const delay = baseDelay * Math.pow(2, attempts - 1);
              console.log(`Retrying ${model} in ${delay}ms (attempt ${attempts}/${maxAttempts})`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            } else {
              console.log(`Model ${model} failed, trying next model...`);
              break;
            }
          }
          
          const data = await response.json();
          const correctedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          
          if (correctedText && correctedText.length > 10) {
            console.log(`✅ Successfully applied AI auto-correction using ${model}`);
            console.log(`📊 Original length: ${transcript.length}, Corrected length: ${correctedText.length}`);
            return correctedText.trim();
          } else {
            console.log(`⚠️ Model ${model} returned empty correction, trying next model...`);
            break;
          }
          
        } catch (error) {
          attempts++;
          if (attempts >= maxAttempts) {
            console.log(`Model ${model} error after all retries, trying next model...`);
            break;
          }
          const delay = baseDelay * Math.pow(2, attempts - 1);
          console.log(`Gemini API (${model}) error, retrying in ${delay}ms (attempt ${attempts}/${maxAttempts}):`, error.message);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // If all models failed, return original transcript
    console.log('⚠️ All Gemini models failed for auto-correction, returning original transcript');
    return transcript;
    
  } catch (error) {
    console.error('❌ Auto-correction failed:', error);
    return transcript; // Return original if correction fails
  }
}