import Head from 'next/head';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../components/AuthContext';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import T from '../components/T';
import { 
  FiVideo, 
  FiMic, 
  FiMicOff, 
  FiUsers, 
  FiUser, 
  FiPlay, 
  FiPause, 
  FiSquare, 
  FiDownload, 
  FiLoader, 
  FiX, 
  FiCheck, 
  FiSettings, 
  FiClock,
  FiFileText,
  FiEye,
  FiSave
} from 'react-icons/fi';

export default function ZoomMeetingNotes() {
  const { user, logout, loading: authLoading, authChecked } = useAuth();
  const router = useRouter();
  
  // Meeting connection states
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [meetingId, setMeetingId] = useState('');
  const [meetingPassword, setMeetingPassword] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // disconnected, connecting, connected, error
  
  // Audio processing states
  const [audioStream, setAudioStream] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [speakers, setSpeakers] = useState([]);
  const [currentSpeaker, setCurrentSpeaker] = useState(null);
  
  // Meeting data
  const [meetingNotes, setMeetingNotes] = useState({
    title: '',
    participants: [],
    transcript: '',
    summary: '',
    actionItems: [],
    keyPoints: [],
    duration: 0,
    startTime: null,
    endTime: null
  });
  
  // UI states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('live'); // live, transcript, summary, speakers
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Refs for audio processing
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const transcriptSocketRef = useRef(null);
  const meetingTimerRef = useRef(null);

  // Check authentication
  useEffect(() => {
    if (authChecked && !authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, authChecked, router]);

  // Initialize Zoom SDK and audio processing
  useEffect(() => {
    initializeZoomSDK();
    checkMicrophonePermissions();
    
    return () => {
      cleanup();
    };
  }, []);

  const initializeZoomSDK = async () => {
    try {
      // Initialize Zoom Meeting SDK
      const ZoomMtgEmbedded = await import('@zoom/meetingsdk/embedded');
      
      console.log('✅ Zoom SDK initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Zoom SDK:', error);
      setError('Failed to initialize Zoom SDK. Please check your connection.');
    }
  };

  const checkMicrophonePermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ Microphone access granted');
      stream.getTracks().forEach(track => track.stop()); // Stop test stream
    } catch (error) {
      console.error('❌ Microphone access denied:', error);
      setError('Microphone access is required for meeting transcription.');
    }
  };

  const connectToMeeting = async () => {
    if (!meetingId.trim()) {
      setError('Please enter a meeting ID');
      return;
    }

    setConnectionStatus('connecting');
    setError(null);

    try {
      // Connect to Zoom meeting
      const response = await fetch('/api/zoom/join-meeting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          meetingId: meetingId.trim(),
          password: meetingPassword.trim(),
          userName: user?.name || 'Meeting Assistant'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join meeting');
      }

      setIsConnected(true);
      setConnectionStatus('connected');
      setMeetingNotes(prev => ({
        ...prev,
        title: data.meetingTitle || `Meeting ${meetingId}`,
        startTime: new Date()
      }));

      // Start audio capture and transcription
      await startAudioCapture();
      startMeetingTimer();

      setSuccessMessage('Successfully connected to meeting!');
      setTimeout(() => setSuccessMessage(''), 3000);

    } catch (error) {
      console.error('❌ Failed to connect to meeting:', error);
      setError(error.message);
      setConnectionStatus('error');
    }
  };

  const startAudioCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        } 
      });

      setAudioStream(stream);

      // Initialize MediaRecorder for audio processing
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          processAudioChunk(event.data);
        }
      };

      // Start recording in chunks for real-time processing
      mediaRecorder.start(1000); // 1-second chunks
      setIsRecording(true);
      setIsTranscribing(true);

      console.log('🎙️ Audio capture started');

    } catch (error) {
      console.error('❌ Failed to start audio capture:', error);
      setError('Failed to start audio recording. Please check microphone permissions.');
    }
  };

  const processAudioChunk = async (audioBlob) => {
    try {
      // Convert audio blob to base64 for transmission
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = reader.result.split(',')[1];
        
        // Send to speech-to-text API
        const response = await fetch('/api/speech/transcribe-realtime', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            audio: base64Audio,
            meetingId: meetingId
          })
        });

        const data = await response.json();
        
        if (data.transcript) {
          updateTranscript(data.transcript, data.speaker, data.confidence);
        }
      };
      
      reader.readAsDataURL(audioBlob);

    } catch (error) {
      console.error('❌ Failed to process audio chunk:', error);
    }
  };

  const updateTranscript = (newText, speakerInfo, confidence) => {
    if (!newText.trim()) return;

    const timestamp = new Date();
    const transcriptEntry = {
      id: Date.now(),
      text: newText,
      speaker: speakerInfo || 'Unknown Speaker',
      timestamp: timestamp,
      confidence: confidence || 0.8
    };

    setLiveTranscript(prev => prev + `\\n[${timestamp.toLocaleTimeString()}] ${transcriptEntry.speaker}: ${newText}`);
    
    setMeetingNotes(prev => ({
      ...prev,
      transcript: prev.transcript + `\\n[${timestamp.toLocaleTimeString()}] ${transcriptEntry.speaker}: ${newText}`
    }));

    // Update speakers list
    if (speakerInfo && !speakers.find(s => s.name === speakerInfo)) {
      setSpeakers(prev => [...prev, {
        name: speakerInfo,
        segments: 1,
        duration: 0,
        lastActive: timestamp
      }]);
    }

    setCurrentSpeaker(speakerInfo);
  };

  const startMeetingTimer = () => {
    const startTime = Date.now();
    meetingTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setMeetingNotes(prev => ({
        ...prev,
        duration: Math.floor(elapsed / 1000)
      }));
    }, 1000);
  };

  const disconnectFromMeeting = async () => {
    try {
      // Stop audio recording
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }

      // Stop audio stream
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
        setAudioStream(null);
      }

      // Stop meeting timer
      if (meetingTimerRef.current) {
        clearInterval(meetingTimerRef.current);
      }

      // Disconnect from Zoom
      await fetch('/api/zoom/leave-meeting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ meetingId })
      });

      setIsConnected(false);
      setIsRecording(false);
      setIsTranscribing(false);
      setConnectionStatus('disconnected');
      setMeetingNotes(prev => ({
        ...prev,
        endTime: new Date()
      }));

      console.log('✅ Disconnected from meeting');

    } catch (error) {
      console.error('❌ Failed to disconnect properly:', error);
      setError('Failed to disconnect cleanly from meeting');
    }
  };

  const generateMeetingSummary = async () => {
    if (!meetingNotes.transcript.trim()) {
      setError('No transcript available to summarize');
      return;
    }

    setIsGeneratingSummary(true);
    setError(null);

    try {
      const response = await fetch('/api/meetings/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          transcript: meetingNotes.transcript,
          participants: speakers.map(s => s.name),
          duration: meetingNotes.duration,
          meetingTitle: meetingNotes.title
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate summary');
      }

      setMeetingNotes(prev => ({
        ...prev,
        summary: data.summary,
        actionItems: data.actionItems || [],
        keyPoints: data.keyPoints || []
      }));

      setActiveTab('summary');
      setSuccessMessage('Meeting summary generated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);

    } catch (error) {
      console.error('❌ Failed to generate summary:', error);
      setError(error.message);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const saveMeetingNotes = async () => {
    try {
      const response = await fetch('/api/meetings/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...meetingNotes,
          speakers: speakers
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save meeting notes');
      }

      setSuccessMessage('Meeting notes saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);

    } catch (error) {
      console.error('❌ Failed to save meeting notes:', error);
      setError(error.message);
    }
  };

  const cleanup = () => {
    if (isConnected) {
      disconnectFromMeeting();
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (authLoading || !authChecked) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Zoom Meeting Notes - Ecouter</title>
        <meta name="description" content="Automatically join Zoom meetings, take notes, identify speakers, and generate summaries" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Sidebar 
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          user={user}
          onLogout={logout}
        />
        
        <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
          <div className="container mx-auto px-4 py-8">
            
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                <T>Zoom Meeting Assistant</T>
              </h1>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                <T>Automatically join Zoom meetings, transcribe conversations in real-time, identify speakers, and generate intelligent summaries</T>
              </p>
            </div>

            {/* Connection Status */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">
                  <T>Meeting Connection</T>
                </h2>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                  connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
                  connectionStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
                  connectionStatus === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {connectionStatus === 'connected' && <FiCheck className="w-4 h-4" />}
                  {connectionStatus === 'connecting' && <FiLoader className="w-4 h-4 animate-spin" />}
                  {connectionStatus === 'error' && <FiX className="w-4 h-4" />}
                  <span className="capitalize">{connectionStatus}</span>
                </div>
              </div>

              {!isConnected ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <T>Meeting ID</T>
                      </label>
                      <input
                        type="text"
                        value={meetingId}
                        onChange={(e) => setMeetingId(e.target.value)}
                        placeholder="123 456 7890"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <T>Password (Optional)</T>
                      </label>
                      <input
                        type="password"
                        value={meetingPassword}
                        onChange={(e) => setMeetingPassword(e.target.value)}
                        placeholder="Meeting password"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  
                  <button
                    onClick={connectToMeeting}
                    disabled={connectionStatus === 'connecting' || !meetingId.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {connectionStatus === 'connecting' ? (
                      <>
                        <FiLoader className="w-5 h-5 animate-spin" />
                        <T>Connecting...</T>
                      </>
                    ) : (
                      <>
                        <FiVideo className="w-5 h-5" />
                        <T>Join Meeting</T>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <FiClock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-blue-600">
                        {formatDuration(meetingNotes.duration)}
                      </div>
                      <div className="text-sm text-gray-600">Duration</div>
                    </div>
                    
                    <div className="bg-green-50 rounded-lg p-4">
                      <FiUsers className="w-6 h-6 text-green-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-600">
                        {speakers.length}
                      </div>
                      <div className="text-sm text-gray-600">Speakers</div>
                    </div>
                    
                    <div className="bg-purple-50 rounded-lg p-4">
                      <FiMic className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-purple-600">
                        {isTranscribing ? 'Live' : 'Stopped'}
                      </div>
                      <div className="text-sm text-gray-600">Transcription</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={generateMeetingSummary}
                      disabled={isGeneratingSummary || !meetingNotes.transcript.trim()}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {isGeneratingSummary ? (
                        <>
                          <FiLoader className="w-4 h-4 animate-spin" />
                          <T>Generating...</T>
                        </>
                      ) : (
                        <>
                          <FiFileText className="w-4 h-4" />
                          <T>Generate Summary</T>
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={saveMeetingNotes}
                      disabled={!meetingNotes.transcript.trim()}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <FiSave className="w-4 h-4" />
                      <T>Save Notes</T>
                    </button>
                    
                    <button
                      onClick={disconnectFromMeeting}
                      className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <FiSquare className="w-4 h-4" />
                      <T>Leave Meeting</T>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Meeting Content Tabs */}
            {isConnected && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Tab Navigation */}
                <div className="border-b border-gray-200">
                  <nav className="flex">
                    {[
                      { id: 'live', label: 'Live Transcript', icon: FiEye },
                      { id: 'transcript', label: 'Full Transcript', icon: FiFileText },
                      { id: 'speakers', label: 'Speakers', icon: FiUsers },
                      { id: 'summary', label: 'Summary', icon: FiCheck }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                          activeTab === tab.id
                            ? 'border-blue-500 text-blue-600 bg-blue-50'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <tab.icon className="w-4 h-4" />
                        <T>{tab.label}</T>
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {activeTab === 'live' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">
                          <T>Live Transcription</T>
                        </h3>
                        {currentSpeaker && (
                          <div className="flex items-center gap-2 text-sm text-blue-600">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <T>Current Speaker: {currentSpeaker}</T>
                          </div>
                        )}
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto">
                        {liveTranscript ? (
                          <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                            {liveTranscript}
                          </pre>
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-500">
                            <div className="text-center">
                              <FiMic className="w-8 h-8 mx-auto mb-2" />
                              <T>Waiting for speech...</T>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'transcript' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        <T>Complete Meeting Transcript</T>
                      </h3>
                      
                      <div className="bg-gray-50 rounded-lg p-4 h-96 overflow-y-auto">
                        {meetingNotes.transcript ? (
                          <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                            {meetingNotes.transcript}
                          </pre>
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-500">
                            <T>No transcript available yet</T>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'speakers' && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        <T>Meeting Participants</T>
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {speakers.length > 0 ? speakers.map((speaker, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                                {speaker.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{speaker.name}</div>
                                <div className="text-sm text-gray-500">
                                  {speaker.segments} segments
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-xs text-gray-500">
                              Last active: {speaker.lastActive?.toLocaleTimeString()}
                            </div>
                          </div>
                        )) : (
                          <div className="col-span-full flex items-center justify-center py-8 text-gray-500">
                            <T>No speakers identified yet</T>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'summary' && (
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900">
                        <T>Meeting Summary</T>
                      </h3>
                      
                      {meetingNotes.summary ? (
                        <div className="space-y-6">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">
                              <T>Summary</T>
                            </h4>
                            <div className="bg-gray-50 rounded-lg p-4">
                              <p className="text-gray-700">{meetingNotes.summary}</p>
                            </div>
                          </div>
                          
                          {meetingNotes.keyPoints.length > 0 && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">
                                <T>Key Points</T>
                              </h4>
                              <ul className="bg-gray-50 rounded-lg p-4 space-y-2">
                                {meetingNotes.keyPoints.map((point, index) => (
                                  <li key={index} className="flex items-start gap-2">
                                    <FiCheck className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-700">{point}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {meetingNotes.actionItems.length > 0 && (
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">
                                <T>Action Items</T>
                              </h4>
                              <ul className="bg-gray-50 rounded-lg p-4 space-y-2">
                                {meetingNotes.actionItems.map((item, index) => (
                                  <li key={index} className="flex items-start gap-2">
                                    <FiUsers className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-700">{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-8 text-gray-500">
                          <div className="text-center">
                            <FiFileText className="w-8 h-8 mx-auto mb-2" />
                            <T>Generate a summary to see the analysis</T>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error Messages */}
            {error && (
              <Modal
                isOpen={!!error}
                onClose={() => setError(null)}
                title="Error"
              >
                <div className="p-4">
                  <p className="text-red-600">{error}</p>
                </div>
              </Modal>
            )}

            {/* Success Messages */}
            {successMessage && (
              <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
                <div className="flex items-center gap-2">
                  <FiCheck className="w-5 h-5" />
                  {successMessage}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}