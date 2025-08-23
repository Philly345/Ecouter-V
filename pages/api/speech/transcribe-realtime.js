// Real-time Speech to Text API
import jwt from 'jsonwebtoken';
import { GoogleCloudSpeechAPI } from '../../../utils/speechToText';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify user authentication
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    const { audio, meetingId } = req.body;

    if (!audio) {
      return res.status(400).json({ error: 'Audio data is required' });
    }

    // Convert base64 audio to buffer
    const audioBuffer = Buffer.from(audio, 'base64');

    // Process with Speech-to-Text API
    let transcriptionResult;

    if (process.env.GOOGLE_CLOUD_SPEECH_API_KEY) {
      // Use Google Cloud Speech-to-Text
      transcriptionResult = await processWithGoogleSpeech(audioBuffer);
    } else if (process.env.AZURE_SPEECH_KEY) {
      // Use Azure Speech Service
      transcriptionResult = await processWithAzureSpeech(audioBuffer);
    } else {
      // Fallback to browser-based processing or mock response
      transcriptionResult = {
        transcript: '',
        confidence: 0,
        speaker: 'Unknown Speaker'
      };
    }

    res.status(200).json({
      success: true,
      transcript: transcriptionResult.transcript,
      confidence: transcriptionResult.confidence,
      speaker: transcriptionResult.speaker,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error processing speech:', error);
    res.status(500).json({ 
      error: 'Failed to process speech',
      details: error.message 
    });
  }
}

async function processWithGoogleSpeech(audioBuffer) {
  try {
    // Google Cloud Speech-to-Text implementation
    const speech = require('@google-cloud/speech');
    const client = new speech.SpeechClient({
      keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
    });

    const request = {
      audio: {
        content: audioBuffer.toString('base64')
      },
      config: {
        encoding: 'WEBM_OPUS',
        sampleRateHertz: 16000,
        languageCode: 'en-US',
        enableSpeakerDiarization: true,
        diarizationSpeakerCount: 10,
        enableAutomaticPunctuation: true,
        model: 'latest_long'
      }
    };

    const [response] = await client.recognize(request);
    const transcription = response.results
      .map(result => result.alternatives[0].transcript)
      .join('\\n');

    // Extract speaker information if available
    let speaker = 'Speaker';
    if (response.results[0]?.alternatives[0]?.words?.[0]?.speakerTag) {
      const speakerTag = response.results[0].alternatives[0].words[0].speakerTag;
      speaker = `Speaker ${speakerTag}`;
    }

    return {
      transcript: transcription,
      confidence: response.results[0]?.alternatives[0]?.confidence || 0.8,
      speaker: speaker
    };

  } catch (error) {
    console.error('❌ Google Speech API error:', error);
    return {
      transcript: '',
      confidence: 0,
      speaker: 'Unknown Speaker'
    };
  }
}

async function processWithAzureSpeech(audioBuffer) {
  try {
    // Azure Speech Service implementation
    const sdk = require('microsoft-cognitiveservices-speech-sdk');
    
    const speechConfig = sdk.SpeechConfig.fromSubscription(
      process.env.AZURE_SPEECH_KEY,
      process.env.AZURE_SPEECH_REGION
    );
    
    speechConfig.speechRecognitionLanguage = 'en-US';
    speechConfig.enableDictation();

    // Create audio config from buffer
    const audioConfig = sdk.AudioConfig.fromWavFileInput(audioBuffer);
    const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

    return new Promise((resolve) => {
      recognizer.recognizeOnceAsync(
        (result) => {
          resolve({
            transcript: result.text,
            confidence: result.offset ? 0.9 : 0.5,
            speaker: 'Speaker' // Azure requires additional setup for speaker identification
          });
        },
        (error) => {
          console.error('❌ Azure Speech error:', error);
          resolve({
            transcript: '',
            confidence: 0,
            speaker: 'Unknown Speaker'
          });
        }
      );
    });

  } catch (error) {
    console.error('❌ Azure Speech API error:', error);
    return {
      transcript: '',
      confidence: 0,
      speaker: 'Unknown Speaker'
    };
  }
}