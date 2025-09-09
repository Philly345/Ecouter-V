import dotenv from 'dotenv';
// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

import formidable from 'formidable';
import fs from 'fs';
import { uploadFile, deleteFile } from '../../utils/storage.js';
import { verifyTokenString, getTokenFromRequest } from '../../utils/auth.js';
import { connectDB } from '../../lib/mongodb.js';
import { ObjectId } from 'mongodb';
import { 
  getAssemblyLanguageCode, 
  languageNeedsTranslation, 
  translateText, 
  getLanguageForAI,
  getAvailableFeatures,
  getLanguageCodeFromAssemblyCode
} from '../../utils/languages.js';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const token = getTokenFromRequest(req);
    const decoded = verifyTokenString(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user ID from token
    const userId = decoded.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Invalid token - missing user ID' });
    }

    // Connect to database
    const { db } = await connectDB();

    // Parse form data
    const form = formidable({
      maxFileSize: 500 * 1024 * 1024, // 500MB
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);
    
    const file = files.file?.[0];
    if (!file) {
      console.error('❌ No file uploaded in request');
      return res.status(400).json({ 
        error: 'No file uploaded',
        errorType: 'VALIDATION_ERROR',
        details: 'files.file array is empty or undefined'
      });
    }

    console.log('📁 File details:', {
      originalFilename: file.originalFilename,
      mimetype: file.mimetype,
      size: file.size,
      filepath: file.filepath
    });

    // Validate file exists on disk
    if (!fs.existsSync(file.filepath)) {
      console.error('❌ File not found on disk:', file.filepath);
      return res.status(400).json({ 
        error: 'File not found on disk',
        errorType: 'FILE_NOT_FOUND',
        details: `Temporary file missing: ${file.filepath}`
      });
    }

    // Validate file type
    const supportedTypes = [
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/flac', 'audio/aac',
      'video/mp4', 'video/mov', 'video/avi', 'video/mkv', 'video/webm'
    ];
    
    if (!supportedTypes.includes(file.mimetype)) {
      console.error('❌ Unsupported file type:', file.mimetype);
      return res.status(400).json({ 
        error: 'Unsupported file type',
        errorType: 'INVALID_FILE_TYPE',
        details: `File type ${file.mimetype} not in supported types: ${supportedTypes.join(', ')}`
      });
    }

    // Check file size and warn about processing times
    const fileSizeInMB = file.size / (1024 * 1024);
    let estimatedTime = '3-8 minutes';
    
    if (fileSizeInMB > 100) {
      estimatedTime = '25-50 minutes for very large files';
      console.log(`⚠️ Very large file detected: ${fileSizeInMB.toFixed(2)}MB - Extended processing time expected`);
    } else if (fileSizeInMB > 50) {
      estimatedTime = '12-25 minutes for large files';
      console.log(`⚠️ Large file detected: ${fileSizeInMB.toFixed(2)}MB - Extended processing time expected`);
    } else if (fileSizeInMB > 20) {
      estimatedTime = '6-12 minutes';
      console.log(`📝 Medium file detected: ${fileSizeInMB.toFixed(2)}MB`);
    } else {
      console.log(`📝 Small file detected: ${fileSizeInMB.toFixed(2)}MB`);
    }

    // Validate file size (max 500MB)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      console.error('❌ File too large:', file.size);
      return res.status(400).json({ 
        error: 'File too large',
        errorType: 'FILE_TOO_LARGE',
        details: `File size ${fileSizeInMB.toFixed(2)}MB exceeds limit of 500MB`
      });
    }

    // Read file
    console.log('📖 Reading file from disk...');
    let fileBuffer;
    try {
      fileBuffer = fs.readFileSync(file.filepath);
      console.log('✅ File read successfully, buffer size:', fileBuffer.length);
    } catch (error) {
      console.error('❌ Error reading file:', error);
      return res.status(500).json({ 
        error: 'Failed to read file',
        errorType: 'FILE_READ_ERROR',
        details: error.message
      });
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `${userId}/${timestamp}_${file.originalFilename}`;
    
    console.log('☁️ Uploading to R2:', fileName);
    
    // Upload to R2
    let uploadResult;
    try {
      uploadResult = await uploadFile(fileBuffer, fileName, file.mimetype);
      if (!uploadResult.success) {
        console.error('❌ R2 upload failed:', uploadResult);
        return res.status(500).json({ 
          error: 'Failed to upload file to storage',
          errorType: 'STORAGE_UPLOAD_FAILED',
          details: uploadResult.error || 'Unknown storage error'
        });
      }
      console.log('✅ R2 upload result:', uploadResult);
    } catch (error) {
      console.error('❌ R2 upload error:', error);
      return res.status(500).json({ 
        error: 'Failed to upload file to storage',
        errorType: 'STORAGE_UPLOAD_ERROR',
        details: error.message
      });
    }

    // Get transcription settings
    const settings = {
      language: fields.language?.[0] || 'en',
      quality: fields.quality?.[0] || 'enhanced', // Default to enhanced for Gladia
      speakerIdentification: fields.speakerIdentification?.[0] === 'true',
      includeTimestamps: fields.includeTimestamps?.[0] === 'true',
      filterProfanity: fields.filterProfanity?.[0] === 'true',
      autoPunctuation: fields.autoPunctuation?.[0] === 'true',
    };

    console.log('⚙️ Enhanced Gladia transcription settings:', settings);

    // Create file record in MongoDB
    const fileRecord = {
      userId: userId,
      name: file.originalFilename,
      size: file.size,
      type: file.mimetype,
      url: uploadResult.url,
      key: uploadResult.key,
      status: 'processing',
      settings,
      provider: 'gladia', // Mark as Gladia transcription
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('💾 Creating MongoDB record:', { ...fileRecord, userId: 'REDACTED' });

    let result;
    try {
      result = await db.collection('files').insertOne(fileRecord);
      console.log('✅ MongoDB record created:', result.insertedId);
    } catch (error) {
      console.error('❌ MongoDB insert error:', error);
      // Try to clean up uploaded file
      try {
        await deleteFile(uploadResult.key);
        console.log('🧹 Cleaned up uploaded file after DB error');
      } catch (deleteError) {
        console.error('❌ Failed to clean up file:', deleteError);
      }
      return res.status(500).json({ 
        error: 'Failed to save file record',
        errorType: 'DATABASE_ERROR',
        details: error.message
      });
    }

    const fileId = result.insertedId.toString();

    // Start Gladia transcription process (async)
    console.log('🎯 Starting enhanced Gladia transcription process for file:', fileId);
    try {
      // Fire and forget - don't await this to avoid Vercel timeout
      setImmediate(() => {
        processGladiaTranscription(fileId, uploadResult.url, settings).catch(error => {
          console.error('❌ Async Gladia transcription error:', error);
        });
      });
      console.log('✅ Enhanced Gladia transcription process initiated asynchronously');
    } catch (error) {
      console.error('❌ Error starting Gladia transcription:', error);
      // Don't return error here as file is already saved
    }

    // Clean up temp file
    try {
      fs.unlinkSync(file.filepath);
      console.log('🧹 Temporary file cleaned up:', file.filepath);
    } catch (error) {
      console.error('⚠️ Warning: Failed to clean up temp file:', error);
      // Don't return error as this is not critical
    }

    res.status(200).json({
      success: true,
      fileId: fileId,
      message: 'File uploaded and enhanced transcription started with Gladia',
      filename: file.originalFilename,
      fileSize: `${fileSizeInMB.toFixed(2)}MB`,
      estimatedTime: estimatedTime,
      provider: 'gladia',
      note: fileSizeInMB > 50 ? 'Large files may take 25-50 minutes to process with enhanced quality. You can check status in the dashboard.' : 'Enhanced processing started successfully with Gladia.'
    });

  } catch (error) {
    console.error('Gladia upload error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: new Date().toISOString()
    });
    
    // Return more specific error information
    const errorResponse = {
      error: 'Enhanced upload failed',
      details: error.message || 'Unknown error occurred',
      errorType: error.name || 'Error',
      timestamp: new Date().toISOString(),
      provider: 'gladia'
    };
    
    // Add environment check details for debugging
    const missingConfigs = [];
    if (!process.env.GLADIA_API_KEY) missingConfigs.push('GLADIA_API_KEY');
    if (!process.env.R2_ACCESS_KEY_ID) missingConfigs.push('R2_ACCESS_KEY_ID');
    if (!process.env.R2_SECRET_ACCESS_KEY) missingConfigs.push('R2_SECRET_ACCESS_KEY');
    if (!process.env.R2_ACCOUNT_ID) missingConfigs.push('R2_ACCOUNT_ID');
    if (!process.env.R2_BUCKET_NAME) missingConfigs.push('R2_BUCKET_NAME');
    if (!process.env.MONGODB_URI) missingConfigs.push('MONGODB_URI');
    
    if (missingConfigs.length > 0) {
      errorResponse.missingConfig = missingConfigs;
    }
    
    res.status(500).json(errorResponse);
  }
}

async function processGladiaTranscription(fileId, fileUrl, settings) {
  try {
    const { db } = await connectDB();
    await db.collection('files').updateOne(
      { _id: new ObjectId(fileId) },
      { $set: { status: 'processing', updatedAt: new Date() } }
    );

    console.log('🚀 Starting enhanced Gladia transcription process');
    console.log('🔗 Audio URL:', fileUrl);
    console.log('⚙️ Settings:', settings);

    // Step 1: Upload file to Gladia (they need their own URL)
    console.log('📤 Uploading file to Gladia...');
    
    // Fetch the file from our R2 URL first
    console.log('📥 Fetching file from R2 URL for Gladia upload...');
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      throw new Error(`Failed to fetch file from R2: ${fileResponse.status} ${fileResponse.statusText}`);
    }
    
    const fileBlob = await fileResponse.blob();
    
    // Create FormData with the fetched file
    const uploadFormData = new FormData();
    uploadFormData.append('audio', fileBlob);
    
    const uploadResponse = await fetch('https://api.gladia.io/v2/upload', {
      method: 'POST',
      headers: {
        'x-gladia-key': process.env.GLADIA_API_KEY,
      },
      body: uploadFormData,
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      throw new Error(`Gladia upload failed: ${errorData.error || 'Unknown error'} (Status: ${uploadResponse.status})`);
    }

    const uploadData = await uploadResponse.json();
    const gladiaAudioUrl = uploadData.audio_url;
    console.log('✅ File uploaded to Gladia:', gladiaAudioUrl);

    // Step 2: Submit transcription request
    const requestBody = {
      audio_url: gladiaAudioUrl,
      detect_language: true, // Auto-detect language
    };

    // Configure diarization for speaker identification
    if (settings.speakerIdentification) {
      requestBody.diarization = true;
      requestBody.diarization_config = {
        number_of_speakers: null, // Auto-detect
        min_speakers: 1,
        max_speakers: 10,
      };
    }

    // Configure subtitles for timestamps
    if (settings.includeTimestamps) {
      requestBody.subtitles = true;
      requestBody.subtitles_config = {
        formats: ['srt', 'vtt']
      };
    }

    // Configure profanity filtering
    if (settings.filterProfanity) {
      requestBody.enable_profanity_filter = true;
    }

    // Set language hint if not English
    if (settings.language && settings.language !== 'en') {
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

    // Step 3: Poll for results
    await pollGladiaTranscriptionStatus(fileId, transcriptionData.id, transcriptionData.result_url, settings);

  } catch (error) {
    console.error('❌ Gladia transcription processing error:', error);
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
        console.log('📝 Generating summary...');
        const summaryResult = await generateSummary(transcriptText, detectedLanguage);

        // Update database with results
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
              duration: transcriptionResult.metadata?.audio_duration || 0,
              wordCount: transcriptionResult.words?.length || 0,
              language: detectedLanguage,
              provider: 'gladia',
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

// Reuse the existing summary generation function
async function generateSummary(text, targetLanguage = 'en') {
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
  const fallback = generateFallbackSummary(text, languageName);
  return {
    summary: `Enhanced: ${fallback.summary}`,
    topics: fallback.topics,
    topic: fallback.topic,
    insights: `Enhanced analysis: ${fallback.insights}`
  };
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