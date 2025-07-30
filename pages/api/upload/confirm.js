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
      quality = 'standard',
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

    console.log('⚙️ Transcription settings:', settings);

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
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('💾 Creating MongoDB record:', { ...fileRecord, userId: 'REDACTED' });

    const result = await db.collection('files').insertOne(fileRecord);
    const fileId = result.insertedId.toString();

    console.log('✅ File record created with ID:', fileId);

    // Start transcription process in background
    processTranscription(fileId, fileUrl, settings).catch(error => {
      console.error('❌ Background transcription error:', error);
    });

    res.status(200).json({
      success: true,
      fileId,
      message: 'File uploaded successfully. Transcription started.',
      estimatedTime: getEstimatedTime(fileSize)
    });

  } catch (error) {
    console.error('Upload confirmation error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}

async function processTranscription(fileId, fileUrl, settings) {
  try {
    console.log(`🔄 Starting transcription for file ${fileId}`);
    const { db } = await connectDB();
    // Check environment variables
    const missingVars = [];
    if (!process.env.ASSEMBLYAI_API_KEY) missingVars.push('ASSEMBLYAI_API_KEY');
    if (!process.env.GEMINI_API_KEY) missingVars.push('GEMINI_API_KEY');
    if (missingVars.length > 0) {
      console.error('❌ Missing environment variables:', missingVars);
      await db.collection('files').updateOne(
        { _id: new ObjectId(fileId) },
        { $set: { status: 'error', error: `Missing environment variables: ${missingVars.join(', ')}`, missingConfig: missingVars, updatedAt: new Date() } }
      );
      return;
    }
    // Get the correct AssemblyAI language code
    const assemblyLanguageCode = getAssemblyLanguageCode(settings.language);
    const availableFeatures = getAvailableFeatures(settings.language);
    // Build request body with only supported features (per AssemblyAI docs)
    const requestBody = {
      audio_url: fileUrl
    };
    if (assemblyLanguageCode) {
      requestBody.language_code = assemblyLanguageCode;
    }
    if (availableFeatures.speaker_labels && settings.speakerIdentification) {
      requestBody.speaker_labels = true;
    }
    if (availableFeatures.filter_profanity && settings.filterProfanity) {
      requestBody.filter_profanity = true;
    }
    if (availableFeatures.punctuate && settings.autoPunctuation) {
      requestBody.punctuate = true;
    }
    // AssemblyAI returns word-level timestamps by default; do not send unsupported fields
    // Only set speech_model if 'enhanced' is requested
    if (settings.quality === 'enhanced') {
      requestBody.speech_model = 'best';
    }
    // Remove any undefined/null fields (defensive)
    Object.keys(requestBody).forEach(key => {
      if (requestBody[key] === undefined || requestBody[key] === null) {
        delete requestBody[key];
      }
    });
    console.log('[DEBUG] AssemblyAI request body:', JSON.stringify(requestBody));
    // Submit to AssemblyAI
    let transcriptResponse, transcriptData;
    try {
      transcriptResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.ASSEMBLYAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      transcriptData = await transcriptResponse.json();
      console.log('[DEBUG] AssemblyAI response:', transcriptData);
    } catch (err) {
      console.error('[ERROR] AssemblyAI fetch failed:', err);
      throw new Error('Failed to reach AssemblyAI API');
    }
    if (!transcriptResponse.ok || !transcriptData.id) {
      console.error('[ERROR] AssemblyAI submission failed:', transcriptData);
      throw new Error(`Failed to submit to AssemblyAI: ${transcriptData.error || 'Unknown error'}`);
    }
    const transcriptId = transcriptData.id;
    console.log('📝 Transcription submitted with ID:', transcriptId);
    // Update file record with transcript ID
    await db.collection('files').updateOne(
      { _id: new ObjectId(fileId) },
      { $set: { transcriptId, updatedAt: new Date() } }
    );
    // Poll for completion
    await pollTranscriptionStatus(fileId, transcriptId, settings);
  } catch (error) {
    console.error(`❌ Transcription error for file ${fileId}:`, error);
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
  const maxAttempts = 360; // 30 minutes

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // 5-second interval
    attempts++;
    try {
      const response = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.ASSEMBLYAI_API_KEY}`,
        },
      });
      const data = await response.json();
      console.log(`[DEBUG] Poll attempt ${attempts} - status: ${data.status}`, data);
      if (data.status === 'completed') {
        console.log('✅ Transcription completed for file:', fileId);
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
              confidence: data.confidence,
              updatedAt: new Date()
            }
          }
        );
        return;
      } else if (data.status === 'error') {
        console.error(`[ERROR] AssemblyAI returned error status:`, data);
        throw new Error(`AssemblyAI transcription failed: ${data.error}`);
      }
    } catch (error) {
      console.error(`[ERROR] Polling transcription status (attempt ${attempts}):`, error);
    }
  }
  throw new Error('Transcription timeout - processing took too long');
}

async function generateSummary(text, targetLanguage = 'en') {
  try {
    const maxTranscriptLength = 32000;
    const truncatedText = text.length > maxTranscriptLength ? text.substring(0, maxTranscriptLength) : text;
    const languageName = getLanguageForAI(targetLanguage);
    const summaryPrompt = `Analyze this transcript and respond in ${languageName}:\n\n"${truncatedText}"\n\nProvide your response in ${languageName} with:\n1. SUMMARY: A 2-3 sentence summary.\n2. TOPICS: 3-5 main topics, comma-separated.\n3. INSIGHTS: 1-2 key insights.\n\nFormat your response exactly like this:\nSUMMARY: [Your summary]\nTOPICS: [topic1, topic2]\nINSIGHTS: [Your insights]`;
    console.log(`[DEBUG] Generating AI summary in ${languageName}`);
    
    // Try different models in order of preference
    const models = [
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-1.0-pro'
    ];
    
    for (const model of models) {
      console.log(`[DEBUG] Trying model: ${model}`);
      
      // Add retry logic for Gemini API overload
      let attempts = 0;
      const maxAttempts = 3; // Reduced for faster fallback
      const baseDelay = 2000; // Reduced delay
      
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
              console.log(`[DEBUG] Gemini API (${model}) overloaded, retrying in ${delay}ms (attempt ${attempts}/${maxAttempts})`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            } else {
              console.log(`[DEBUG] Model ${model} overloaded after all retries, trying next model...`);
              break; // Try next model
            }
          }
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`[DEBUG] Gemini API (${model}) error: ${response.status} - ${errorText}`);
            if (attempts < maxAttempts - 1) {
              attempts++;
              const delay = baseDelay * Math.pow(2, attempts - 1);
              console.log(`[DEBUG] Retrying ${model} in ${delay}ms (attempt ${attempts}/${maxAttempts})`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            } else {
              console.log(`[DEBUG] Model ${model} failed after all retries, trying next model...`);
              break; // Try next model
            }
          }
          
          const data = await response.json();
          const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          
          const summaryMatch = generatedText.match(/SUMMARY:\s*(.+?)(?=TOPICS:|$)/s);
          const topicsMatch = generatedText.match(/TOPICS:\s*(.+?)(?=INSIGHTS:|$)/s);
          const insightsMatch = generatedText.match(/INSIGHTS:\s*(.+?)$/s);
          
          console.log(`[DEBUG] Successfully generated summary using ${model}`);
          
          return {
            summary: summaryMatch ? summaryMatch[1].trim() : 'Summary not available.',
            topics: topicsMatch ? topicsMatch[1].trim().split(",").map(t => t.trim()).filter(Boolean) : [],
            topic: topicsMatch ? topicsMatch[1].trim().split(",")[0].trim() : 'General',
            insights: insightsMatch ? insightsMatch[1].trim() : 'No insights generated.'
          };
          
        } catch (error) {
          attempts++;
          if (attempts >= maxAttempts) {
            console.log(`[DEBUG] Model ${model} error after all retries, trying next model...`);
            break; // Try next model
          }
          const delay = baseDelay * Math.pow(2, attempts - 1);
          console.log(`[DEBUG] Gemini API (${model}) error, retrying in ${delay}ms (attempt ${attempts}/${maxAttempts}):`, error.message);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // If all models failed, use fallback
    console.log('[DEBUG] All Gemini models failed, using improved fallback summary');
    return generateFallbackSummary(truncatedText, languageName);
    
  } catch (error) {
    console.error('[ERROR] Summary generation failed after all retries:', error);
    return generateFallbackSummary(text, getLanguageForAI(targetLanguage));
  }
}

// Fallback summary generation when Gemini API is unavailable
function generateFallbackSummary(text, languageName) {
  try {
    console.log('🔄 Using intelligent fallback summary generation');
    
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
    
    // Generate intelligent summary
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
        summary = `The discussion centers around ${primaryTopics.join(', ')}. ${summary}`;
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
      summary = `This transcript contains ${wordCountTotal} words`;
      if (meaningfulWords.length > 0) {
        summary += ` discussing ${meaningfulWords.slice(0, 2).join(' and ')}`;
      }
      summary += `.`;
    }
    
    // Generate intelligent insights
    let insights = '';
    
    if (meaningfulWords.length > 0) {
      insights = `Key themes: ${meaningfulWords.slice(0, 4).join(', ')}. `;
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
    
    insights += `. Content analysis indicates `;
    
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
    
    insights += `. Generated using intelligent text analysis.`;
    
    return {
      summary: summary,
      topics: meaningfulWords.slice(0, 5),
      topic: meaningfulWords[0] || 'Conversation',
      insights: insights
    };
    
  } catch (error) {
    console.error('⚠️ Intelligent fallback summary generation failed:', error);
    return {
      summary: 'Summary generation temporarily unavailable. Please try again later.',
      topics: [],
      topic: 'General',
      insights: 'Content analysis temporarily unavailable.'
    };
  }
}

function extractSpeakers(utterances) {
  const speakerSet = new Set();
  utterances.forEach(utterance => {
    if (utterance.speaker) {
      speakerSet.add(`Speaker ${utterance.speaker}`);
    }
  });
  return Array.from(speakerSet);
}

function getEstimatedTime(fileSize) {
  const fileSizeInMB = fileSize / (1024 * 1024);
  
  if (fileSizeInMB > 100) {
    return '20-45 minutes for very large files';
  } else if (fileSizeInMB > 50) {
    return '10-20 minutes for large files';
  } else if (fileSizeInMB > 20) {
    return '5-10 minutes';
  } else {
    return '2-5 minutes';
  }
}
