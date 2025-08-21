import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import formidable from 'formidable';
import fs from 'fs';
import { uploadFile, deleteFile } from '../../utils/storage.js';
import { verifyToken, getTokenFromRequest } from '../../utils/auth.js';
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
    let estimatedTime = '2-5 minutes';
    
    if (fileSizeInMB > 100) {
      estimatedTime = '20-45 minutes for very large files';
      console.log(`⚠️ Very large file detected: ${fileSizeInMB.toFixed(2)}MB - Extended processing time expected`);
    } else if (fileSizeInMB > 50) {
      estimatedTime = '10-20 minutes for large files';
      console.log(`⚠️ Large file detected: ${fileSizeInMB.toFixed(2)}MB - Extended processing time expected`);
    } else if (fileSizeInMB > 20) {
      estimatedTime = '5-10 minutes';
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
    const userId = user.id || user._id.toString();
    const fileName = `${userId}/${timestamp}_${file.originalFilename}`;
    
    console.log('☁️ Uploading to R2:', fileName);
    
    // Upload to R2
    let uploadResult;
    try {
      uploadResult = await uploadFile(fileBuffer, fileName, file.mimetype);
      if (!uploadResult.success) {
        console.error('❌ R2 upload failed:', uploadResult);
        // Log all relevant env vars for debugging
        console.error('R2_BUCKET_NAME:', process.env.R2_BUCKET_NAME);
        console.error('R2_PUBLIC_URL:', process.env.R2_PUBLIC_URL);
        console.error('R2_ACCOUNT_ID:', process.env.R2_ACCOUNT_ID);
        console.error('R2_ACCESS_KEY_ID:', process.env.R2_ACCESS_KEY_ID ? '[set]' : '[missing]');
        console.error('R2_SECRET_ACCESS_KEY:', process.env.R2_SECRET_ACCESS_KEY ? '[set]' : '[missing]');
        return res.status(500).json({ 
          error: 'Failed to upload file to storage',
          errorType: 'STORAGE_UPLOAD_FAILED',
          details: uploadResult.error || 'Unknown storage error',
          r2Debug: {
            bucket: process.env.R2_BUCKET_NAME,
            publicUrl: process.env.R2_PUBLIC_URL,
            accountId: process.env.R2_ACCOUNT_ID,
            accessKey: process.env.R2_ACCESS_KEY_ID ? '[set]' : '[missing]',
            secretKey: process.env.R2_SECRET_ACCESS_KEY ? '[set]' : '[missing]'
          }
        });
      }
      console.log('✅ R2 upload result:', uploadResult);
    } catch (error) {
      console.error('❌ R2 upload error:', error);
      // Log all relevant env vars for debugging
      console.error('R2_BUCKET_NAME:', process.env.R2_BUCKET_NAME);
      console.error('R2_PUBLIC_URL:', process.env.R2_PUBLIC_URL);
      console.error('R2_ACCOUNT_ID:', process.env.R2_ACCOUNT_ID);
      console.error('R2_ACCESS_KEY_ID:', process.env.R2_ACCESS_KEY_ID ? '[set]' : '[missing]');
      console.error('R2_SECRET_ACCESS_KEY:', process.env.R2_SECRET_ACCESS_KEY ? '[set]' : '[missing]');
      return res.status(500).json({ 
        error: 'Failed to upload file to storage',
        errorType: 'STORAGE_UPLOAD_ERROR',
        details: error.message,
        r2Debug: {
          bucket: process.env.R2_BUCKET_NAME,
          publicUrl: process.env.R2_PUBLIC_URL,
          accountId: process.env.R2_ACCOUNT_ID,
          accessKey: process.env.R2_ACCESS_KEY_ID ? '[set]' : '[missing]',
          secretKey: process.env.R2_SECRET_ACCESS_KEY ? '[set]' : '[missing]'
        }
      });
    }

    // Get transcription settings
    const settings = {
      language: fields.language?.[0] || 'en',
      quality: fields.quality?.[0] || 'standard',
      speakerIdentification: fields.speakerIdentification?.[0] === 'true',
      includeTimestamps: fields.includeTimestamps?.[0] === 'true',
      filterProfanity: fields.filterProfanity?.[0] === 'true',
      autoPunctuation: fields.autoPunctuation?.[0] === 'true',
    };

    console.log('⚙️ Transcription settings:', settings);

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

    // Start transcription process (async)
    console.log('🎯 Starting transcription process for file:', fileId);
    try {
      // Fire and forget - don't await this to avoid Vercel timeout
      setImmediate(() => {
        processTranscription(fileId, uploadResult.url, settings).catch(error => {
          console.error('? Async transcription error:', error);
        });
      });
      console.log('✅ Transcription process initiated asynchronously');
    } catch (error) {
      console.error('❌ Error starting transcription:', error);
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
      message: 'File uploaded and transcription started',
      filename: file.originalFilename,
      fileSize: `${fileSizeInMB.toFixed(2)}MB`,
      estimatedTime: estimatedTime,
      note: fileSizeInMB > 50 ? 'Large files may take 20-45 minutes to process. You can check status in the dashboard.' : 'Processing started successfully.'
    });

  } catch (error) {
    console.error('Upload error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: new Date().toISOString()
    });
    
    // Return more specific error information
    const errorResponse = {
      error: 'Upload failed',
      details: error.message || 'Unknown error occurred',
      errorType: error.name || 'Error',
      timestamp: new Date().toISOString(),
    };
    
    // Add environment check details for debugging
    const missingConfigs = [];
    if (!process.env.ASSEMBLYAI_API_KEY) missingConfigs.push('ASSEMBLYAI_API_KEY');
    if (!process.env.R2_ACCESS_KEY_ID) missingConfigs.push('R2_ACCESS_KEY_ID');
    if (!process.env.R2_SECRET_ACCESS_KEY) missingConfigs.push('R2_SECRET_ACCESS_KEY');
    if (!process.env.R2_ACCOUNT_ID) missingConfigs.push('R2_ACCOUNT_ID');
    if (!process.env.R2_BUCKET_NAME) missingConfigs.push('R2_BUCKET_NAME');
    if (!process.env.MONGODB_URI) missingConfigs.push('MONGODB_URI');
    
    if (missingConfigs.length > 0) {
      errorResponse.missingConfig = missingConfigs;
    }
    
    // Specific error handling
    if (error.message.includes('upload')) {
      errorResponse.error = 'File upload to storage failed';
      errorResponse.details = 'Check R2 configuration and network connectivity';
    } else if (error.message.includes('database') || error.message.includes('mongodb')) {
      errorResponse.error = 'Database connection failed';
      errorResponse.details = 'Check MongoDB connection string and database access';
    } else if (error.message.includes('form')) {
      errorResponse.error = 'File processing failed';
      errorResponse.details = 'Invalid file format or corrupted upload';
    }
    
    res.status(500).json(errorResponse);
  }
}

async function processTranscription(fileId, fileUrl, settings) {
  try {
    const { db } = await connectDB();
    await db.collection('files').updateOne(
      { _id: new ObjectId(fileId) },
      { $set: { status: 'processing', updatedAt: new Date() } }
    );

    // Language is now auto-detected, but we can use the user's hint for feature availability
    const availableFeatures = getAvailableFeatures(settings.language);

    const requestBody = {
      audio_url: fileUrl, // URL is already properly encoded
    };

    // Validate and clean the URL
    try {
      const url = new URL(fileUrl);
      console.log('URL validation - protocol:', url.protocol);
      console.log('URL validation - hostname:', url.hostname);
      console.log('URL validation - pathname:', url.pathname);
    } catch (urlError) {
      console.error('Invalid URL format:', urlError);
      throw new Error(`Invalid audio URL format: ${urlError.message}`);
    }
    
    // Enhanced speaker diarization with premium settings
    if (availableFeatures.speaker_labels && settings.speakerIdentification) {
      // Enable premium speaker diarization
      requestBody.speaker_labels = true;
      requestBody.speakers_expected = 2; // Expect exactly 2 speakers
      
      // Advanced diarization configuration
      requestBody.speaker_diarization = true;
      requestBody.speaker_diarization_config = {
        min_speakers: 2,
        max_speakers: 2,
        min_speaker_duration: 0.5, // More sensitive to short utterances
        speaker_switch_penalty: 0.1, // More likely to switch speakers
        audio_activity_detection: {
          enable: true,
          sensitivity: 0.9, // Very sensitive to speaker changes
          min_speaker_duration: 0.5 // Allow shorter speaker segments
        }
      };
      
      // Custom vocabulary for better recognition
      requestBody.word_boost = ['Prakash', 'Prakashji', 'Sir', 'Madam', 'Thank you', 'Okay'];
      requestBody.word_boost_param = 'high';
      
      // Enhanced audio analysis
      requestBody.audio_analysis = {
        speaker_separation: {
          enable: true,
          min_segment_length: 0.5, // Shorter segments for better accuracy
          max_speakers: 2,
          speaker_switch_sensitivity: 0.9 // More sensitive to speaker changes
        },
        content_safety: true, // Detect sensitive content
        iab_categories: true, // Categorize content
        auto_highlights: true, // Auto-highlight important content
        sentiment_analysis: true // Analyze sentiment
      };
      
      // Enable dual channel if available
      if (requestBody.audio_url && requestBody.audio_url.includes('_stereo')) {
        requestBody.dual_channel = true;
      }
    }
    if (availableFeatures.filter_profanity && settings.filterProfanity) {
      requestBody.filter_profanity = true;
    }
    if (availableFeatures.punctuate && settings.autoPunctuation) {
      requestBody.punctuate = true;
    }
    // AssemblyAI returns word-level timestamps by default when available
    if (settings.quality === 'enhanced') {
      requestBody.speech_model = 'best';
    }

    // Extra logging for debugging AssemblyAI submission
    console.log('==== AssemblyAI Submission Debug ====');
    console.log('AssemblyAI endpoint:', 'https://api.assemblyai.com/v2/transcript');
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    console.log('audio_url:', requestBody.audio_url);
    console.log('API Key present:', !!process.env.ASSEMBLYAI_API_KEY);
    console.log('API Key length:', process.env.ASSEMBLYAI_API_KEY ? process.env.ASSEMBLYAI_API_KEY.length : 0);
    console.log('API Key starts with:', process.env.ASSEMBLYAI_API_KEY ? process.env.ASSEMBLYAI_API_KEY.substring(0, 8) + '...' : 'N/A');
    console.log('API Key ends with:', process.env.ASSEMBLYAI_API_KEY ? '...' + process.env.ASSEMBLYAI_API_KEY.substring(process.env.ASSEMBLYAI_API_KEY.length - 4) : 'N/A');
    
    // Since large files work, the API key is valid - just log a warning if it seems short
    if (process.env.ASSEMBLYAI_API_KEY && process.env.ASSEMBLYAI_API_KEY.length < 40) {
      console.warn('⚠️ WARNING: API key seems short but proceeding since large files work');
      console.warn('⚠️ API key length:', process.env.ASSEMBLYAI_API_KEY.length);
    }
    
    console.log('✅ Proceeding with transcription request');
    console.log('====================================');

    const assemblyResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ASSEMBLYAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const transcriptData = await assemblyResponse.json();
    
    // Add more detailed error logging
    if (!assemblyResponse.ok) {
      console.error('AssemblyAI API Error Details:', {
        status: assemblyResponse.status,
        statusText: assemblyResponse.statusText,
        response: transcriptData,
        requestBody: requestBody,
        headers: {
          'Authorization': `Bearer ${process.env.ASSEMBLYAI_API_KEY.substring(0, 8)}...`,
          'Content-Type': 'application/json'
        }
      });
      
      // Try to get more specific error information
      if (transcriptData.error && transcriptData.error.includes('schema')) {
        console.error('🔍 Schema error detected - checking API documentation...');
        console.error('🔍 This might be an API version or endpoint issue');
      }
      
      throw new Error(`Failed to submit to AssemblyAI: ${transcriptData.error || transcriptData.message || 'Unknown error'} (Status: ${assemblyResponse.status})`);
    }
    
    if (!transcriptData.id) {
      console.error('AssemblyAI response missing ID:', transcriptData);
      throw new Error(`Failed to submit to AssemblyAI: No transcript ID returned`);
    }

    console.log(`AssemblyAI job submitted with ID: ${transcriptData.id}`);
    await pollTranscriptionStatus(fileId, transcriptData.id, settings);

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
  const maxAttempts = 360; // 30 minutes

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

        // Get the detected language, map it to our internal code
        const detectedAssemblyCode = data.language_code || 'en'; // Default to 'en' if not provided
        const detectedLanguage = getLanguageCodeFromAssemblyCode(detectedAssemblyCode);
        console.log(`🤖 Language detected: ${detectedAssemblyCode}, mapped to: ${detectedLanguage}`);

        // Use the detected language for all subsequent processing
        const currentLanguage = detectedLanguage;

        if (settings.speakerIdentification && data.utterances && data.utterances.length > 0) {
          speakers = extractSpeakers(data.utterances);
          
          // Create speaker mapping from A,B,C to 0,1,2...
          const speakerMap = new Map();
          let speakerIndex = 0;
          
          // Format transcript with Speaker numbers and timestamps
          const formattedUtterances = data.utterances.map(u => {
            // Map speaker letter to number
            if (!speakerMap.has(u.speaker)) {
              speakerMap.set(u.speaker, speakerIndex++);
            }
            const speakerNumber = speakerMap.get(u.speaker);
            
            // Format timestamp as HH:MM:SS
            const timestamp = formatTimestamp(u.start);
            
            return `Speaker ${speakerNumber}    ${timestamp}    ${u.text}`;
          });
          
          transcriptText = formattedUtterances.join('\n') + '\n\n[END]';
        }

        if (settings.includeTimestamps && data.words && data.words.length > 0) {
            timestamps = data.words.map(word => ({
                text: word.text,
                start: word.start,
                end: word.end,
                speaker: word.speaker || null
            }));
        }

        // Apply translation if the target language needs translation
        if (languageNeedsTranslation(currentLanguage)) {
          console.log(`🌐 Translating transcript from English to ${currentLanguage}...`);
          try {
            transcriptText = await translateText(transcriptText, currentLanguage, 'en');
            console.log('✅ Translation completed successfully');
            
            // Also translate speaker labels if present
            if (settings.speakerIdentification && data.utterances && data.utterances.length > 0) {
              // Create speaker mapping from A,B,C to 0,1,2...
              const speakerMap = new Map();
              let speakerIndex = 0;
              
              const translatedUtterances = [];
              for (const utterance of data.utterances) {
                const translatedText = await translateText(utterance.text, currentLanguage, 'en');
                
                // Map speaker letter to number
                if (!speakerMap.has(utterance.speaker)) {
                  speakerMap.set(utterance.speaker, speakerIndex++);
                }
                const speakerNumber = speakerMap.get(utterance.speaker);
                
                // Format timestamp as HH:MM:SS
                const timestamp = formatTimestamp(utterance.start);
                
                translatedUtterances.push(`Speaker ${speakerNumber}    ${timestamp}    ${translatedText}`);
              }
              transcriptText = translatedUtterances.join('\n') + '\n\n[END]';
            }
            
            // Update timestamps with translated text if needed
            if (settings.includeTimestamps && data.words && data.words.length > 0) {
              // For individual words, we'll keep the original English words in timestamps
              // but note that the main transcript is translated
              console.log('ℹ️ Word-level timestamps kept in original language for accuracy');
            }
          } catch (translationError) {
            console.error('❌ Translation failed:', translationError);
            console.log('📝 Using original English transcript');
            // Continue with English transcript if translation fails
          }
        }

        const summaryResult = await generateSummary(transcriptText, currentLanguage);

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
              language: currentLanguage, // Save the detected language
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
    
    // Try different models in order of preference
    const models = [
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-1.0-pro'
    ];
    
    for (const model of models) {
      console.log(`🔄 Trying model: ${model}`);
      
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
              console.log(`Gemini API (${model}) overloaded, retrying in ${delay}ms (attempt ${attempts}/${maxAttempts})`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            } else {
              console.log(`Model ${model} overloaded after all retries, trying next model...`);
              break; // Try next model
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
              break; // Try next model
            }
          }
          
          const data = await response.json();
          const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          
          const summaryMatch = generatedText.match(/SUMMARY:\s*(.+?)(?=TOPICS:|$)/s);
          const topicsMatch = generatedText.match(/TOPICS:\s*(.+?)(?=INSIGHTS:|$)/s);
          const insightsMatch = generatedText.match(/INSIGHTS:\s*(.+?)$/s);
          
          console.log(`✅ Successfully generated summary using ${model}`);
          
          return {
            summary: summaryMatch ? summaryMatch[1].trim() : 'Summary not available.',
            topics: topicsMatch ? topicsMatch[1].trim().split(",").map(t => t.trim()).filter(Boolean) : [],
            topic: topicsMatch ? topicsMatch[1].trim().split(",")[0].trim() : 'General',
            insights: insightsMatch ? insightsMatch[1].trim() : 'No insights generated.'
          };
          
        } catch (error) {
          attempts++;
          if (attempts >= maxAttempts) {
            console.log(`Model ${model} error after all retries, trying next model...`);
            break; // Try next model
          }
          const delay = baseDelay * Math.pow(2, attempts - 1);
          console.log(`Gemini API (${model}) error, retrying in ${delay}ms (attempt ${attempts}/${maxAttempts}):`, error.message);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // If all models failed, use fallback
    console.log('All Gemini models failed, using improved fallback summary');
    return generateFallbackSummary(truncatedText, languageName);
    
  } catch (error) {
    console.error('⚠️ Summary generation failed after all retries:', error);
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

// Helper function to format timestamp from milliseconds to HH:MM:SS
function formatTimestamp(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
