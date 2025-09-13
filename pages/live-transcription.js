import Head from 'next/head';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../components/AuthContext';
import Sidebar from '../components/Sidebar';
import T from '../components/T';
import { 
  translateText, 
  getSpeechRecognitionLanguage, 
  detectLanguage,
  SUPPORTED_LANGUAGES 
} from '../utils/translation';
import { SpeakerDetector } from '../utils/speakerDetection';

import { 
  FiMic, 
  FiMicOff, 
  FiSquare, 
  FiPlay, 
  FiPause, 
  FiDownload, 
  FiSave, 
  FiClock,
  FiUser,
  FiSettings,
  FiLoader,
  FiVolume2,
  FiGlobe,
  FiRefreshCw
} from 'react-icons/fi';

export default function LiveTranscription() {
  const { user, logout, loading: authLoading, authChecked } = useAuth();
  const router = useRouter();
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcripts, setTranscripts] = useState([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [speakerName, setSpeakerName] = useState('Speaker 1');
  const [speakers, setSpeakers] = useState(['Speaker 1']);
  const [selectedSpeaker, setSelectedSpeaker] = useState('Speaker 1');
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const [error, setError] = useState(null);

  // Translation settings
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [isTranslationEnabled, setIsTranslationEnabled] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [autoDetectLanguage, setAutoDetectLanguage] = useState(true);

  // Speaker detection settings
  const [speakerDetector, setSpeakerDetector] = useState(null);
  const [currentSpeaker, setCurrentSpeaker] = useState('Speaker 1');
  const [isSpeakerDetectionEnabled, setIsSpeakerDetectionEnabled] = useState(true);
  const [speakerChangeHistory, setSpeakerChangeHistory] = useState([]);

  // Real-time transcription using Web Speech API
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (authChecked && !user) {
      router.push('/login');
    }
  }, [user, router, authChecked]);

  useEffect(() => {
    let interval;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const initializeWebSpeechAPI = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      
      // Set language based on source language setting
      recognition.lang = getSpeechRecognitionLanguage(sourceLanguage);

      recognition.onresult = async (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          const timestamp = new Date().toLocaleTimeString();
          let processedText = finalTranscript.trim();
          let detectedSpeaker = selectedSpeaker; // Default to manually selected speaker
          
          // Detect speaker automatically if enabled
          if (isSpeakerDetectionEnabled && speakerDetector) {
            const speakerResult = speakerDetector.analyzeCurrentSpeaker();
            if (speakerResult.speaker) {
              detectedSpeaker = speakerResult.speaker;
              setCurrentSpeaker(speakerResult.speaker);
              
              // Update speakers list if new speaker detected
              if (speakerResult.isNewSpeaker) {
                setSpeakers(prev => {
                  if (!prev.includes(speakerResult.speaker)) {
                    console.log(`🎤 New speaker added: ${speakerResult.speaker}`);
                    return [...prev, speakerResult.speaker];
                  }
                  return prev;
                });
                
                // Track speaker changes
                setSpeakerChangeHistory(prev => [...prev, {
                  speaker: speakerResult.speaker,
                  timestamp,
                  confidence: speakerResult.confidence
                }]);
              }
              
              console.log(`🎤 Speaker detected: ${speakerResult.speaker} (confidence: ${(speakerResult.confidence * 100).toFixed(1)}%)`);
            }
          }
          
          // Auto-detect source language if enabled
          if (autoDetectLanguage && processedText.length > 10) {
            const detectedLang = detectLanguage(processedText);
            if (detectedLang !== sourceLanguage) {
              console.log(`Auto-detected language: ${detectedLang}`);
              setSourceLanguage(detectedLang);
              // Update speech recognition language
              recognition.lang = getSpeechRecognitionLanguage(detectedLang);
            }
          }
          
          // Translate if translation is enabled and target language is different
          if (isTranslationEnabled && sourceLanguage !== targetLanguage) {
            setIsTranslating(true);
            try {
              const translatedText = await translateText(processedText, sourceLanguage, targetLanguage);
              processedText = translatedText;
              console.log(`Translated: "${finalTranscript}" → "${translatedText}"`);
            } catch (error) {
              console.error('Translation error:', error);
              // Use original text if translation fails
            }
            setIsTranslating(false);
          }
          
          const newEntry = {
            id: Date.now(),
            speaker: detectedSpeaker, // Use detected speaker instead of manually selected
            text: processedText,
            originalText: finalTranscript.trim(), // Store original for reference
            timestamp,
            recordingTime: formatTime(recordingTime),
            isTranslated: isTranslationEnabled && sourceLanguage !== targetLanguage,
            sourceLanguage: sourceLanguage,
            targetLanguage: isTranslationEnabled ? targetLanguage : sourceLanguage,
            autoDetectedSpeaker: isSpeakerDetectionEnabled && speakerDetector
          };
          setTranscripts(prev => [...prev, newEntry]);
          setCurrentTranscript('');
        } else {
          // For interim results, show original text (don't translate interim)
          setCurrentTranscript(interimTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setError('Microphone access denied. Please allow microphone access and try again.');
        }
      };

      recognition.onend = () => {
        if (isRecording && !isPaused) {
          recognition.start(); // Restart recognition if still recording
        }
      };

      recognitionRef.current = recognition;
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      streamRef.current = stream;

      // Check supported MIME types and use the best available
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/wav')) {
        mimeType = 'audio/wav';
      }

      const mediaRecorder = new MediaRecorder(stream, { 
        mimeType,
        audioBitsPerSecond: 128000
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log('Audio data chunk received:', event.data.size, 'bytes');
        }
      };

      mediaRecorder.onstop = () => {
        console.log('🛑 MediaRecorder stopped, processing audio...');
        console.log('📦 Audio chunks collected:', {
          chunksCount: audioChunksRef.current.length,
          totalSize: audioChunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0),
          chunkSizes: audioChunksRef.current.map(chunk => chunk.size)
        });
        
        if (audioChunksRef.current.length === 0) {
          console.warn('⚠️ No audio chunks available - recording may have been too short');
          setAudioBlob(null);
          setAudioUrl(null);
          return;
        }
        
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        console.log('🎵 Audio blob created:', {
          size: audioBlob.size,
          type: audioBlob.type,
          isValidBlob: audioBlob instanceof Blob
        });
        
        if (audioBlob.size === 0) {
          console.warn('⚠️ Audio blob created but size is 0 bytes');
          setAudioBlob(null);
          setAudioUrl(null);
        } else {
          console.log('✅ Setting audio blob in state...');
          setAudioBlob(audioBlob);
          setAudioUrl(URL.createObjectURL(audioBlob));
          console.log('✅ Audio blob set successfully');
        }
      };

      mediaRecorder.onstart = () => {
        console.log('MediaRecorder started');
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        setError('Recording error: ' + event.error.message);
      };

      // Record in chunks every 1 second to ensure data is captured
      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);
      setError(null);

      // Initialize speaker detection
      if (isSpeakerDetectionEnabled) {
        const detector = new SpeakerDetector();
        const initialized = await detector.initialize(stream);
        if (initialized) {
          setSpeakerDetector(detector);
          console.log('🎤 Speaker detection initialized');
        } else {
          console.warn('⚠️ Speaker detection failed to initialize');
        }
      }

      // Initialize speech recognition
      initializeWebSpeechAPI();
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }

    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Failed to start recording. Please check your microphone permissions.');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        // Resume recording
        mediaRecorderRef.current.resume();
        if (recognitionRef.current) {
          recognitionRef.current.start();
        }
        setIsPaused(false);
        console.log('Recording resumed');
      } else {
        // Pause recording
        mediaRecorderRef.current.pause();
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
        setIsPaused(true);
        console.log('Recording paused');
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('Stopping recording...');
      mediaRecorderRef.current.stop();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log('Audio track stopped');
        });
      }
      
      // Cleanup speaker detection
      if (speakerDetector) {
        speakerDetector.cleanup();
        setSpeakerDetector(null);
        console.log('🎤 Speaker detection cleaned up');
      }
      
      setIsRecording(false);
      setIsPaused(false);
      console.log('Recording stopped successfully');
    }
  };

  const addSpeaker = () => {
    if (speakerName.trim() && !speakers.includes(speakerName.trim())) {
      const newSpeaker = speakerName.trim();
      setSpeakers(prev => [...prev, newSpeaker]);
      setSelectedSpeaker(newSpeaker);
      setSpeakerName('');
    }
  };

  const saveSession = async () => {
    if (!sessionTitle.trim()) {
      setError('Please enter a session title');
      return;
    }

    if (transcripts.length === 0) {
      setError('No transcripts to save');
      return;
    }

    setIsSaving(true);
    setError(null);

    // CRITICAL: If still recording, stop it first and wait for audio blob
    let finalAudioBlob = audioBlob; // Use existing blob if recording already stopped
    
    if (isRecording && mediaRecorderRef.current) {
      console.log('🛑 Still recording - stopping first to capture audio...');
      
      try {
        // Create a promise that resolves when recording is fully stopped
        finalAudioBlob = await new Promise((resolve) => {
          const originalOnStop = mediaRecorderRef.current.onstop;
          
          mediaRecorderRef.current.onstop = () => {
            console.log('📁 Recording stopped, processing audio for save...');
            
            // Call original onstop to handle state updates
            if (originalOnStop) {
              originalOnStop();
            }
            
            // Create blob directly from chunks for immediate use
            if (audioChunksRef.current.length > 0) {
              let mimeType = 'audio/webm';
              if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                mimeType = 'audio/webm;codecs=opus';
              } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                mimeType = 'audio/mp4';
              } else if (MediaRecorder.isTypeSupported('audio/wav')) {
                mimeType = 'audio/wav';
              }
              
              const blob = new Blob(audioChunksRef.current, { type: mimeType });
              console.log('🎵 Created fresh audio blob for save:', blob.size, 'bytes');
              resolve(blob);
            } else {
              console.warn('⚠️ No audio chunks for save');
              resolve(null);
            }
          };
          
          // Stop the recording
          stopRecording();
        });
      } catch (error) {
        console.error('Error stopping recording:', error);
        finalAudioBlob = null;
      }
    }

    try {
      const authToken = localStorage.getItem('token');
      
      if (!authToken) {
        throw new Error('No authentication token available. Please log in again.');
      }

      console.log('🎯 Starting session save process...');
      console.log('📊 Complete save state check:', {
        hasOriginalAudioBlob: Boolean(audioBlob),
        originalAudioBlobSize: audioBlob?.size || 0,
        hasFinalAudioBlob: Boolean(finalAudioBlob),
        finalAudioBlobSize: finalAudioBlob?.size || 0,
        finalAudioBlobType: finalAudioBlob?.type || 'none',
        transcriptsCount: transcripts.length,
        sessionTitle: sessionTitle.trim(),
        recordingTime: recordingTime,
        isRecording: isRecording,
        audioUrl: audioUrl
      });

      // Critical check: Why is finalAudioBlob null?
      if (!finalAudioBlob) {
        console.error('🚨 CRITICAL: finalAudioBlob is null/undefined!');
        console.log('🔍 Possible reasons:');
        console.log('  - Recording was never started');
        console.log('  - Recording was started but never stopped');
        console.log('  - MediaRecorder.onstop never fired');
        console.log('  - Audio chunks array was empty');
        console.log('📋 Current state check:', {
          isRecording,
          audioChunksLength: audioChunksRef.current?.length || 0,
          hasMediaRecorder: Boolean(mediaRecorderRef.current),
          mediaRecorderState: mediaRecorderRef.current?.state || 'none'
        });
      }

      const formData = new FormData();
      formData.append('title', sessionTitle.trim());
      formData.append('transcripts', JSON.stringify(transcripts));
      formData.append('speakers', JSON.stringify(speakers));
      formData.append('duration', recordingTime.toString());
      
      // Save audio if available
      if (finalAudioBlob && finalAudioBlob.size > 0) {
        // Create a proper filename with extension based on blob type
        const fileExtension = finalAudioBlob.type.includes('webm') ? 'webm' : 
                            finalAudioBlob.type.includes('mp4') ? 'mp4' : 'wav';
        const fileName = `${sessionTitle.trim().replace(/[^a-z0-9]/gi, '_')}-${Date.now()}.${fileExtension}`;
        formData.append('audio', finalAudioBlob, fileName);
        console.log('✅ Audio file attached to form:', {
          fileName,
          size: finalAudioBlob.size,
          type: finalAudioBlob.type
        });
      } else {
        console.warn('⚠️ No audio blob available for upload:', {
          hasFinalAudioBlob: Boolean(finalAudioBlob),
          size: finalAudioBlob?.size || 0,
          reason: !finalAudioBlob ? 'finalAudioBlob is null/undefined' : 'finalAudioBlob size is 0'
        });
      }

      const response = await fetch('/api/live-transcription/save', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save session');
      }

      const data = await response.json();
      console.log('Session saved successfully:', data);
      
      // Reset session
      setTranscripts([]);
      setCurrentTranscript('');
      setRecordingTime(0);
      setSessionTitle('');
      setAudioBlob(null);
      setAudioUrl(null);
      setSpeakers(['Speaker 1']);
      setSelectedSpeaker('Speaker 1');
      
      alert('Session saved successfully! You can view it in the Sessions page.');
      
    } catch (error) {
      console.error('Save error:', error);
      setError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const downloadTranscript = () => {
    if (transcripts.length === 0) return;

    let content = `Live Transcription Session: ${sessionTitle || 'Untitled'}\n`;
    content += `Date: ${new Date().toLocaleDateString()}\n`;
    content += `Duration: ${formatTime(recordingTime)}\n`;
    
    if (isTranslationEnabled && sourceLanguage !== targetLanguage) {
      content += `Translation: ${SUPPORTED_LANGUAGES[sourceLanguage]} → ${SUPPORTED_LANGUAGES[targetLanguage]}\n`;
    }
    
    content += `\n${'='.repeat(50)}\n\n`;

    content += transcripts.map(t => {
      let line = `[${t.recordingTime}] ${t.speaker}: ${t.text}`;
      
      if (t.isTranslated && t.originalText) {
        line += `\n    Original (${SUPPORTED_LANGUAGES[t.sourceLanguage]}): ${t.originalText}`;
      }
      
      return line;
    }).join('\n\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sessionTitle || 'transcript'}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAudio = () => {
    if (!audioUrl) return;

    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `${sessionTitle || 'recording'}-${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!authChecked || authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="spinner w-8 h-8"></div>
      </div>
    );
  }

  if (authChecked && !user) {
    router.push('/login');
    return null;
  }

  return (
    <>
      <Head>
        <title><T>Live Transcription</T> | Ecouter</title>
      </Head>

      <div className="min-h-screen flex bg-black text-white">
        <Sidebar 
          currentPage="live-transcription" 
          user={user}
          onLogout={logout}
          onSidebarToggle={(collapsed) => setSidebarCollapsed(collapsed)}
        />
        
        <div className={`flex-1 px-4 py-8 overflow-auto transition-all duration-300 ${sidebarCollapsed ? 'ml-0 lg:ml-16' : 'ml-0 lg:ml-64'}`}>
          <div className="max-w-6xl mx-auto">
            
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold mb-2">
                  <T>Live Transcription</T>
                </h1>
                <p className="text-sm text-white/60">
                  <T>Record live sessions with real-time transcription and speaker labeling</T>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Recording Controls */}
              <div className="lg:col-span-1">
                <div className="file-card p-6 mb-6">
                  <h2 className="text-base font-medium text-white mb-4">
                    <T>Recording Controls</T>
                  </h2>
                  
                  {/* Session Title */}
                  <div className="mb-4">
                    <label className="block text-sm text-white/60 mb-2">
                      <T>Session Title</T>
                    </label>
                    <input
                      type="text"
                      value={sessionTitle}
                      onChange={(e) => setSessionTitle(e.target.value)}
                      placeholder="Enter session title..."
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded text-white text-sm placeholder-white/50 hover:border-white/30 transition-all"
                      disabled={isRecording}
                    />
                  </div>

                  {/* Recording Timer */}
                  <div className="text-center mb-6">
                    <div className="text-2xl font-mono text-white mb-2">
                      {formatTime(recordingTime)}
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <FiClock className="w-4 h-4 text-white/60" />
                      <span className="text-sm text-white/60">
                        <T>{isRecording ? (isPaused ? 'Paused' : 'Recording') : 'Ready'}</T>
                      </span>
                    </div>
                  </div>

                  {/* Control Buttons */}
                  <div className="flex justify-center space-x-3 mb-6">
                    {!isRecording ? (
                      <button
                        onClick={startRecording}
                        className="flex items-center px-6 py-3 bg-white text-black rounded-xl hover:bg-white/90 transition-all text-sm font-medium"
                        disabled={!sessionTitle.trim()}
                      >
                        <FiMic className="w-4 h-4 mr-2" />
                        <T>Start Recording</T>
                      </button>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          onClick={pauseRecording}
                          className="flex items-center px-4 py-3 bg-white/10 text-white rounded-xl hover:bg-white/15 transition-all text-sm"
                        >
                          {isPaused ? <FiPlay className="w-4 h-4" /> : <FiPause className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={stopRecording}
                          className="flex items-center px-4 py-3 bg-white/10 text-white rounded-xl hover:bg-white/15 transition-all text-sm"
                        >
                          <FiSquare className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Speaker Management */}
                <div className="file-card p-6">
                  <h2 className="text-base font-medium text-white mb-4">
                    <T>Speaker Management</T>
                  </h2>
                  
                  {/* Current Speaker */}
                  <div className="mb-4">
                    <label className="block text-sm text-white/60 mb-2">
                      <T>Current Speaker</T>
                    </label>
                    <select
                      value={selectedSpeaker}
                      onChange={(e) => setSelectedSpeaker(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded text-white text-sm hover:border-white/30 transition-all"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        color: 'white'
                      }}
                    >
                      {speakers.map(speaker => (
                        <option 
                          key={speaker} 
                          value={speaker}
                          className="bg-gray-800 text-white"
                          style={{
                            backgroundColor: '#1f2937',
                            color: 'white'
                          }}
                        >
                          {speaker}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Add New Speaker */}
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={speakerName}
                      onChange={(e) => setSpeakerName(e.target.value)}
                      placeholder="New speaker name..."
                      className="flex-1 px-3 py-2 bg-white/5 border border-white/20 rounded text-white text-sm placeholder-white/50 hover:border-white/30 transition-all"
                      onKeyPress={(e) => e.key === 'Enter' && addSpeaker()}
                    />
                    <button
                      onClick={addSpeaker}
                      className="px-4 py-2 bg-white text-black rounded-xl hover:bg-white/90 transition-all text-sm font-medium"
                    >
                      <T>Add</T>
                    </button>
                  </div>
                </div>

                {/* Automatic Speaker Detection */}
                <div className="file-card p-6">
                  <h2 className="text-base font-medium text-white mb-4">
                    <div className="flex items-center">
                      <FiUser className="w-4 h-4 mr-2" />
                      <T>Automatic Speaker Detection</T>
                    </div>
                  </h2>
                  
                  {/* Enable Speaker Detection */}
                  <div className="mb-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isSpeakerDetectionEnabled}
                        onChange={(e) => setIsSpeakerDetectionEnabled(e.target.checked)}
                        className="mr-2 rounded bg-white/5 border-white/20 text-white focus:ring-white/30"
                      />
                      <span className="text-sm text-white/80">
                        <T>Enable automatic speaker detection</T>
                      </span>
                    </label>
                  </div>

                  {isSpeakerDetectionEnabled && (
                    <>
                      {/* Current Detected Speaker */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                          <span className="text-sm text-white/60">
                            <T>Currently Detected</T>:
                          </span>
                          <span className="text-sm font-medium text-white">
                            {currentSpeaker || 'None'}
                          </span>
                        </div>
                      </div>

                      {/* Speaker Detection Status */}
                      <div className="mb-4">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${speakerDetector ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                          <span className="text-xs text-white/60">
                            {speakerDetector ? 'Detection Active' : 'Detection Inactive'}
                          </span>
                        </div>
                      </div>

                      {/* Detected Speakers List */}
                      {speakers.length > 1 && (
                        <div className="mb-4">
                          <label className="block text-sm text-white/60 mb-2">
                            <T>Detected Speakers</T>:
                          </label>
                          <div className="space-y-1">
                            {speakers.map((speaker, index) => (
                              <div key={speaker} className="flex items-center justify-between p-2 bg-white/5 rounded text-xs">
                                <span className="text-white">{speaker}</span>
                                <span className="text-white/60">
                                  {index === 0 ? 'Manual' : 'Auto-detected'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Speaker Change History */}
                      {speakerChangeHistory.length > 0 && (
                        <div className="mb-4">
                          <label className="block text-sm text-white/60 mb-2">
                            <T>Recent Speaker Changes</T>:
                          </label>
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {speakerChangeHistory.slice(-5).map((change, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded text-xs">
                                <span className="text-white">{change.speaker}</span>
                                <span className="text-white/60">{change.timestamp}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Translation Settings */}
                <div className="file-card p-6">
                  <h2 className="text-base font-medium text-white mb-4">
                    <div className="flex items-center">
                      <FiGlobe className="w-4 h-4 mr-2" />
                      <T>Translation Settings</T>
                    </div>
                  </h2>
                  
                  {/* Enable Translation */}
                  <div className="mb-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isTranslationEnabled}
                        onChange={(e) => setIsTranslationEnabled(e.target.checked)}
                        className="mr-2 rounded bg-white/5 border-white/20 text-white focus:ring-white/30"
                      />
                      <span className="text-sm text-white/80">
                        <T>Enable real-time translation</T>
                      </span>
                    </label>
                  </div>

                  {isTranslationEnabled && (
                    <>
                      {/* Auto-detect Language */}
                      <div className="mb-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={autoDetectLanguage}
                            onChange={(e) => setAutoDetectLanguage(e.target.checked)}
                            className="mr-2 rounded bg-white/5 border-white/20 text-white focus:ring-white/30"
                          />
                          <span className="text-sm text-white/80">
                            <T>Auto-detect source language</T>
                          </span>
                        </label>
                      </div>

                      {/* Source Language */}
                      <div className="mb-4">
                        <label className="block text-sm text-white/60 mb-2">
                          <T>Source Language (what you speak)</T>
                        </label>
                        <select
                          value={sourceLanguage}
                          onChange={(e) => setSourceLanguage(e.target.value)}
                          disabled={autoDetectLanguage}
                          className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded text-white text-sm hover:border-white/30 transition-all disabled:opacity-50"
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            color: 'white'
                          }}
                        >
                          {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                            <option 
                              key={code} 
                              value={code}
                              className="bg-gray-800 text-white"
                              style={{
                                backgroundColor: '#1f2937',
                                color: 'white'
                              }}
                            >
                              {name}
                            </option>
                          ))}
                        </select>
                        {autoDetectLanguage && (
                          <p className="text-xs text-white/50 mt-1">
                            <T>Detected: {SUPPORTED_LANGUAGES[sourceLanguage]}</T>
                          </p>
                        )}
                      </div>

                      {/* Target Language */}
                      <div className="mb-4">
                        <label className="block text-sm text-white/60 mb-2">
                          <T>Target Language (translate to)</T>
                        </label>
                        <select
                          value={targetLanguage}
                          onChange={(e) => setTargetLanguage(e.target.value)}
                          className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded text-white text-sm hover:border-white/30 transition-all"
                          style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            color: 'white'
                          }}
                        >
                          {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                            <option 
                              key={code} 
                              value={code}
                              className="bg-gray-800 text-white"
                              style={{
                                backgroundColor: '#1f2937',
                                color: 'white'
                              }}
                            >
                              {name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Translation Status */}
                      <div className="bg-white/5 rounded-xl p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FiGlobe className="w-4 h-4 text-white/60" />
                            <span className="text-sm text-white/80">Translation:</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {isTranslating ? (
                              <div className="flex items-center space-x-1">
                                <FiRefreshCw className="w-3 h-3 animate-spin text-blue-400" />
                                <span className="text-xs text-blue-400">Translating...</span>
                              </div>
                            ) : sourceLanguage === targetLanguage ? (
                              <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                <span className="text-xs text-yellow-400">Same language</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-xs text-green-400">
                                  {SUPPORTED_LANGUAGES[sourceLanguage]} → {SUPPORTED_LANGUAGES[targetLanguage]}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Transcription Display */}
              <div className="lg:col-span-2">
                <div className="file-card p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-base font-medium text-white">
                      <T>Live Transcription</T>
                    </h2>
                    <div className="flex space-x-2">
                      {transcripts.length > 0 && (
                        <>
                          <button
                            onClick={downloadTranscript}
                            className="flex items-center px-3 py-2 border border-white/20 rounded-xl text-white/80 hover:bg-white/5 transition-all text-sm"
                          >
                            <FiDownload className="w-4 h-4 mr-2" />
                            <T>Transcript</T>
                          </button>
                          {audioUrl && (
                            <button
                              onClick={downloadAudio}
                              className="flex items-center px-3 py-2 border border-white/20 rounded-xl text-white/80 hover:bg-white/5 transition-all text-sm"
                            >
                              <FiDownload className="w-4 h-4 mr-2" />
                              <T>Audio</T>
                            </button>
                          )}
                          <button
                            onClick={saveSession}
                            disabled={isSaving || !sessionTitle.trim()}
                            className="flex items-center px-3 py-2 bg-white text-black rounded-xl hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                          >
                            {isSaving ? (
                              <div className="spinner w-4 h-4 mr-2"></div>
                            ) : (
                              <FiSave className="w-4 h-4 mr-2" />
                            )}
                            <T>Save</T>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Audio Recording Status */}
                  <div className="bg-white/5 rounded-xl p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FiVolume2 className="w-4 h-4 text-white/60" />
                        <span className="text-sm text-white/80">Audio Recording Status:</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {audioBlob ? (
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs text-green-400">
                              Audio captured ({Math.round(audioBlob.size / 1024)}KB)
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span className="text-xs text-red-400">No audio captured</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {audioBlob && (
                      <div className="mt-2 text-xs text-white/50">
                        Type: {audioBlob.type} | Duration: {Math.round(recordingTime)}s
                      </div>
                    )}
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="border border-red-500/20 bg-red-500/10 rounded-xl p-3 mb-4">
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}

                  {/* Transcription Feed */}
                  <div className="h-96 overflow-y-auto space-y-3 bg-white/5 rounded-xl p-4">
                    {transcripts.length === 0 && !currentTranscript && (
                      <div className="text-center text-white/50 mt-20">
                        <FiMicOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">
                          <T>Start recording to see live transcription</T>
                        </p>
                      </div>
                    )}

                    {transcripts.map((transcript) => (
                      <div key={transcript.id} className="border-l-2 border-white/20 pl-4">
                        <div className="flex items-center space-x-2 mb-1">
                          <div className="flex items-center space-x-1">
                            <FiUser className="w-3 h-3 text-white/60" />
                            <span className="text-sm font-medium text-white">{transcript.speaker}</span>
                            {transcript.autoDetectedSpeaker && (
                              <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                                Auto
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-white/50">{transcript.recordingTime}</span>
                          <span className="text-xs text-white/50">{transcript.timestamp}</span>
                          {transcript.isTranslated && (
                            <div className="flex items-center space-x-1">
                              <FiGlobe className="w-3 h-3 text-blue-400" />
                              <span className="text-xs text-blue-400">
                                {SUPPORTED_LANGUAGES[transcript.sourceLanguage]} → {SUPPORTED_LANGUAGES[transcript.targetLanguage]}
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-white/80 text-sm leading-relaxed">{transcript.text}</p>
                        {transcript.isTranslated && transcript.originalText && (
                          <div className="mt-2 p-2 bg-white/5 rounded text-xs">
                            <span className="text-white/50">Original ({SUPPORTED_LANGUAGES[transcript.sourceLanguage]}): </span>
                            <span className="text-white/70 italic">{transcript.originalText}</span>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Current/Live Transcript */}
                    {currentTranscript && (
                      <div className="border-l-2 border-white/30 pl-4 bg-white/10 rounded-r p-2">
                        <div className="flex items-center space-x-2 mb-1">
                          <FiUser className="w-3 h-3 text-white/80" />
                          <span className="text-sm font-medium text-white/80">{selectedSpeaker}</span>
                          <span className="text-xs text-white/60">
                            <T>Speaking...</T>
                          </span>
                          {isTranslating && (
                            <div className="flex items-center space-x-1">
                              <FiRefreshCw className="w-3 h-3 animate-spin text-blue-400" />
                              <span className="text-xs text-blue-400">Translating...</span>
                            </div>
                          )}
                          {isTranslationEnabled && sourceLanguage !== targetLanguage && (
                            <div className="flex items-center space-x-1">
                              <FiGlobe className="w-3 h-3 text-green-400" />
                              <span className="text-xs text-green-400">Live translation active</span>
                            </div>
                          )}
                        </div>
                        <p className="text-white/80 text-sm leading-relaxed italic">{currentTranscript}</p>
                      </div>
                    )}
                  </div>

                  {/* Audio Player */}
                  {audioUrl && (
                    <div className="mt-4 pt-4 border-t border-white/20">
                      <label className="block text-sm text-white/60 mb-2">
                        <T>Recorded Audio</T>
                      </label>
                      <audio controls className="w-full rounded bg-white/5">
                        <source src={audioUrl} type="audio/wav" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}