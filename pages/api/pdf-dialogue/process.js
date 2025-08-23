import { connectDB } from '../../../lib/mongodb';
import { verifyToken } from '../../../utils/auth';
import { ObjectId } from 'mongodb';
import pdf from 'pdf-parse';
import formidable from 'formidable';
import fs from 'fs';
import { getLanguageForAI } from '../../../utils/languages';
import { uploadFile } from '../../../utils/storage';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

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
    const token = req.headers.authorization?.replace('Bearer ', '');
    console.log('🔍 PDF Dialogue - Token received:', !!token);
    console.log('🔍 PDF Dialogue - Authorization header:', req.headers.authorization?.substring(0, 20) + '...');
    
    if (!token) {
      console.log('❌ PDF Dialogue - No token provided');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decoded = verifyToken(token);
    console.log('🔍 PDF Dialogue - Token decoded:', !!decoded);
    if (decoded) {
      console.log('👤 PDF Dialogue - User ID:', decoded.userId);
    }
    
    if (!decoded) {
      console.log('❌ PDF Dialogue - Token verification failed');
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decoded.userId;

    // Parse form data
    const form = formidable({
      maxFileSize: 50 * 1024 * 1024, // 50MB
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);
    const pdfFile = files.pdf?.[0];
    const mode = fields.mode?.[0] || 'dialogue';

    if (!pdfFile) {
      return res.status(400).json({ error: 'No PDF file provided' });
    }

    if (pdfFile.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'File must be a PDF' });
    }

    console.log('📄 Processing PDF:', pdfFile.originalFilename);
    console.log('🎭 Mode:', mode);

    // Step 1: Extract text from PDF
    let extractedText;
    try {
      extractedText = await extractTextFromPDF(pdfFile.filepath);
    } catch (pdfError) {
      console.error('❌ PDF extraction failed:', pdfError.message);
      return res.status(400).json({ 
        error: 'PDF processing failed', 
        details: pdfError.message 
      });
    }
    
    if (!extractedText || extractedText.length < 100) {
      return res.status(400).json({ 
        error: 'PDF appears to be empty or contains no readable text',
        details: 'The PDF must contain readable text content. Please ensure the PDF is not encrypted or corrupted.' 
      });
    }

    console.log('📝 Extracted text length:', extractedText.length);

    // Step 2: Generate script with Gemini
    let script;
    try {
      script = await generateScriptWithGemini(extractedText, mode);
    } catch (scriptError) {
      console.error('❌ Script generation failed:', scriptError.message);
      return res.status(500).json({ 
        error: 'Script generation failed', 
        details: scriptError.message 
      });
    }
    
    if (!script) {
      return res.status(500).json({ 
        error: 'Failed to generate script',
        details: 'No script was generated from the PDF content. Please try again or contact support.' 
      });
    }

    console.log('🎬 Generated script length:', script.length);

    // Check if this was a fallback script (basic template)
    const isBasicScript = script.includes('Person A: I\'d like to understand this document better') || 
                         script.includes('Welcome to today\'s discussion about this important document');

    // Step 3: Generate audio with eSpeak/System TTS
    let audioResult;
    try {
      audioResult = await generateAudioWithSystemTTS(script, mode);
    } catch (audioError) {
      console.error('❌ Audio generation failed, proceeding with text-only:', audioError.message);
      // Create a fallback result that indicates audio generation failed
      audioResult = await createEnhancedTextExperience(script, mode);
    }

    // Step 4: Save to database
    const { db } = await connectDB();
    const result = await db.collection('pdf_dialogues').insertOne({
      userId: new ObjectId(userId),
      filename: pdfFile.originalFilename,
      mode,
      extractedText: extractedText.substring(0, 5000), // Save first 5000 chars for reference
      script,
      audioUrl: audioResult.audioUrl,
      audioUrls: audioResult.audioUrls,
      textOnly: audioResult.textOnly || false, // May have audio now
      ttsProvider: audioResult.ttsProvider || 'Text-only',
      isBasicScript,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('✅ PDF dialogue created with ID:', result.insertedId);

    // Return the result
    res.status(200).json({
      id: result.insertedId,
      transcript: script,
      audioUrl: audioResult.audioUrl,
      audioUrls: audioResult.audioUrls,
      textOnly: audioResult.textOnly || true,
      mode,
      filename: pdfFile.originalFilename,
      isBasicScript,
      message: audioResult.message || (isBasicScript ? 'Script generated using template due to AI service limitations. The content is based on your PDF but uses a standard format.' : undefined),
      instructions: audioResult.instructions, // Include TTS instructions
    });

  } catch (error) {
    console.error('❌ PDF dialogue processing error:', error);
    res.status(500).json({ 
      error: 'Processing failed', 
      details: error.message 
    });
  }
}

// Extract text from PDF
async function extractTextFromPDF(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    
    // Try multiple PDF parsing approaches
    let text = '';
    
    try {
      // First attempt: Standard pdf-parse
      const data = await pdf(dataBuffer);
      text = data.text;
      console.log('✅ PDF parsed successfully with standard method');
    } catch (firstError) {
      console.log('⚠️ Standard PDF parsing failed, trying alternative method...');
      
      try {
        // Second attempt: With different options
        const data = await pdf(dataBuffer, {
          normalizeWhitespace: true,
          disableCombineTextItems: false,
          max: 50
        });
        text = data.text;
        console.log('✅ PDF parsed successfully with alternative method');
      } catch (secondError) {
        console.log('⚠️ Alternative PDF parsing failed, trying raw buffer approach...');
        
        // Third attempt: Check if it's an encrypted or password-protected PDF
        const bufferString = dataBuffer.toString('utf8');
        if (bufferString.includes('/Encrypt')) {
          throw new Error('PDF appears to be encrypted or password-protected. Please provide an unencrypted PDF.');
        }
        
        // Check if it's actually a PDF
        if (!bufferString.startsWith('%PDF')) {
          throw new Error('File does not appear to be a valid PDF format.');
        }
        
        // If all else fails, throw the original error with more context
        console.error('❌ All PDF parsing methods failed');
        console.error('First error:', firstError.message);
        console.error('Second error:', secondError.message);
        throw new Error(`PDF parsing failed. The PDF might be corrupted, encrypted, or in an unsupported format. Original error: ${firstError.message}`);
      }
    }
    
    // Clean up the text
    if (text) {
      // Remove page numbers, headers, footers (basic cleanup)
      text = text.replace(/Page \d+/gi, '');
      text = text.replace(/^\d+\s*$/gm, ''); // Remove standalone numbers
      text = text.replace(/\s+/g, ' '); // Normalize whitespace
      text = text.trim();
    }
    
    if (!text || text.length < 10) {
      throw new Error('PDF appears to contain no readable text or the text could not be extracted.');
    }
    
    return text;
  } catch (error) {
    console.error('❌ PDF extraction error:', error);
    throw error;
  }
}

// Generate script with Gemini
async function generateScriptWithGemini(text, mode) {
  try {
    const languageName = 'English'; // Default to English for now
    
    let prompt;
    if (mode === 'dialogue') {
      prompt = `You are given the following document text:

${text}

Create a natural dialogue between two people discussing this document. IMPORTANT: Each person must speak in COMPLETE SENTENCES only.

Person A: A curious person asking thoughtful questions (use British female voice)
Person B: A knowledgeable person providing clear explanations (use British male voice)

RULES:
1. Each line must be a COMPLETE sentence or thought
2. Never cut off mid-sentence - finish the complete idea
3. Minimum 15-20 words per line to ensure complete thoughts
4. Natural conversation flow with proper turn-taking
5. Cover all key points from the document
6. Make it engaging and informative

Format EXACTLY like this:

Person A: [Complete sentence asking about or commenting on the document - minimum 15 words]
Person B: [Complete sentence answering or explaining - minimum 15 words]  
Person A: [Complete sentence with follow-up question or observation - minimum 15 words]
Person B: [Complete sentence with detailed explanation - minimum 15 words]

Continue this pattern to cover the entire document content with complete, natural sentences.`;
    } else {
      prompt = `You are given the following document text:

${text}

Explain this document as if you are a teacher giving a spoken lecture.

Use simple, clear language.
Keep the tone engaging.
Do not repeat the text word-for-word — summarize and interpret.

Output as one continuous speech (no dialogue).

Create an informative and engaging lecture about this document.`;
    }

    console.log('🤖 Generating script with Gemini...');
    
    // Check if API key is available
    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY not found in environment variables');
      throw new Error('Gemini API key not configured');
    }
    
    // Try different models with better error handling
    const models = [
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-1.0-pro'
    ];
    
    let lastError = null;
    
    for (const model of models) {
      console.log(`🤖 Trying model: ${model}`);
      
      try {
        const requestBody = { 
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 4096,
          }
        };
        
        console.log(`🔄 Making request to Gemini API for ${model}...`);
        
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "User-Agent": "Mozilla/5.0 (compatible; PDF-Dialogue/1.0)"
            },
            body: JSON.stringify(requestBody)
          }
        );
        
        console.log(`📡 Response status for ${model}:`, response.status);
        
        // Handle quota exceeded specifically
        if (response.status === 429) {
          const errorText = await response.text();
          console.log(`⚠️ Model ${model} quota exceeded, skipping remaining models...`);
          lastError = new Error('Gemini API quota exceeded. Please try again later or contact support.');
          break; // Skip remaining models if quota is exceeded
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          console.log(`❌ Model ${model} failed with status ${response.status}:`, errorText);
          lastError = new Error(`${model} API error: ${response.status} - ${errorText}`);
          continue;
        }
        
        const data = await response.json();
        console.log(`📦 Response data for ${model}:`, JSON.stringify(data, null, 2).substring(0, 500) + '...');
        
        // Check for API errors in response
        if (data.error) {
          console.log(`❌ Model ${model} returned error:`, data.error);
          lastError = new Error(`${model} returned error: ${data.error.message || JSON.stringify(data.error)}`);
          continue;
        }
        
        const script = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        if (script && script.length > 50) {
          console.log(`✅ Successfully generated script using ${model} (${script.length} characters)`);
          return script.trim();
        } else {
          console.log(`⚠️ Model ${model} returned empty or too short script (${script.length} chars), trying next...`);
          lastError = new Error(`${model} returned empty or insufficient content`);
          continue;
        }
        
      } catch (error) {
        console.log(`❌ Model ${model} threw error:`, error.message);
        lastError = error;
        continue;
      }
    }
    
    // If all models failed, provide a basic template
    console.log('⚠️ All AI models failed, generating enhanced template...');
    const basicScript = generateBasicScript(text, mode);
    if (basicScript) {
      console.log('✅ Generated enhanced template script');
      console.log('💡 Note: Using template because AI services are temporarily unavailable');
      return basicScript;
    }
    
    // Create error message based on the type of failure
    let errorMessage = 'Failed to generate script';
    if (lastError?.message?.includes('quota') || lastError?.message?.includes('429')) {
      errorMessage = 'AI service quota exceeded. Using fallback script generation. Please try again later for AI-enhanced scripts.';
    } else if (lastError?.message?.includes('balance') || lastError?.message?.includes('402')) {
      errorMessage = 'AI service temporarily unavailable due to billing. Using fallback script generation.';
    } else {
      errorMessage = `AI services temporarily unavailable. Last error: ${lastError?.message || 'Unknown error'}`;
    }
    
    throw new Error(errorMessage);
    
  } catch (error) {
    console.error('❌ Script generation failed:', error);
    throw error;
  }
}

// Basic script template generation
function generateBasicScript(text, mode) {
  try {
    // Extract key information from the text
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const firstSentences = sentences.slice(0, 5).join('. ') + '.';
    const summary = firstSentences.length > 800 ? firstSentences.substring(0, 800) + '...' : firstSentences;
    
    // Try to identify key topics
    const keyWords = extractKeyWords(text);
    const topicsLine = keyWords.length > 0 ? `Key topics include: ${keyWords.slice(0, 8).join(', ')}.` : '';
    
    // Extract more content for longer scripts
    const middleSentences = sentences.slice(5, 10).join('. ');
    const additionalContent = middleSentences.length > 0 ? middleSentences + '.' : '';
    
    if (mode === 'dialogue') {
      return `Person A: I'd like to understand this document better. Can you help explain what it's about?

Person B: Of course! This document discusses several important points. ${summary}

Person A: That's interesting. What are the main topics I should focus on?

Person B: ${topicsLine} Let me break down the key information for you. ${additionalContent}

Person A: Can you tell me more about the specific details mentioned in the document?

Person B: Certainly. The document provides comprehensive information about the subject matter. It includes detailed explanations and important points that help readers understand the topic thoroughly.

Person A: What makes this information particularly valuable or significant?

Person B: The significance lies in how this information can be applied practically. The document presents concepts that are both theoretically sound and practically applicable in real-world scenarios.

Person A: Thank you for explaining that. This gives me a good understanding of the main concepts.

Person B: You're welcome! The document serves as a useful resource for anyone looking to learn more about this subject area.`;
    } else {
      return `Welcome to today's comprehensive discussion about this important document.

${summary}

${topicsLine}

The document presents valuable information that we'll explore together in detail. ${additionalContent}

Let me walk you through the main sections systematically. The information presented offers a foundation for deeper learning and application in real-world scenarios.

The document's structure is designed to guide readers through the concepts in a logical progression. This helps ensure that fundamental ideas are well understood before moving to more advanced topics.

Thank you for your attention to this important material. The insights gained from this document will prove valuable in your continued exploration of this subject area.`;
    }
  } catch (error) {
    console.error('Basic script generation failed:', error);
    // Absolute fallback
    return mode === 'dialogue' 
      ? `Person A: Can you tell me about this document?
Person B: This document contains important information that we should discuss in detail.
Person A: What makes it significant?
Person B: It covers key topics that are relevant to understanding the subject matter comprehensively.`
      : `This document presents important information for our consideration. It covers various topics that contribute to our understanding of the subject matter.`;
  }
}

// Generate audio with System TTS (eSpeak/Windows Speech)
async function generateAudioWithSystemTTS(script, mode) {
  try {
    console.log('🎵 Generating audio with System TTS...');
    
    if (mode === 'dialogue') {
      return await generateDialogueWithSystemTTS(script);
    } else {
      return await generateMonologueWithSystemTTS(script);
    }
    
  } catch (error) {
    console.error('❌ System TTS failed:', error);
    throw error;
  }
}

// Generate dialogue audio with System TTS (different voices for speakers)
async function generateDialogueWithSystemTTS(script) {
  try {
    console.log('🎭 Generating dialogue with System TTS...');
    
    // Parse the dialogue
    const lines = script.split('\n').filter(line => line.trim());
    const audioSegments = [];
    let personACount = 0;
    let personBCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.includes('Person A:')) {
        const text = line.replace('Person A:', '').trim();
        if (text && text.length > 3) {
          personACount++;
          console.log(`👩 Generating audio for Person A (line ${personACount}): "${text.substring(0, 50)}..."`);
          try {
            const audioUrl = await generateSingleAudioWithSystemTTS(text, 'female');
            audioSegments.push({ 
              speaker: 'A', 
              speakerName: 'Woman',
              text, 
              audioUrl,
              order: i
            });
          } catch (error) {
            console.log(`💭 TTS not available for Person A, continuing...`);
            // Continue with other segments even if one fails
          }
        }
      } else if (line.includes('Person B:')) {
        const text = line.replace('Person B:', '').trim();
        if (text && text.length > 3) {
          personBCount++;
          console.log(`👨 Generating audio for Person B (line ${personBCount}): "${text.substring(0, 50)}..."`);
          try {
            const audioUrl = await generateSingleAudioWithSystemTTS(text, 'male');
            audioSegments.push({ 
              speaker: 'B', 
              speakerName: 'Man',
              text, 
              audioUrl,
              order: i
            });
          } catch (error) {
            console.log(`💭 TTS not available for Person B, continuing...`);
            // Continue with other segments even if one fails
          }
        }
      }
    }
    
    console.log(`🎵 Generated ${audioSegments.length} audio segments (${personACount} female, ${personBCount} male)`);
    
    // Don't throw error if no audio - provide text-only experience
    if (audioSegments.length === 0) {
      console.log('💡 No audio segments generated - providing enhanced text-only experience');
      return {
        audioUrl: null,
        audioUrls: [],
        isDialogue: true,
        totalSegments: 0,
        femaleSegments: personACount,
        maleSegments: personBCount,
        ttsProvider: 'Text-only (MaryTTS not available)',
        fallbackMode: true,
        instructions: {
          title: 'Audio Generation Instructions',
          browserTTS: 'Copy any dialogue line and use browser "Read Aloud" feature',
          maryTTS: {
            install: [
              '1. Download MaryTTS: https://github.com/marytts/marytts/releases',
              '2. Extract to C:\\marytts\\',
              '3. Run: marytts-server.bat',
              '4. Refresh page for high-quality voices'
            ]
          }
        }
      };
    }
    
    // Sort segments by order to maintain dialogue sequence
    audioSegments.sort((a, b) => a.order - b.order);
    
    // Return the first audio segment as the main URL for initial playback
    const mainAudioUrl = audioSegments.length > 0 ? audioSegments[0].audioUrl : null;
    
    return {
      audioUrl: mainAudioUrl,
      audioUrls: audioSegments,
      isDialogue: true,
      totalSegments: audioSegments.length,
      femaleSegments: personACount,
      maleSegments: personBCount,
      ttsProvider: 'System TTS'
    };
    
  } catch (error) {
    console.error('❌ System TTS dialogue generation failed:', error);
    throw error;
  }
}

// Generate monologue audio with System TTS
async function generateMonologueWithSystemTTS(script) {
  try {
    console.log('🎤 Generating monologue with System TTS...');
    
    const audioUrl = await generateSingleAudioWithSystemTTS(script, 'neutral');
    
    return {
      audioUrl,
      audioUrls: [{ speaker: 'narrator', text: script, audioUrl }],
      ttsProvider: 'System TTS'
    };
    
  } catch (error) {
    console.error('❌ System TTS monologue generation failed:', error);
    throw error;
  }
}

// Generate single audio clip with System TTS
async function generateSingleAudioWithSystemTTS(text, voiceType = 'neutral') {
  try {
    console.log(`🎙️ Generating System TTS audio (${voiceType}): "${text.substring(0, 50)}..."`);
    
    // Clean and prepare text
    const cleanText = text.trim().replace(/['"]/g, '');
    if (cleanText.length === 0) {
      throw new Error('Text is empty');
    }
    
    // Truncate if too long for TTS
    let textToProcess = cleanText;
    if (cleanText.length > 1000) {
      const truncated = cleanText.substring(0, 1000);
      const lastSentenceEnd = Math.max(
        truncated.lastIndexOf('.'),
        truncated.lastIndexOf('!'),
        truncated.lastIndexOf('?')
      );
      
      if (lastSentenceEnd > 500) {
        textToProcess = truncated.substring(0, lastSentenceEnd + 1);
      } else {
        textToProcess = truncated + '...';
      }
    }
    
    // Generate audio using platform-specific TTS
    const audioBuffer = await generateAudioBuffer(textToProcess, voiceType);
    
    if (!audioBuffer || audioBuffer.length === 0) {
      throw new Error('System TTS returned empty audio buffer');
    }
    
    console.log(`🎵 Generated audio: ${audioBuffer.length} bytes`);
    
    // Upload to R2 storage
    const fileName = `pdf-dialogue/${Date.now()}-${Math.random().toString(36).substring(7)}.wav`;
    
    console.log(`📤 Uploading audio to R2: ${fileName}`);
    const uploadResult = await uploadFile(
      audioBuffer, 
      fileName, 
      'audio/wav'
    );
    
    if (!uploadResult.success) {
      throw new Error(`Failed to upload audio: ${uploadResult.error}`);
    }
    
    console.log('✅ Audio uploaded successfully:', uploadResult.url);
    return uploadResult.url;
    
  } catch (error) {
    // TTS generation failed, will fallback to text-only mode
    throw error;
  }
}

// Generate audio buffer using platform-specific TTS
async function generateAudioBuffer(text, voiceType) {
  try {
    const platform = process.platform;
    console.log(`🔧 Detected platform: ${platform}`);
    
    if (platform === 'win32') {
      return await generateWindowsTTS(text, voiceType);
    } else if (platform === 'linux') {
      return await generateLinuxTTS(text, voiceType);
    } else if (platform === 'darwin') {
      return await generateMacTTS(text, voiceType);
    } else {
      throw new Error(`Unsupported platform: ${platform}`);
    }
    
  } catch (error) {
    // Expected behavior - TTS may not be available, will fallback to text-only
    throw error;
  }
}

// Windows TTS using MaryTTS (preferred) or fallback to PowerShell SAPI
async function generateWindowsTTS(text, voiceType) {
  try {
    console.log('🎤 Attempting MaryTTS for Windows...');
    
    // First try MaryTTS
    try {
      return await generateMaryTTS(text, voiceType);
    } catch (maryError) {
      console.log('💡 MaryTTS not available, using enhanced text-only experience...');
      throw new Error('MaryTTS not available. Using text-only mode with comprehensive TTS instructions.');
    }
    
  } catch (error) {
    console.log('💭 Windows TTS not available, providing enhanced text-only experience...');
    throw error;
  }
}

// MaryTTS implementation (cross-platform open-source TTS)
async function generateMaryTTS(text, voiceType) {
  try {
    console.log('🎤 Using MaryTTS...');
    
    // MaryTTS voice selection
    let voice = '';
    switch (voiceType) {
      case 'female':
        voice = 'cmu-slt-hsmm'; // Female voice
        break;
      case 'male':
        voice = 'cmu-bdl-hsmm'; // Male voice
        break;
      default:
        voice = 'cmu-slt-hsmm'; // Default female
    }
    
    // Create temp directory for audio files
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const outputFile = path.join(tempDir, `marytts_${Date.now()}.wav`);
    
    // Try MaryTTS HTTP API first (if server is running)
    try {
      const maryUrl = 'http://localhost:59125/process';
      const params = new URLSearchParams({
        INPUT_TYPE: 'TEXT',
        OUTPUT_TYPE: 'AUDIO',
        AUDIO: 'WAVE',
        LOCALE: 'en_US',
        VOICE: voice,
        INPUT_TEXT: text
      });
      
      console.log('🌐 Trying MaryTTS HTTP API...');
      const response = await fetch(`${maryUrl}?${params}`);
      
      if (response.ok) {
        const audioBuffer = await response.arrayBuffer();
        console.log('✅ MaryTTS HTTP API successful');
        return Buffer.from(audioBuffer);
      } else {
        throw new Error('MaryTTS HTTP API not available');
      }
      
    } catch (httpError) {
      // Try command-line MaryTTS
      console.log('🖥️ Trying MaryTTS command-line...');
      
      const maryCommand = process.platform === 'win32' 
        ? `mary-client.bat --input_text "${text.replace(/"/g, '""')}" --output_file "${outputFile}" --voice ${voice}`
        : `mary-client --input_text "${text}" --output_file "${outputFile}" --voice ${voice}`;
      
      const { stdout, stderr } = await execAsync(maryCommand);
      
      if (stderr && !stderr.includes('Warning')) {
        throw new Error(`MaryTTS command failed: ${stderr}`);
      }
      
      // Read the generated audio file
      if (fs.existsSync(outputFile)) {
        const audioBuffer = fs.readFileSync(outputFile);
        // Clean up temp file
        fs.unlinkSync(outputFile);
        console.log('✅ MaryTTS command-line successful');
        return audioBuffer;
      } else {
        throw new Error('MaryTTS did not generate audio file');
      }
    }
    
  } catch (error) {
    console.log('❌ MaryTTS failed:', error.message);
    throw error;
  }
}

// Linux TTS using eSpeak
async function generateLinuxTTS(text, voiceType) {
  try {
    console.log('🐧 Attempting MaryTTS for Linux...');
    
    // First try MaryTTS
    try {
      return await generateMaryTTS(text, voiceType);
    } catch (maryError) {
      console.log('💡 MaryTTS not available, trying eSpeak...');
      
      // Fallback to eSpeak
      let voiceParams = '';
      switch (voiceType) {
        case 'female':
          voiceParams = '-v en+f3 -p 50 -s 160'; // Female voice, higher pitch, normal speed
          break;
        case 'male':
          voiceParams = '-v en+m3 -p 30 -s 150'; // Male voice, lower pitch, slightly slower
          break;
        default:
          voiceParams = '-v en -p 40 -s 155'; // Default voice
      }
      
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const outputFile = path.join(tempDir, `tts_${Date.now()}.wav`);
      const command = `espeak ${voiceParams} -w "${outputFile}" "${text}"`;
      
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr) {
        console.log('⚠️ eSpeak warning:', stderr);
      }
      
      if (fs.existsSync(outputFile)) {
        const audioBuffer = fs.readFileSync(outputFile);
        fs.unlinkSync(outputFile);
        console.log('✅ eSpeak successful as fallback');
        return audioBuffer;
      } else {
        throw new Error('eSpeak did not generate audio file');
      }
    }
    
  } catch (error) {
    console.log('❌ Linux TTS failed:', error.message);
    throw error;
  }
}

// macOS TTS using MaryTTS (preferred) or fallback to say command
async function generateMacTTS(text, voiceType) {
  try {
    console.log('🍎 Attempting MaryTTS for macOS...');
    
    // First try MaryTTS
    try {
      return await generateMaryTTS(text, voiceType);
    } catch (maryError) {
      console.log('💡 MaryTTS not available, trying macOS say command...');
      
      // Fallback to say command
      let voiceName = '';
      switch (voiceType) {
        case 'female':
          voiceName = 'Samantha'; // Female voice
          break;
        case 'male':
          voiceName = 'Alex'; // Male voice
          break;
        default:
          voiceName = 'Samantha'; // Default female
      }
      
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const outputFile = path.join(tempDir, `tts_${Date.now()}.wav`);
      const command = `say -v "${voiceName}" -o "${outputFile}" --data-format=LEF32@22050 "${text}"`;
      
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr) {
        console.log('⚠️ macOS say warning:', stderr);
      }
      
      if (fs.existsSync(outputFile)) {
        const audioBuffer = fs.readFileSync(outputFile);
        fs.unlinkSync(outputFile);
        console.log('✅ macOS say successful as fallback');
        return audioBuffer;
      } else {
        throw new Error('macOS say did not generate audio file');
      }
    }
    
  } catch (error) {
    console.log('❌ macOS TTS failed:', error.message);
    throw error;
  }
}

// Extract key words from text
function extractKeyWords(text) {
  try {
    // Simple keyword extraction
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 4)
      .filter(word => !['the', 'and', 'that', 'this', 'with', 'from', 'they', 'have', 'been', 'were', 'will', 'would', 'could', 'should', 'their', 'there', 'where', 'which', 'what', 'when', 'while'].includes(word));
    
    // Count frequency
    const freq = {};
    words.forEach(word => {
      freq[word] = (freq[word] || 0) + 1;
    });
    
    // Get most frequent words
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  } catch (error) {
    return [];
  }
}

// Create enhanced text-only experience with detailed TTS instructions
async function createEnhancedTextExperience(script, mode) {
  try {
    console.log('📝 Creating enhanced text-only experience with MaryTTS instructions...');
    
    if (mode === 'dialogue') {
      return await createDialogueTextExperience(script);
    } else {
      return await createMonologueTextExperience(script);
    }
    
  } catch (error) {
    console.error('❌ Enhanced text experience creation failed:', error);
    throw error;
  }
}

// Create dialogue text experience with speaker identification and TTS instructions
async function createDialogueTextExperience(script) {
  try {
    console.log('🎭 Creating dialogue text experience with TTS instructions...');
    
    // Parse the dialogue and create enhanced segments
    const lines = script.split('\n').filter(line => line.trim());
    const textSegments = [];
    let personACount = 0;
    let personBCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.includes('Person A:')) {
        const text = line.replace('Person A:', '').trim();
        if (text && text.length > 3) {
          personACount++;
          textSegments.push({ 
            speaker: 'A', 
            speakerName: 'Woman',
            text, 
            audioUrl: null,
            order: i,
            voiceInstructions: '👩 Use a female voice for this segment'
          });
        }
      } else if (line.includes('Person B:')) {
        const text = line.replace('Person B:', '').trim();
        if (text && text.length > 3) {
          personBCount++;
          textSegments.push({ 
            speaker: 'B', 
            speakerName: 'Man',
            text, 
            audioUrl: null,
            order: i,
            voiceInstructions: '👨 Use a male voice for this segment'
          });
        }
      }
    }
    
    console.log(`📝 Created ${textSegments.length} text segments (${personACount} female, ${personBCount} male)`);
    
    // Sort segments by order to maintain dialogue sequence
    textSegments.sort((a, b) => a.order - b.order);
    
    return {
      audioUrl: null,
      audioUrls: textSegments,
      isDialogue: true,
      textOnly: true,
      totalSegments: textSegments.length,
      femaleSegments: personACount,
      maleSegments: personBCount,
      message: '🎵 Text-to-Speech Ready! Copy each segment to any TTS service using the voice instructions provided.',
      instructions: {
        title: '🎤 How to Create Audio from This Dialogue',
        description: 'Use any text-to-speech service to convert this dialogue to audio with male and female voices.',
        quickStart: [
          '1. Copy text segments below',
          '2. Use suggested voice settings',
          '3. Generate audio with any TTS service',
          '4. Play segments in order for complete dialogue'
        ],
        voiceSettings: {
          female: '👩 For "Person A" segments: Select a female/feminine voice',
          male: '👨 For "Person B" segments: Select a male/masculine voice'
        },
        recommendedServices: [
          {
            name: '� MaryTTS (Recommended)',
            description: 'High-quality open-source TTS - Download from GitHub releases',
            pros: 'Best quality, local processing, male/female voices (cmu-bdl-hsmm/cmu-slt-hsmm)',
            setup: 'Download from marytts/marytts releases, run marytts-server, access at localhost:59125'
          },
          {
            name: '�🌐 Microsoft Edge Browser',
            description: 'Built-in "Read Aloud" - right-click text and select "Read aloud"',
            pros: 'Free, high quality, multiple voices'
          },
          {
            name: '🔤 Google Translate',
            description: 'Visit translate.google.com, paste text, click speaker icon',
            pros: 'Free, accessible, simple to use'
          },
          {
            name: '📱 Mobile Device TTS',
            description: 'Enable accessibility TTS, select text, choose "Speak"',
            pros: 'Always available, built-in voices'
          },
          {
            name: '🎙️ Natural Reader',
            description: 'Professional TTS at naturalreaders.com',
            pros: 'High quality voices, speed control'
          }
        ],
        tips: [
          'Copy each speaker\'s text separately for best voice consistency',
          'Adjust speech speed for comfortable listening',
          'Some services allow voice pitch adjustment for better male/female distinction',
          'Record each segment if you want to save the audio'
        ]
      }
    };
    
  } catch (error) {
    console.error('❌ Dialogue text experience creation failed:', error);
    throw error;
  }
}

// Create monologue text experience with TTS instructions
async function createMonologueTextExperience(script) {
  try {
    console.log('🎤 Creating monologue text experience with TTS instructions...');
    
    return {
      audioUrl: null,
      audioUrls: [{ 
        speaker: 'narrator', 
        speakerName: 'Narrator',
        text: script, 
        audioUrl: null,
        voiceInstructions: '🎙️ Use a clear, professional voice for this monologue'
      }],
      textOnly: true,
      message: '🎵 Text-to-Speech Ready! Copy the text below to any TTS service for audio generation.',
      instructions: {
        title: '🎤 How to Create Audio from This Monologue',
        description: 'Use any text-to-speech service to convert this monologue to audio.',
        quickStart: [
          '1. Copy the text below',
          '2. Choose a clear, professional voice',
          '3. Generate audio with any TTS service',
          '4. Adjust speed for comfortable listening'
        ],
        voiceSettings: {
          recommended: '🎙️ Use a clear, professional voice (male or female)',
          tone: 'Select a neutral, informative tone'
        },
        recommendedServices: [
          {
            name: '🌐 Microsoft Edge Browser',
            description: 'Right-click text and select "Read aloud"',
            pros: 'Free, high quality, easy to use'
          },
          {
            name: '🔤 Google Translate',
            description: 'Paste text at translate.google.com, click speaker',
            pros: 'Free, accessible worldwide'
          },
          {
            name: '📱 Mobile TTS',
            description: 'Use built-in accessibility text-to-speech',
            pros: 'Always available, various voices'
          },
          {
            name: '🎙️ Natural Reader',
            description: 'Professional service at naturalreaders.com',
            pros: 'Premium voices, controls'
          }
        ],
        tips: [
          'Choose a speed that matches natural speaking pace',
          'Professional/business voices work well for educational content',
          'Consider recording the audio if you want to save it',
          'Break into smaller segments if the text is very long'
        ]
      }
    };
    
  } catch (error) {
    console.error('❌ Monologue text experience creation failed:', error);
    throw error;
  }
}