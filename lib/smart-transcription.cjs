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
      case 'gemini':
        return this.transcribeWithGemini(audioFile, options);
      case 'deepseek':
        return this.transcribeWithDeepSeek(audioFile, options);
      default:
        throw new Error(`Unknown API: ${apiName}`);
    }
  }

  async transcribeWithAssemblyAI(audioFile, options) {
    const AssemblyAI = require('assemblyai');
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

    const transcript = await client.transcripts.transcribe(config);
    
    return {
      text: transcript.text,
      speakers: transcript.utterances || [],
      confidence: transcript.confidence,
      api: 'assemblyai',
      processingTime: transcript.audio_duration
    };
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

  async transcribeWithGemini(audioFile, options) {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Transcribe this audio file accurately. Include speaker labels if multiple speakers are detected: ${audioFile}`;
    const result = await model.generateContent(prompt);
    
    return {
      text: result.response.text(),
      speakers: [], // Gemini doesn't provide structured speaker data
      confidence: 0.85, // Estimated
      api: 'gemini',
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
      case 'gemini':
        return this.translateWithGemini(text, targetLanguage, sourceLanguage);
      case 'deepseek':
        return this.translateWithDeepSeek(text, targetLanguage, sourceLanguage);
      default:
        // Fallback to Google Translate API
        return this.translateWithGoogle(text, targetLanguage, sourceLanguage);
    }
  }

  async translateWithGemini(text, targetLanguage, sourceLanguage) {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Translate this text to ${targetLanguage}. Only return the translation, no explanations:\n\n${text}`;
    const result = await model.generateContent(prompt);
    
    return {
      translatedText: result.response.text(),
      sourceLanguage: sourceLanguage,
      targetLanguage: targetLanguage,
      api: 'gemini'
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