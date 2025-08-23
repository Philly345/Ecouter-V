// MaryTTS Synthesis API Endpoint
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const execAsync = promisify(exec);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, voice = 'cmu-slt-hsmm', emotion = 'neutral', speed = 1.0 } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    console.log(`🎤 MaryTTS synthesis request: "${text.substring(0, 50)}..." with voice: ${voice}`);

    // Try HTTP API (preferred method)
    try {
      console.log('🌐 Trying MaryTTS HTTP API...');
      const audioBuffer = await synthesizeWithHTTP(text, voice, emotion, speed);
      
      console.log('✅ MaryTTS HTTP API successful!');
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Content-Disposition', 'attachment; filename="speech.wav"');
      return res.send(Buffer.from(audioBuffer));
      
    } catch (httpError) {
      console.log('❌ MaryTTS HTTP API failed:', httpError.message);
      
      // Return helpful instructions instead of trying command line
      return res.status(200).json({
        success: false,
        fallback: true,
        error: 'MaryTTS server not running',
        instructions: getMaryTTSInstructions(text, voice),
        quickStart: {
          title: '🚀 Quick MaryTTS Setup',
          steps: [
            '1. Download MaryTTS 5.2 from GitHub releases',
            '2. Extract anywhere on your computer',
            '3. Run: bin/marytts-server (or bin\\marytts-server.bat on Windows)',
            '4. Wait for "MaryTTS server started" message',
            '5. Refresh this page and try again!'
          ],
          downloadUrl: 'https://github.com/marytts/marytts/releases/download/v5.2/marytts-5.2.zip'
        },
        message: 'Install MaryTTS for high-quality voice generation'
      });
    }

  } catch (error) {
    console.error('🔥 MaryTTS synthesis error:', error);
    res.status(500).json({ 
      error: 'Synthesis failed',
      fallback: true,
      instructions: getMaryTTSInstructions(req.body.text || 'Sample text', req.body.voice || 'cmu-slt-hsmm')
    });
  }
}

// HTTP API method (when MaryTTS server is running)
async function synthesizeWithHTTP(text, voice, emotion, speed) {
  const maryUrl = 'http://localhost:59125/process';
  
  // Clean text for MaryTTS
  const cleanText = text.replace(/[^\w\s.,!?-]/g, '').trim();
  
  const params = new URLSearchParams({
    INPUT_TYPE: 'TEXT',
    OUTPUT_TYPE: 'AUDIO',
    AUDIO: 'WAVE',
    LOCALE: 'en_US',
    VOICE: voice,
    INPUT_TEXT: cleanText
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${maryUrl}?${params}`, {
      method: 'GET',
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`MaryTTS HTTP error: ${response.status} - ${response.statusText}`);
    }

    return await response.arrayBuffer();
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

// Command line method (fallback) - Simplified approach
async function synthesizeWithCommand(text, voice, emotion, speed) {
  // For now, skip command line and go straight to fallback
  // The command-line interface varies too much between MaryTTS versions
  throw new Error('Command line TTS not available - please use MaryTTS server mode');
}

// Generate comprehensive TTS instructions
function getMaryTTSInstructions(text, voice) {
  return {
    text,
    voice,
    browserTTS: {
      title: "Use Browser Text-to-Speech",
      instructions: [
        "1. Copy the text below",
        "2. Paste into any text field",
        "3. Select the text",
        "4. Right-click → 'Read Aloud' (Edge) or use system TTS"
      ]
    },
    maryTTSInstall: {
      title: "Install MaryTTS for High-Quality Voice",
      windows: [
        "1. Download: https://github.com/marytts/marytts/releases",
        "2. Extract to C:\\marytts\\",
        "3. Add C:\\marytts\\bin to PATH",
        "4. Run: marytts-server.bat",
        "5. Refresh this page"
      ],
      linux: [
        "1. sudo apt install openjdk-8-jdk",
        "2. wget https://github.com/marytts/marytts/releases/download/v5.2/marytts-5.2.zip",
        "3. unzip marytts-5.2.zip && cd marytts-5.2",
        "4. ./bin/marytts-server",
        "5. Refresh this page"
      ]
    },
    alternativeTTS: {
      title: "Alternative TTS Options",
      options: [
        "• Google Translate: Paste text → Click speaker icon",
        "• Edge Read Aloud: Built-in browser TTS",
        "• Windows Narrator: Win+Ctrl+Enter",
        "• macOS VoiceOver: Cmd+F5",
        "• Mobile: Select text → Speak option"
      ]
    },
    voiceRecommendations: {
      [voice]: `Recommended voice: ${voice}`,
      alternatives: [
        "cmu-slt-hsmm (Female, clear)",
        "cmu-bdl-hsmm (Male, natural)",
        "cmu-awb-hsmm (Male, deep)",
        "cmu-rms-hsmm (Male, smooth)"
      ]
    }
  };
}

// Configure Next.js API
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}