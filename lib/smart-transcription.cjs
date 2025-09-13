const { getAPIManager } = require('./api-manager.cjs');

// Smart transcription with automatic API management
class SmartTranscriptionService {
  constructor() {
    this.apiManager = getAPIManager();
  }

  async transcribeAudio(audioFile, options = {}) {
    const currentAPI = await this.apiManager.getCurrentAPI();
    const estimatedSize = this.estimateTokenUsage(audioFile);

    try {
      // Check if current API can handle the request
      const canProceed = await this.apiManager.checkAPIUsage(currentAPI, estimatedSize);
      
      if (!canProceed) {
        // API manager automatically switched to backup
        const newAPI = await this.apiManager.getCurrentAPI();
        console.log(`🔄 Using ${newAPI} for transcription`);
      }

      // Perform transcription with current API
      const result = await this.performTranscription(await this.apiManager.getCurrentAPI(), audioFile, options);
      
      // Record successful usage
      this.apiManager.apis[await this.apiManager.getCurrentAPI()].usage += estimatedSize;
      await this.apiManager.saveAPIMetrics();
      
      return result;
      
    } catch (error) {
      console.error('Transcription error:', error);
      
      // Record error for API
      await this.apiManager.recordAPIError(await this.apiManager.getCurrentAPI(), error);
      
      // Try auto-debug
      const autoFixed = await this.apiManager.autoDebug(error, {
        operation: 'transcription',
        api: await this.apiManager.getCurrentAPI(),
        audioSize: estimatedSize
      });

      if (autoFixed) {
        // Retry with auto-fix applied
        return this.transcribeAudio(audioFile, options);
      }

      throw error;
    }
  }

  async performTranscription(apiName, audioFile, options) {
    switch (apiName) {
      case 'assemblyai':
        return this.transcribeWithAssemblyAI(audioFile, options);
      case 'gladia':
        return this.transcribeWithGladia(audioFile, options);
      case 'openai':
        return this.transcribeWithOpenAI(audioFile, options);
      case 'deepseek':
        return this.transcribeWithDeepSeek(audioFile, options);
      default:
        throw new Error(`Unknown API: ${apiName}`);
    }
  }

  async transcribeWithAssemblyAI(audioFile, options) {
    try {
      // Try different import patterns for AssemblyAI
      let AssemblyAI;
      try {
        // Try destructured import first
        const assemblyModule = require('assemblyai');
        AssemblyAI = assemblyModule.AssemblyAI || assemblyModule.default || assemblyModule;
      } catch (importError) {
        console.error('AssemblyAI import failed:', importError);
        throw new Error('AssemblyAI package import failed. Please ensure assemblyai package is properly installed.');
      }

      if (!AssemblyAI) {
        throw new Error('AssemblyAI constructor not found in package');
      }
      
      if (!process.env.ASSEMBLYAI_API_KEY) {
        throw new Error('ASSEMBLYAI_API_KEY environment variable is not set');
      }

      const client = new AssemblyAI({
        apiKey: process.env.ASSEMBLYAI_API_KEY
      });

      const config = {
        audio: audioFile,
        speaker_labels: options.speakerDetection || true,
        language_detection: options.languageDetection || true,
        punctuate: true,
        format_text: true,
        ...options.assemblyaiOptions
      };

      console.log('🎙️ Starting AssemblyAI transcription with config:', {
        audio: audioFile.substring(0, 50) + '...',
        speakerLabels: config.speaker_labels,
        languageDetection: config.language_detection
      });

      const transcript = await client.transcripts.transcribe(config);
    
      return {
        text: transcript.text,
        speakers: transcript.utterances || [],
        confidence: transcript.confidence,
        api: 'assemblyai',
        processingTime: transcript.audio_duration
      };
    } catch (error) {
      console.error('AssemblyAI transcription error:', error);
      throw error;
    }
  }

  async transcribeWithGladia(audioFile, options) {
    const response = await fetch('https://api.gladia.io/v2/transcription', {
      method: 'POST',
      headers: {
        'X-Gladia-Key': process.env.GLADIA_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        audio_url: audioFile,
        diarization: options.speakerDetection || true,
        language_behaviour: 'automatic detection',
        ...options.gladiaOptions
      })
    });

    const result = await response.json();
    
    return {
      text: result.prediction.map(p => p.transcription).join(' '),
      speakers: result.prediction || [],
      confidence: result.metadata?.confidence,
      api: 'gladia',
      processingTime: result.metadata?.duration
    };
  }

  async transcribeWithOpenAI(audioFile, options) {
    // OpenAI Whisper via OpenRouter for transcription
    const fs = require('fs');
    const FormData = require('form-data');
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(audioFile));
    formData.append('model', 'openai/whisper-large-v3');
    
    const response = await fetch('https://openrouter.ai/api/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'HTTP-Referer': 'https://ecouter.systems',
        'X-Title': 'Ecouter Transcription System',
        ...formData.getHeaders()
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`OpenAI Whisper transcription failed: ${response.status}`);
    }

    const result = await response.json();
    
    return {
      text: result.text,
      speakers: [], // Whisper doesn't provide structured speaker data by default
      confidence: 0.95, // Whisper typically has high accuracy
      api: 'openai',
      processingTime: null
    };
  }

  async transcribeWithDeepSeek(audioFile, options) {
    const response = await fetch('https://api.deepseek.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        audio: audioFile,
        model: 'deepseek-audio',
        response_format: 'verbose_json',
        ...options.deepseekOptions
      })
    });

    const result = await response.json();
    
    return {
      text: result.text,
      speakers: result.segments || [],
      confidence: result.confidence,
      api: 'deepseek',
      processingTime: result.duration
    };
  }

  estimateTokenUsage(audioFile) {
    // Estimate based on file size or duration
    // This is a rough estimate - adjust based on your actual usage patterns
    try {
      const fs = require('fs');
      const stats = fs.statSync(audioFile);
      const fileSizeInMB = stats.size / (1024 * 1024);
      
      // Rough estimate: 1MB audio ≈ 1000 tokens
      return Math.ceil(fileSizeInMB * 1000);
    } catch (error) {
      // Default estimate if file size can't be determined
      return 5000;
    }
  }

  // Translation with smart API management
  async translateText(text, targetLanguage, sourceLanguage = 'auto') {
    const currentAPI = await this.apiManager.getCurrentAPI();
    const estimatedSize = text.length;

    try {
      const canProceed = await this.apiManager.checkAPIUsage(currentAPI, estimatedSize);
      
      if (!canProceed) {
        console.log(`🔄 Switched API for translation`);
      }

      const result = await this.performTranslation(await this.apiManager.getCurrentAPI(), text, targetLanguage, sourceLanguage);
      
      this.apiManager.apis[await this.apiManager.getCurrentAPI()].usage += estimatedSize;
      await this.apiManager.saveAPIMetrics();
      
      return result;
      
    } catch (error) {
      await this.apiManager.recordAPIError(await this.apiManager.getCurrentAPI(), error);
      
      const autoFixed = await this.apiManager.autoDebug(error, {
        operation: 'translation',
        api: await this.apiManager.getCurrentAPI(),
        textLength: estimatedSize
      });

      if (autoFixed) {
        return this.translateText(text, targetLanguage, sourceLanguage);
      }

      throw error;
    }
  }

  async performTranslation(apiName, text, targetLanguage, sourceLanguage) {
    switch (apiName) {
      case 'openai':
        return this.translateWithOpenAI(text, targetLanguage, sourceLanguage);
      case 'deepseek':
        return this.translateWithDeepSeek(text, targetLanguage, sourceLanguage);
      default:
        // Fallback to Google Translate API
        return this.translateWithGoogle(text, targetLanguage, sourceLanguage);
    }
  }

  async translateWithOpenAI(text, targetLanguage, sourceLanguage) {
    // WARNING: Only use the FREE model to avoid charges!
    // Changing this model name from "openai/gpt-oss-20b:free" could result in billing charges
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ecouter.systems',
        'X-Title': 'Ecouter Transcription System'
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b:free', // FREE MODEL ONLY - DO NOT CHANGE
        messages: [{
          role: 'user',
          content: `Translate this text to ${targetLanguage}. Only return the translation, no explanations:\n\n${text}`
        }],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI translation failed: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      translatedText: data.choices[0].message.content,
      sourceLanguage: sourceLanguage,
      targetLanguage: targetLanguage,
      api: 'openai'
    };
  }

  async translateWithDeepSeek(text, targetLanguage, sourceLanguage) {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{
          role: 'user',
          content: `Translate this text to ${targetLanguage}. Only return the translation:\n\n${text}`
        }],
        temperature: 0.1
      })
    });

    const result = await response.json();
    
    return {
      translatedText: result.choices[0].message.content,
      sourceLanguage: sourceLanguage,
      targetLanguage: targetLanguage,
      api: 'deepseek'
    };
  }

  async translateWithGoogle(text, targetLanguage, sourceLanguage) {
    const { Translate } = require('@google-cloud/translate').v2;
    const translate = new Translate({
      key: process.env.GOOGLE_TRANSLATE_API_KEY
    });

    const [translation] = await translate.translate(text, {
      from: sourceLanguage === 'auto' ? undefined : sourceLanguage,
      to: targetLanguage
    });
    
    return {
      translatedText: translation,
      sourceLanguage: sourceLanguage,
      targetLanguage: targetLanguage,
      api: 'google-translate'
    };
  }
}

// Export singleton instance
let transcriptionService = null;

function getTranscriptionService() {
  if (!transcriptionService) {
    transcriptionService = new SmartTranscriptionService();
  }
  return transcriptionService;
}

module.exports = { SmartTranscriptionService, getTranscriptionService };