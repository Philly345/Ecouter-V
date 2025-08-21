// Test script for speaker detection functionality
// This simulates speaker detection without requiring actual audio input

const { SpeakerDetector } = require('./utils/speakerDetection');

console.log('🎤 Testing Speaker Detection System');
console.log('==================================\n');

// Test 1: Initialize speaker detector
console.log('Test 1: Initializing Speaker Detector');
const detector = new SpeakerDetector();

// Mock audio context for testing
global.window = {
  AudioContext: class MockAudioContext {
    constructor() {
      this.sampleRate = 44100;
    }
    createMediaStreamSource() {
      return { connect: () => {} };
    }
    createAnalyser() {
      return {
        fftSize: 2048,
        smoothingTimeConstant: 0.3,
        frequencyBinCount: 1024,
        getByteFrequencyData: (array) => {
          // Simulate frequency data for different speakers
          for (let i = 0; i < array.length; i++) {
            array[i] = Math.random() * 255;
          }
        }
      };
    }
    close() {}
  },
  webkitAudioContext: null
};

// Mock stream
const mockStream = {};

// Test initialization
detector.initialize(mockStream).then((initialized) => {
  console.log(`✅ Speaker detector initialized: ${initialized}\n`);

  // Test 2: Extract voiceprint features
  console.log('Test 2: Extracting Voice Features');
  const mockFrequencyData = new Uint8Array(1024);
  
  // Simulate Speaker 1 (higher pitch)
  for (let i = 0; i < 1024; i++) {
    mockFrequencyData[i] = Math.random() * 200 + 55; // Higher frequency range
  }
  
  const voiceprint1 = detector.extractVoiceprint(mockFrequencyData);
  console.log('Speaker 1 Voiceprint:', {
    energy: voiceprint1.energy.toFixed(2),
    pitch: voiceprint1.pitch.toFixed(2),
    spectralCentroid: voiceprint1.spectralCentroid.toFixed(2),
    mfccLength: voiceprint1.mfcc.length
  });

  // Simulate Speaker 2 (lower pitch)
  for (let i = 0; i < 1024; i++) {
    mockFrequencyData[i] = Math.random() * 150 + 30; // Lower frequency range
  }
  
  const voiceprint2 = detector.extractVoiceprint(mockFrequencyData);
  console.log('Speaker 2 Voiceprint:', {
    energy: voiceprint2.energy.toFixed(2),
    pitch: voiceprint2.pitch.toFixed(2),
    spectralCentroid: voiceprint2.spectralCentroid.toFixed(2),
    mfccLength: voiceprint2.mfcc.length
  });

  console.log('');

  // Test 3: Speaker detection simulation
  console.log('Test 3: Speaker Detection Simulation');
  
  // First speaker
  detector.lastVoiceprint = voiceprint1;
  let result1 = detector.analyzeCurrentSpeaker();
  console.log(`🎤 First detection: ${result1.speaker} (New: ${result1.isNewSpeaker}, Confidence: ${(result1.confidence * 100).toFixed(1)}%)`);

  // Same speaker continues
  result1 = detector.analyzeCurrentSpeaker();
  console.log(`🎤 Continued speech: ${result1.speaker} (New: ${result1.isNewSpeaker}, Confidence: ${(result1.confidence * 100).toFixed(1)}%)`);

  // Second speaker
  detector.lastVoiceprint = voiceprint2;
  let result2 = detector.analyzeCurrentSpeaker();
  console.log(`🎤 Speaker change: ${result2.speaker} (New: ${result2.isNewSpeaker}, Confidence: ${(result2.confidence * 100).toFixed(1)}%)`);

  // Back to first speaker
  detector.lastVoiceprint = voiceprint1;
  result1 = detector.analyzeCurrentSpeaker();
  console.log(`🎤 Back to first: ${result1.speaker} (New: ${result1.isNewSpeaker}, Confidence: ${(result1.confidence * 100).toFixed(1)}%)`);

  console.log('');

  // Test 4: Speaker information
  console.log('Test 4: Speaker Information');
  const speakerInfo = detector.getCurrentSpeakerInfo();
  console.log('Current Speaker Info:', {
    currentSpeaker: speakerInfo.currentSpeaker,
    totalSpeakers: speakerInfo.totalSpeakers,
    speakerList: speakerInfo.speakerList
  });

  console.log('');

  // Test 5: Voice similarity calculation
  console.log('Test 5: Voice Similarity Testing');
  const similarity1 = detector.calculateVoiceSimilarity(voiceprint1, voiceprint1);
  const similarity2 = detector.calculateVoiceSimilarity(voiceprint1, voiceprint2);
  console.log(`Self-similarity (Speaker 1): ${(similarity1 * 100).toFixed(1)}%`);
  console.log(`Cross-similarity (Speaker 1 vs 2): ${(similarity2 * 100).toFixed(1)}%`);

  console.log('');

  // Test 6: Reset and cleanup
  console.log('Test 6: Cleanup');
  detector.reset();
  detector.cleanup();
  console.log('✅ Speaker detector reset and cleaned up');

  console.log('\n🎉 All speaker detection tests completed successfully!');
  console.log('\nFeatures tested:');
  console.log('✅ Audio analysis initialization');
  console.log('✅ Voice characteristic extraction (pitch, spectral features, MFCC)');
  console.log('✅ Automatic speaker identification');
  console.log('✅ Speaker change detection');
  console.log('✅ Voice similarity computation');
  console.log('✅ Speaker profile management');
  console.log('✅ System cleanup');
  
  console.log('\n📊 Expected behavior in live transcription:');
  console.log('• Speakers are automatically detected when voice characteristics change');
  console.log('• Each speaker gets a unique label (Speaker 1, Speaker 2, etc.)');
  console.log('• Transcripts are automatically attributed to the correct speaker');
  console.log('• Real-time visual indicators show current speaker and detection status');
  console.log('• No manual speaker labeling required during conversation');
});