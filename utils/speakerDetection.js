// Speaker detection utilities for live transcription
// Uses audio analysis to detect speaker changes

/**
 * Audio analyzer for speaker detection
 */
export class SpeakerDetector {
  constructor() {
    this.audioContext = null;
    this.analyzer = null;
    this.lastVoiceprint = null;
    this.speakers = new Map();
    this.currentSpeaker = null;
    this.speakerChangeThreshold = 0.3; // Sensitivity for speaker change detection
    this.silenceThreshold = -50; // dB threshold for silence detection
    this.speakingHistory = [];
    this.maxHistoryLength = 10;
  }

  /**
   * Initialize audio analysis
   * @param {MediaStream} stream - Audio stream from microphone
   */
  async initialize(stream) {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = this.audioContext.createMediaStreamSource(stream);
      
      this.analyzer = this.audioContext.createAnalyser();
      this.analyzer.fftSize = 2048;
      this.analyzer.smoothingTimeConstant = 0.3;
      
      source.connect(this.analyzer);
      
      console.log('🎤 Speaker detection initialized');
      return true;
    } catch (error) {
      console.error('Speaker detection initialization failed:', error);
      return false;
    }
  }

  /**
   * Analyze current audio and detect speaker changes
   * @returns {Object} Speaker detection result
   */
  analyzeCurrentSpeaker() {
    if (!this.analyzer) {
      return { speaker: 'Speaker 1', isNewSpeaker: false, confidence: 0 };
    }

    try {
      // Get frequency data
      const bufferLength = this.analyzer.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      this.analyzer.getByteFrequencyData(dataArray);

      // Calculate voice characteristics
      const voiceprint = this.extractVoiceprint(dataArray);
      
      // Check if there's enough audio signal
      if (voiceprint.energy < this.silenceThreshold) {
        return { speaker: this.currentSpeaker || 'Speaker 1', isNewSpeaker: false, confidence: 0 };
      }

      // Compare with known speakers
      const speakerMatch = this.findBestSpeakerMatch(voiceprint);
      
      if (speakerMatch.speaker) {
        // Known speaker detected
        this.currentSpeaker = speakerMatch.speaker;
        this.updateSpeakerProfile(speakerMatch.speaker, voiceprint);
        return { 
          speaker: speakerMatch.speaker, 
          isNewSpeaker: false, 
          confidence: speakerMatch.confidence 
        };
      } else {
        // New speaker detected
        const newSpeakerName = this.createNewSpeaker(voiceprint);
        this.currentSpeaker = newSpeakerName;
        return { 
          speaker: newSpeakerName, 
          isNewSpeaker: true, 
          confidence: 0.8 
        };
      }
    } catch (error) {
      console.error('Speaker analysis error:', error);
      return { speaker: this.currentSpeaker || 'Speaker 1', isNewSpeaker: false, confidence: 0 };
    }
  }

  /**
   * Extract voice characteristics (voiceprint) from frequency data
   * @param {Uint8Array} frequencyData - Audio frequency data
   * @returns {Object} Voice characteristics
   */
  extractVoiceprint(frequencyData) {
    const voiceprint = {
      energy: 0,
      pitch: 0,
      spectralCentroid: 0,
      spectralRolloff: 0,
      mfcc: [],
      timestamp: Date.now()
    };

    // Calculate energy (volume)
    let totalEnergy = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      totalEnergy += frequencyData[i];
    }
    voiceprint.energy = totalEnergy / frequencyData.length;

    // Convert to dB
    voiceprint.energy = 20 * Math.log10(voiceprint.energy / 255) || -100;

    // Find dominant frequency (rough pitch estimation)
    let maxMagnitude = 0;
    let dominantFreqIndex = 0;
    for (let i = 10; i < Math.min(frequencyData.length / 4, 200); i++) { // Focus on voice range
      if (frequencyData[i] > maxMagnitude) {
        maxMagnitude = frequencyData[i];
        dominantFreqIndex = i;
      }
    }
    voiceprint.pitch = dominantFreqIndex * (this.audioContext.sampleRate / 2) / frequencyData.length;

    // Calculate spectral centroid (brightness)
    let weightedSum = 0;
    let magnitudeSum = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      const frequency = i * (this.audioContext.sampleRate / 2) / frequencyData.length;
      weightedSum += frequency * frequencyData[i];
      magnitudeSum += frequencyData[i];
    }
    voiceprint.spectralCentroid = magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;

    // Calculate spectral rolloff (frequency distribution)
    const totalMagnitude = frequencyData.reduce((sum, val) => sum + val, 0);
    const rolloffThreshold = totalMagnitude * 0.85;
    let runningSum = 0;
    for (let i = 0; i < frequencyData.length; i++) {
      runningSum += frequencyData[i];
      if (runningSum >= rolloffThreshold) {
        voiceprint.spectralRolloff = i * (this.audioContext.sampleRate / 2) / frequencyData.length;
        break;
      }
    }

    // Simple MFCC-like features (voice timbre)
    const numCoefficients = 8;
    for (let i = 0; i < numCoefficients; i++) {
      const startIdx = Math.floor(i * frequencyData.length / numCoefficients);
      const endIdx = Math.floor((i + 1) * frequencyData.length / numCoefficients);
      let sum = 0;
      for (let j = startIdx; j < endIdx; j++) {
        sum += frequencyData[j];
      }
      voiceprint.mfcc.push(sum / (endIdx - startIdx));
    }

    return voiceprint;
  }

  /**
   * Find the best matching speaker for current voiceprint
   * @param {Object} voiceprint - Current voice characteristics
   * @returns {Object} Best matching speaker and confidence
   */
  findBestSpeakerMatch(voiceprint) {
    if (this.speakers.size === 0) {
      return { speaker: null, confidence: 0 };
    }

    let bestMatch = null;
    let bestSimilarity = 0;

    for (const [speakerName, speakerProfile] of this.speakers.entries()) {
      const similarity = this.calculateVoiceSimilarity(voiceprint, speakerProfile.averageVoiceprint);
      
      if (similarity > bestSimilarity && similarity > this.speakerChangeThreshold) {
        bestSimilarity = similarity;
        bestMatch = speakerName;
      }
    }

    return { speaker: bestMatch, confidence: bestSimilarity };
  }

  /**
   * Calculate similarity between two voiceprints
   * @param {Object} voiceprint1 - First voiceprint
   * @param {Object} voiceprint2 - Second voiceprint
   * @returns {number} Similarity score (0-1)
   */
  calculateVoiceSimilarity(voiceprint1, voiceprint2) {
    if (!voiceprint1 || !voiceprint2) return 0;

    let totalSimilarity = 0;
    let weightSum = 0;

    // Pitch similarity (weighted heavily)
    const pitchWeight = 0.4;
    const pitchDiff = Math.abs(voiceprint1.pitch - voiceprint2.pitch);
    const pitchSimilarity = Math.exp(-pitchDiff / 100); // Normalized similarity
    totalSimilarity += pitchSimilarity * pitchWeight;
    weightSum += pitchWeight;

    // Spectral centroid similarity
    const centroidWeight = 0.3;
    const centroidDiff = Math.abs(voiceprint1.spectralCentroid - voiceprint2.spectralCentroid);
    const centroidSimilarity = Math.exp(-centroidDiff / 1000);
    totalSimilarity += centroidSimilarity * centroidWeight;
    weightSum += centroidWeight;

    // MFCC similarity
    const mfccWeight = 0.3;
    let mfccSimilarity = 0;
    const minLength = Math.min(voiceprint1.mfcc.length, voiceprint2.mfcc.length);
    
    if (minLength > 0) {
      for (let i = 0; i < minLength; i++) {
        const diff = Math.abs(voiceprint1.mfcc[i] - voiceprint2.mfcc[i]);
        mfccSimilarity += Math.exp(-diff / 50);
      }
      mfccSimilarity /= minLength;
      totalSimilarity += mfccSimilarity * mfccWeight;
      weightSum += mfccWeight;
    }

    return weightSum > 0 ? totalSimilarity / weightSum : 0;
  }

  /**
   * Create a new speaker profile
   * @param {Object} voiceprint - Initial voiceprint for the new speaker
   * @returns {string} New speaker name
   */
  createNewSpeaker(voiceprint) {
    const speakerNumber = this.speakers.size + 1;
    const speakerName = `Speaker ${speakerNumber}`;
    
    this.speakers.set(speakerName, {
      averageVoiceprint: { ...voiceprint },
      voiceprintHistory: [voiceprint],
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      speechCount: 1
    });

    console.log(`🎤 New speaker detected: ${speakerName}`);
    return speakerName;
  }

  /**
   * Update existing speaker profile with new voiceprint
   * @param {string} speakerName - Name of the speaker
   * @param {Object} voiceprint - New voiceprint data
   */
  updateSpeakerProfile(speakerName, voiceprint) {
    const speaker = this.speakers.get(speakerName);
    if (!speaker) return;

    // Add to history
    speaker.voiceprintHistory.push(voiceprint);
    
    // Keep only recent history
    if (speaker.voiceprintHistory.length > 20) {
      speaker.voiceprintHistory = speaker.voiceprintHistory.slice(-20);
    }

    // Update average voiceprint (running average)
    const alpha = 0.1; // Learning rate
    speaker.averageVoiceprint.pitch = 
      speaker.averageVoiceprint.pitch * (1 - alpha) + voiceprint.pitch * alpha;
    speaker.averageVoiceprint.spectralCentroid = 
      speaker.averageVoiceprint.spectralCentroid * (1 - alpha) + voiceprint.spectralCentroid * alpha;
    speaker.averageVoiceprint.spectralRolloff = 
      speaker.averageVoiceprint.spectralRolloff * (1 - alpha) + voiceprint.spectralRolloff * alpha;

    // Update MFCC
    for (let i = 0; i < voiceprint.mfcc.length; i++) {
      if (speaker.averageVoiceprint.mfcc[i] !== undefined) {
        speaker.averageVoiceprint.mfcc[i] = 
          speaker.averageVoiceprint.mfcc[i] * (1 - alpha) + voiceprint.mfcc[i] * alpha;
      }
    }

    speaker.lastSeen = Date.now();
    speaker.speechCount++;
  }

  /**
   * Get current speaker information
   * @returns {Object} Current speaker data
   */
  getCurrentSpeakerInfo() {
    return {
      currentSpeaker: this.currentSpeaker,
      totalSpeakers: this.speakers.size,
      speakerList: Array.from(this.speakers.keys()),
      confidence: this.lastConfidence || 0
    };
  }

  /**
   * Reset speaker detection (for new session)
   */
  reset() {
    this.speakers.clear();
    this.currentSpeaker = null;
    this.lastVoiceprint = null;
    this.speakingHistory = [];
    console.log('🔄 Speaker detection reset');
  }

  /**
   * Clean up resources
   */
  cleanup() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.analyzer = null;
    this.reset();
  }
}

export default SpeakerDetector;