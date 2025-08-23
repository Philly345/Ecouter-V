import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import T from '../components/T';
import SEO from '../components/SEO';
import { useAuth } from '../components/AuthContext';
import { FiMic, FiMicOff, FiDownload, FiPlay, FiStop, FiUsers, FiFileText, FiLink, FiVideo, FiX, FiMessageSquare, FiRefreshCw, FiEye, FiEyeOff, FiZap, FiActivity, FiCheck, FiCalendar, FiUser } from 'react-icons/fi';

export default function ZoomMeetingNotes() {
  const router = useRouter();
  const { user, logout, loading: authLoading, authChecked } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Meeting state
  const [meetingUrl, setMeetingUrl] = useState('');
  const [meetingId, setMeetingId] = useState('');
  const [meetingPassword, setMeetingPassword] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  // Transcription state
  const [transcript, setTranscript] = useState('');
  const [speakers, setSpeakers] = useState([]);
  const [currentSpeaker, setCurrentSpeaker] = useState('Unknown');
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Meeting summary state
  const [summary, setSummary] = useState('');
  const [keyPoints, setKeyPoints] = useState([]);
  const [actionItems, setActionItems] = useState([]);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Audio recording
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const durationIntervalRef = useRef(null);

  // Real-time transcription
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // Transcription States
  const [liveTranscription, setLiveTranscription] = useState('');
  const [transcriptionHistory, setTranscriptionHistory] = useState([]);
  const [identifiedSpeakers, setIdentifiedSpeakers] = useState({});

  // Summary States
  const [meetingSummary, setMeetingSummary] = useState('');

  // UI States
  const [showSettings, setShowSettings] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [invitationLink, setInvitationLink] = useState('');
  const [joinMethod, setJoinMethod] = useState('link'); // 'link' or 'manual'
  
  // Additional missing states
  const [isConnected, setIsConnected] = useState(true); // Always connected since no OAuth needed
  const [isConnecting, setIsConnecting] = useState(false);
  const [isInMeeting, setIsInMeeting] = useState(false);
  const [meetingInfo, setMeetingInfo] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [connectionError, setConnectionError] = useState('');

  // Refs
  const transcriptRef = useRef(null);
  const audioContextRef = useRef(null);
  const websocketRef = useRef(null);

  // Authentication check
  useEffect(() => {
    if (authChecked && !user) {
      router.push('/login');
    }
  }, [user, router, authChecked]);

  // Handle OAuth callback parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const connected = urlParams.get('connected');
    const error = urlParams.get('error');
    const description = urlParams.get('description');

    if (connected === 'true') {
      setIsConnected(true);
      setConnectionError('');
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error) {
      let errorMessage = 'Failed to connect to Zoom';
      
      if (error === 'access_denied') {
        errorMessage = 'Access denied. Please approve the authorization to connect to Zoom.';
      } else if (error === 'invalid_client') {
        errorMessage = 'Invalid Zoom app configuration. Please check your client ID and secret.';
      } else if (error === 'invalid_request') {
        errorMessage = 'Invalid request. Please check your Zoom app settings.';
      } else if (description) {
        errorMessage = decodeURIComponent(description);
      }
      
      setConnectionError(errorMessage);
      setIsConnected(false);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Only redirect if user tries to perform an action without auth
  const requireAuth = () => {
    if (!user) {
      router.push('/login');
      return false;
    }
    return true;
  };

  // Auto-scroll transcript
  useEffect(() => {
    if (autoScroll && transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcriptionHistory, autoScroll]);

  // Connect to Zoom (simplified - no OAuth)
  const connectToZoom = async () => {
    if (!requireAuth()) return;
    
    setIsConnecting(true);
    setConnectionError('');
    
    try {
      // Simulate connection success since we're not using OAuth
      setIsConnected(true);
      setConnectionError('');
    } catch (error) {
      setConnectionError(error.message);
    }
    
    setIsConnecting(false);
  };

  // Join meeting (simplified - URL parsing only)
  const joinMeeting = async (meetingId, password = '') => {
    if (!requireAuth()) return;
    
    try {
      // Simulate joining the meeting
      setMeetingInfo({
        id: meetingId,
        password: password,
        topic: `Meeting ${meetingId}`,
        startTime: new Date().toISOString()
      });
      setIsInMeeting(true);
      
      // Auto-start transcription when joining
      startTranscription();
      
      setConnectionError('');
    } catch (error) {
      setConnectionError(`Failed to join meeting: ${error.message}`);
    }
  };

  // Parse invitation link to extract meeting ID and password
  const parseInvitationLink = (link) => {
    try {
      // Clean the link - remove any extra text and get just the URL
      const urlMatch = link.match(/(https?:\/\/[^\s]+)/);
      const cleanUrl = urlMatch ? urlMatch[1] : link;
      
      const url = new URL(cleanUrl);
      
      let meetingId = '';
      let password = '';
      
      // Format 1: us05web.zoom.us/j/3424003085?pwd=...
      // Format 2: zoom.us/j/123456789?pwd=...
      if (url.pathname.includes('/j/')) {
        meetingId = url.pathname.split('/j/')[1].split('?')[0];
        password = url.searchParams.get('pwd') || '';
        
        // Clean up meeting ID (remove any non-digits)
        meetingId = meetingId.replace(/\D/g, '');
      }
      
      // Format 3: zoom.us/webinar/register/WN_abc123
      else if (url.pathname.includes('/webinar/')) {
        meetingId = url.pathname.split('/').pop();
      }
      
      // Format 4: meeting ID in query params
      else if (url.searchParams.get('id')) {
        meetingId = url.searchParams.get('id');
        password = url.searchParams.get('pwd') || '';
      }
      
      // Format 5: zoom.us/meeting/123456789
      else if (url.pathname.includes('/meeting/')) {
        meetingId = url.pathname.split('/meeting/')[1].split('?')[0];
        password = url.searchParams.get('pwd') || '';
      }
      
      if (!meetingId) {
        throw new Error('Could not extract meeting ID from link');
      }
      
      return { meetingId, password };
    } catch (error) {
      // If not a valid URL, try to extract numbers as meeting ID
      const numbers = link.replace(/\D/g, '');
      if (numbers.length >= 9) {
        return { meetingId: numbers, password: '' };
      }
      throw new Error('Invalid invitation link format. Please check the link and try again.');
    }
  };

  // Join meeting using invitation link
  const joinWithInvitationLink = async () => {
    if (!invitationLink.trim()) {
      setConnectionError('Please enter an invitation link');
      return;
    }

    try {
      const { meetingId, password } = parseInvitationLink(invitationLink);
      
      // Debug logging - remove in production
      console.log('Parsed meeting details:', { meetingId, password });
      
      setMeetingId(meetingId);
      setMeetingPassword(password);
      await joinMeeting(meetingId, password);
      setShowJoinForm(false);
    } catch (error) {
      setConnectionError(`Failed to join meeting: ${error.message}`);
    }
  };

  // Join meeting manually with ID and password
  const joinWithMeetingId = async () => {
    if (!meetingId.trim()) {
      setConnectionError('Please enter a meeting ID');
      return;
    }

    try {
      await joinMeeting(meetingId, meetingPassword);
      setShowJoinForm(false);
    } catch (error) {
      setConnectionError(error.message);
    }
  };

  // Leave meeting
  const leaveMeeting = () => {
    setIsInMeeting(false);
    setMeetingInfo(null);
    setParticipants([]);
    stopTranscription();
    setConnectionError('');
  };

  // Start transcription
  const startTranscription = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setConnectionError('Speech recognition not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
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

      setLiveTranscription(interimTranscript);

      if (finalTranscript) {
        const timestamp = new Date().toLocaleTimeString();
        const newEntry = {
          id: Date.now(),
          timestamp,
          speaker: currentSpeaker || 'Unknown Speaker',
          text: finalTranscript.trim(),
          confidence: event.results[event.results.length - 1][0].confidence || 0.8
        };
        
        setTranscriptionHistory(prev => [...prev, newEntry]);
        setLiveTranscription('');
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (isRecording) {
        // Restart if still recording
        setTimeout(() => recognition.start(), 100);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, [currentSpeaker, isRecording]);

  // Stop transcription
  const stopTranscription = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    setIsListening(false);
  };

  // Generate meeting summary
  const generateSummary = async () => {
    if (!requireAuth()) return;
    if (transcriptionHistory.length === 0) return;
    
    setIsGeneratingSummary(true);
    
    try {
      const response = await fetch('/api/zoom/generate-summary', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token || localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transcript: transcriptionHistory,
          meetingInfo
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMeetingSummary(data.summary);
        setKeyPoints(data.keyPoints || []);
        setActionItems(data.actionItems || []);
      } else {
        throw new Error('Failed to generate summary');
      }
    } catch (error) {
      setConnectionError(error.message);
    }
    
    setIsGeneratingSummary(false);
  };

  // Export transcript
  const exportTranscript = () => {
    const content = transcriptionHistory.map(entry => 
      `[${entry.timestamp}] ${entry.speaker}: ${entry.text}`
    ).join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-transcript-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Show loading while auth is being checked
  if (!authChecked || authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="spinner w-8 h-8"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title="Zoom Meeting Notes - Smart Transcription & AI Summaries"
        description="Join Zoom meetings automatically, capture live transcripts with speaker identification, and generate AI-powered summaries and action items."
        url="https://ecoutertranscribe.tech/zoom-meetings"
      />
      
      <Head>
        <title>Zoom Meeting Notes - Smart Transcription & AI Summaries</title>
        <meta name="description" content="Join Zoom meetings automatically, capture live transcripts with speaker identification, and generate AI-powered summaries and action items." />
      </Head>
      
      <div className="min-h-screen bg-black text-white relative overflow-hidden">
        
        <Sidebar 
          user={user} 
          currentPage="zoom-meetings"
          onLogout={logout}
          onSidebarToggle={(collapsed) => setSidebarCollapsed(collapsed)}
        />
        
        <div className={`p-6 overflow-auto transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'lg:ml-64'}`}>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold gradient-text mb-2">
              <T>Zoom Meeting Notes</T>
            </h1>
            <p className="text-white/60">
              <T>Automatically join meetings, capture live transcripts with speaker identification, and generate AI-powered summaries.</T>
            </p>
            {!user && (
              <div className="mt-4 file-card p-3">
                <div className="flex items-center gap-2 text-white text-sm">
                  <FiX size={16} className="text-gray-400" />
                  <span className="font-medium"><T>Not authenticated - <button onClick={() => router.push('/login')} className="underline hover:text-gray-300 transition-colors">Sign in</button></T></span>
                </div>
              </div>
            )}
          </div>

          {/* Connection Status */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            <div className="file-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white"><T>Ready to Join</T></h3>
                <div className={`w-3 h-3 rounded-full bg-white shadow-lg`}></div>
              </div>
              <div className="text-white text-sm">
                <T>✓ Ready to join meetings</T>
                <div className="mt-2 text-gray-300 text-xs">
                  <T>No OAuth setup required - just paste your meeting link below</T>
                </div>
              </div>
            </div>

            <div className="file-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white"><T>Meeting Status</T></h3>
                <FiVideo className={`${isInMeeting ? 'text-white' : 'text-gray-500'} transition-colors`} />
              </div>
              {isInMeeting ? (
                <div>
                  <div className="text-white text-sm mb-3">
                    <T>✓ In Meeting</T>
                    {meetingInfo && (
                      <div className="mt-2 text-gray-300">
                        Meeting ID: {meetingInfo.id}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={leaveMeeting}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <FiX size={16} className="text-gray-400" />
                    <T>Leave Meeting</T>
                  </button>
                </div>
              ) : (
                <div className="text-gray-400 text-sm">
                  <T>Not in meeting</T>
                </div>
              )}
            </div>

            <div className="file-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white"><T>Recording</T></h3>
                <FiMic className={`${isRecording ? 'text-white' : 'text-gray-500'} transition-colors`} />
              </div>
              <div className="flex gap-2">
                {!isRecording ? (
                  <button
                    onClick={startTranscription}
                    className="flex-1 glow-button font-medium py-2 px-3 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <FiPlay size={16} className="text-gray-400" />
                    <T>Start</T>
                  </button>
                ) : (
                  <button
                    onClick={stopTranscription}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <FiStop size={16} className="text-gray-400" />
                    <T>Stop</T>
                  </button>
                )}
              </div>
              {isListening && (
                <div className="mt-2 text-sm text-white animate-pulse">
                  <T>🎙️ Listening...</T>
                </div>
              )}
            </div>

            <div className="file-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white"><T>Participants</T></h3>
                <FiUsers className="text-gray-400" />
              </div>
              <div className="text-3xl font-bold text-white">
                {participants.length}
              </div>
              <div className="text-sm text-gray-400">
                <T>Active speakers</T>
              </div>
            </div>
          </div>

          {/* Join Meeting Form */}
          {!isInMeeting && (
            <div className="mb-6">
              <div className="file-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white"><T>Join Meeting</T></h3>
                  <button
                    onClick={() => setShowJoinForm(!showJoinForm)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {showJoinForm ? <FiEyeOff className="text-gray-400" /> : <FiEye className="text-gray-400" />}
                  </button>
                </div>
                
                {!showJoinForm ? (
                  <button
                    onClick={() => setShowJoinForm(true)}
                    className="w-full glow-button font-medium py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <FiVideo className="text-gray-400" />
                    <T>Join Meeting</T>
                  </button>
                ) : (
                  <div className="space-y-4">
                    {/* Join Method Toggle */}
                    <div className="flex bg-white/5 rounded-lg p-1">
                      <button
                        onClick={() => setJoinMethod('link')}
                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                          joinMethod === 'link' 
                            ? 'bg-white/10 text-white' 
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <T>Invitation Link</T>
                      </button>
                      <button
                        onClick={() => setJoinMethod('manual')}
                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                          joinMethod === 'manual' 
                            ? 'bg-white/10 text-white' 
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <T>Meeting ID</T>
                      </button>
                    </div>

                    {joinMethod === 'link' ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            <T>Paste Zoom invitation link</T>
                          </label>
                          <textarea
                            value={invitationLink}
                            onChange={(e) => setInvitationLink(e.target.value)}
                            placeholder="https://us05web.zoom.us/j/3424003085?pwd=PRSF5YEGwwhrM9QuVxpiawTBhBfQqA.1&omn=88665913547"
                            className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            rows={3}
                          />
                          <p className="text-xs text-gray-400 mt-1">
                            <T>Paste the full Zoom invitation link (supports us05web.zoom.us, zoom.us formats)</T>
                          </p>
                        </div>
                        <button
                          onClick={joinWithInvitationLink}
                          disabled={!invitationLink.trim()}
                          className="w-full glow-button font-medium py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          <FiLink className="text-gray-400" />
                          <T>Join from Link</T>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            <T>Meeting ID</T>
                          </label>
                          <input
                            type="text"
                            value={meetingId}
                            onChange={(e) => setMeetingId(e.target.value)}
                            placeholder="123 456 7890"
                            className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            <T>Password (optional)</T>
                          </label>
                          <input
                            type="password"
                            value={meetingPassword}
                            onChange={(e) => setMeetingPassword(e.target.value)}
                            placeholder="Enter meeting password"
                            className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <button
                          onClick={joinWithMeetingId}
                          disabled={!meetingId.trim()}
                          className="w-full glow-button font-medium py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                        >
                          <FiVideo className="text-gray-400" />
                          <T>Join Meeting</T>
                        </button>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-400 bg-white/5 rounded-lg p-3">
                      <T>💡 Tip: Paste any Zoom invitation link (like https://us05web.zoom.us/j/3424003085?pwd=...) and we'll automatically extract the meeting ID and password for you.</T>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Display */}
          {connectionError && (
            <div className="mb-6 file-card p-4">
              <div className="flex items-center gap-2 text-white">
                <FiX className="text-gray-400" />
                <span className="font-medium"><T>Error:</T></span>
                <span>{connectionError}</span>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Live Transcription */}
            <div className="lg:col-span-2">
              <div className="file-card h-96 lg:h-[600px] overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                    <FiMessageSquare className="text-gray-400" />
                    <T>Live Transcript</T>
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAutoScroll(!autoScroll)}
                      className={`p-2 rounded-lg transition-all duration-300 ${autoScroll ? 'glow-button' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
                      title="Auto-scroll"
                    >
                      <FiRefreshCw size={16} className="text-gray-400" />
                    </button>
                    <button
                      onClick={() => setShowTranscript(!showTranscript)}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-300 text-gray-300"
                      title="Toggle transcript"
                    >
                      {showTranscript ? <FiEye size={16} className="text-gray-400" /> : <FiEyeOff size={16} className="text-gray-400" />}
                    </button>
                  </div>
                </div>
                
                {showTranscript && (
                  <div 
                    ref={transcriptRef}
                    className="p-4 h-full overflow-y-auto space-y-3 custom-scrollbar"
                    style={{ height: 'calc(100% - 60px)' }}
                  >
                    {transcriptionHistory.length === 0 && !liveTranscription ? (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <div className="text-center">
                          <FiMicOff size={48} className="mx-auto mb-4 opacity-50 text-gray-400" />
                          <p><T>Start recording to see live transcription</T></p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {transcriptionHistory.map((entry) => (
                          <div key={entry.id} className="flex gap-3 p-4 file-card">
                            <div className="text-xs text-gray-400 min-w-[60px] font-mono">
                              {entry.timestamp}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-white text-sm mb-1">
                                {entry.speaker}
                              </div>
                              <div className="text-gray-200 leading-relaxed">
                                {entry.text}
                              </div>
                              <div className="text-xs text-gray-500 mt-2">
                                <T>Confidence:</T> {Math.round(entry.confidence * 100)}%
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {liveTranscription && (
                          <div className="flex gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 animate-pulse">
                            <div className="text-xs text-gray-400 min-w-[60px] font-mono">
                              {new Date().toLocaleTimeString()}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-white text-sm mb-1">
                                {currentSpeaker || 'Current Speaker'}
                              </div>
                              <div className="text-gray-200 italic">
                                {liveTranscription}
                                <span className="animate-pulse text-white">|</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
              
              {/* Controls */}
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={exportTranscript}
                  disabled={transcriptionHistory.length === 0}
                  className="bg-white/10 backdrop-blur-sm hover:bg-white/20 disabled:bg-white/5 disabled:text-gray-500 text-white font-medium py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:transform-none flex items-center gap-2 border border-white/10 hover:border-white/20"
                >
                  <FiDownload size={16} className="text-gray-400" />
                  <T>Export Transcript</T>
                </button>
                
                {/* Disabled Generate Summary Button */}
                {false && (
                <button
                  onClick={generateSummary}
                  disabled={true}
                  className="glow-button font-medium py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:transform-none flex items-center gap-2 opacity-50 cursor-not-allowed"
                >
                  <FiZap size={16} className="text-gray-400" />
                  <T>Generate Summary (Disabled)</T>
                </button>
                )}
              </div>
            </div>

            {/* Summary Panel */}
            <div className="space-y-6">
              {/* Meeting Summary */}
              <div className="file-card">
                <div className="p-4 border-b border-white/10 bg-white/5">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                    <FiFileText />
                    <T>Meeting Summary</T>
                  </h3>
                </div>
                <div className="p-4">
                  {meetingSummary ? (
                    <div className="text-gray-200 text-sm leading-relaxed">
                      {meetingSummary}
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm text-center py-8">
                      <FiActivity size={32} className="mx-auto mb-3 opacity-50" />
                      <p><T>Generate a summary to see key insights</T></p>
                    </div>
                  )}
                </div>
              </div>

              {/* Key Points */}
              <div className="file-card">
                <div className="p-4 border-b border-white/10 bg-white/5">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                    <FiCheck />
                    <T>Key Points</T>
                  </h3>
                </div>
                <div className="p-4">
                  {keyPoints.length > 0 ? (
                    <ul className="space-y-2">
                      {keyPoints.map((point, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <span className="text-white mt-1">•</span>
                          <span className="text-gray-200">{point}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-gray-400 text-sm text-center py-4">
                      <T>No key points generated yet</T>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Items */}
              <div className="file-card">
                <div className="p-4 border-b border-white/10 bg-white/5">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                    <FiCalendar />
                    <T>Action Items</T>
                  </h3>
                </div>
                <div className="p-4">
                  {actionItems.length > 0 ? (
                    <ul className="space-y-3">
                      {actionItems.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <span className="text-white mt-1">→</span>
                          <span className="text-gray-200">{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-gray-400 text-sm text-center py-4">
                      <T>No action items identified yet</T>
                    </div>
                  )}
                </div>
              </div>

              {/* Speaker Identification */}
              <div className="file-card">
                <div className="p-4 border-b border-white/10 bg-white/5">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
                    <FiUser />
                    <T>Identified Speakers</T>
                  </h3>
                </div>
                <div className="p-4">
                  {Object.keys(identifiedSpeakers).length > 0 ? (
                    <div className="space-y-2">
                      {Object.entries(identifiedSpeakers).map(([speaker, info]) => (
                        <div key={speaker} className="flex items-center justify-between text-sm">
                          <span className="text-gray-200">{speaker}</span>
                          <span className="text-gray-400">{info.segments || 0} segments</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm text-center py-4">
                      <T>No speakers identified yet</T>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="Meeting Settings">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-200">
                <T>Auto-scroll transcript</T>
              </label>
              <button
                onClick={() => setAutoScroll(!autoScroll)}
                className={`toggle ${autoScroll ? 'checked' : ''}`}
              ></button>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-200">
                <T>Show transcript</T>
              </label>
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className={`toggle ${showTranscript ? 'checked' : ''}`}
              ></button>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setShowSettings(false)}
              className="glow-button font-medium py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              <T>Close</T>
            </button>
          </div>
        </Modal>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </>
  );
}