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
  FiUsers, 
  FiClock, 
  FiMic, 
  FiMicOff,
  FiDownload,
  FiPlay,
  FiPause,
  FiStop,
  FiSettings,
  FiRefreshCw,
  FiFileText,
  FiUser,
  FiActivity,
  FiMessageSquare,
  FiEdit3,
  FiCalendar,
  FiShare2,
  FiPlus,
  FiExternalLink,
  FiCheckCircle,
  FiAlertCircle
} from 'react-icons/fi';

export default function ZoomMeetingNotes() {
  const { user, logout, loading: authLoading, authChecked } = useAuth();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Connection states
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState('');

  // Meeting states
  const [currentMeeting, setCurrentMeeting] = useState(null);
  const [meetingHistory, setMeetingHistory] = useState([]);
  const [joinMeetingId, setJoinMeetingId] = useState('');

  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [speakers, setSpeakers] = useState({});
  const [currentSpeaker, setCurrentSpeaker] = useState('');

  // UI states
  const [showSettings, setShowSettings] = useState(false);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [selectedTranscript, setSelectedTranscript] = useState(null);

  // Settings
  const [settings, setSettings] = useState({
    autoJoin: false,
    speakerDetection: true,
    realTimeTranscription: true,
    autoSummary: true,
    language: 'en-US'
  });

  // Check authentication
  useEffect(() => {
    if (authChecked && !user) {
      router.push('/login');
    }
  }, [user, router, authChecked]);

  // Load meeting history
  useEffect(() => {
    if (user) {
      loadMeetingHistory();
    }
  }, [user]);

  const loadMeetingHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/zoom/meetings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMeetingHistory(data.meetings || []);
      }
    } catch (error) {
      console.error('Failed to load meeting history:', error);
    }
  };

  const connectToZoom = async () => {
    setIsConnecting(true);
    setConnectionError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/zoom/connect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.authUrl;
      } else {
        const error = await response.json();
        setConnectionError(error.message || 'Failed to connect to Zoom');
      }
    } catch (error) {
      setConnectionError('Network error occurred');
    } finally {
      setIsConnecting(false);
    }
  };

  const joinMeeting = async (meetingId) => {
    if (!isConnected) {
      setConnectionError('Please connect to Zoom first');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/zoom/join', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ meetingId })
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentMeeting(data.meeting);
        setIsRecording(true);
      } else {
        const error = await response.json();
        setConnectionError(error.message || 'Failed to join meeting');
      }
    } catch (error) {
      setConnectionError('Failed to join meeting');
    }
  };

  const endRecording = async () => {
    if (!currentMeeting) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/zoom/summary', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          meetingId: currentMeeting.id,
          transcription,
          speakers
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentMeeting(null);
        setIsRecording(false);
        setTranscription('');
        setSpeakers({});
        loadMeetingHistory();
      }
    } catch (error) {
      console.error('Failed to end recording:', error);
    }
  };

  const downloadTranscript = (meeting) => {
    const element = document.createElement('a');
    const file = new Blob([meeting.transcript], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${meeting.title}-transcript.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const viewTranscript = (meeting) => {
    setSelectedTranscript(meeting);
    setShowTranscriptModal(true);
  };

  if (authLoading || !authChecked) {
    return <LoadingSpinner />;
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
      <Head>
        <title>Zoom Meeting Notes - Ecouter Transcribe</title>
        <meta name="description" content="Automatically record, transcribe, and summarize your Zoom meetings with AI-powered note-taking." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-black text-white">
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
              <T>Automatically record, transcribe, and summarize your Zoom meetings with AI-powered insights</T>
            </p>
          </div>

          {/* Connection Status & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Connection Status */}
            <div className="file-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isConnected ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    <FiVideo className={`w-5 h-5 ${isConnected ? 'text-green-400' : 'text-red-400'}`} />
                  </div>
                  <div>
                    <h3 className="text-white font-medium">
                      <T>Zoom Connection</T>
                    </h3>
                    <p className={`text-sm ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                      {isConnected ? <T>Connected</T> : <T>Not Connected</T>}
                    </p>
                  </div>
                </div>
                <div className={`w-3 h-3 rounded-full ${
                  isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                }`}></div>
              </div>
              
              {!isConnected && (
                <button
                  onClick={connectToZoom}
                  disabled={isConnecting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  {isConnecting ? (
                    <>
                      <FiRefreshCw className="w-4 h-4 animate-spin" />
                      <span><T>Connecting...</T></span>
                    </>
                  ) : (
                    <>
                      <FiExternalLink className="w-4 h-4" />
                      <span><T>Connect to Zoom</T></span>
                    </>
                  )}
                </button>
              )}

              {connectionError && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FiAlertCircle className="w-4 h-4 text-red-400" />
                    <p className="text-sm text-red-400">{connectionError}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Join Meeting */}
            <div className="file-card p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <FiPlus className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-medium">
                    <T>Join Meeting</T>
                  </h3>
                  <p className="text-sm text-white/60">
                    <T>Enter meeting ID to start recording</T>
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Meeting ID"
                  value={joinMeetingId}
                  onChange={(e) => setJoinMeetingId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:border-white/20 transition-colors"
                />
                <button
                  onClick={() => joinMeeting(joinMeetingId)}
                  disabled={!isConnected || !joinMeetingId.trim()}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  <T>Join & Start Recording</T>
                </button>
              </div>
            </div>

            {/* Current Session */}
            <div className="file-card p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isRecording ? 'bg-red-500/20' : 'bg-gray-500/20'
                }`}>
                  {isRecording ? (
                    <FiMic className="w-5 h-5 text-red-400" />
                  ) : (
                    <FiMicOff className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-white font-medium">
                    <T>Recording Status</T>
                  </h3>
                  <p className={`text-sm ${isRecording ? 'text-red-400' : 'text-gray-400'}`}>
                    {isRecording ? <T>Recording Active</T> : <T>Not Recording</T>}
                  </p>
                </div>
              </div>
              
              {currentMeeting && (
                <div className="space-y-2">
                  <p className="text-sm text-white/80">{currentMeeting.title}</p>
                  <p className="text-xs text-white/60">
                    {Object.keys(speakers).length} <T>speakers detected</T>
                  </p>
                  <button
                    onClick={endRecording}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <FiStop className="w-4 h-4" />
                    <span><T>End Recording</T></span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Live Transcription */}
          {isRecording && (
            <div className="file-card p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">
                  <T>Live Transcription</T>
                </h2>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-red-400"><T>Recording</T></span>
                </div>
              </div>
              
              <div className="bg-black/30 rounded-lg p-4 max-h-64 overflow-y-auto">
                {transcription ? (
                  <div className="space-y-2">
                    {transcription.split('\n').map((line, index) => (
                      <div key={index} className="flex space-x-2">
                        <span className="text-blue-400 font-medium min-w-max">
                          {currentSpeaker || 'Speaker'}:
                        </span>
                        <span className="text-white/80">{line}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/40 italic">
                    <T>Waiting for speech...</T>
                  </p>
                )}
              </div>

              {/* Speaker Detection */}
              {Object.keys(speakers).length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-white/80 mb-2">
                    <T>Detected Speakers</T>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(speakers).map(([speakerId, info]) => (
                      <div
                        key={speakerId}
                        className={`px-3 py-1 rounded-full text-xs flex items-center space-x-1 ${
                          currentSpeaker === speakerId 
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                            : 'bg-white/10 text-white/60'
                        }`}
                      >
                        <FiUser className="w-3 h-3" />
                        <span>{info.name || `Speaker ${speakerId}`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Meeting History */}
          <div className="file-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">
                <T>Meeting History</T>
              </h2>
              <button
                onClick={loadMeetingHistory}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <FiRefreshCw className="w-4 h-4 text-white/60" />
              </button>
            </div>

            {meetingHistory.length === 0 ? (
              <div className="text-center py-8">
                <FiCalendar className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/40 mb-2">
                  <T>No meetings recorded yet</T>
                </p>
                <p className="text-sm text-white/30">
                  <T>Connect to Zoom and join a meeting to start recording</T>
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {meetingHistory.map((meeting) => (
                  <div key={meeting.id} className="bg-white/5 rounded-lg p-4 hover:bg-white/8 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <FiVideo className="w-5 h-5 text-blue-400" />
                          <h3 className="font-medium text-white">{meeting.title}</h3>
                          <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">
                            <T>Completed</T>
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-white/60">
                          <div className="flex items-center space-x-2">
                            <FiClock className="w-4 h-4" />
                            <span>{new Date(meeting.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <FiUsers className="w-4 h-4" />
                            <span>{meeting.participants} <T>participants</T></span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <FiMessageSquare className="w-4 h-4" />
                            <span>{meeting.duration} <T>minutes</T></span>
                          </div>
                        </div>

                        {meeting.summary && (
                          <p className="mt-2 text-sm text-white/70 line-clamp-2">
                            {meeting.summary}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => viewTranscript(meeting)}
                          className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors"
                          title="View Transcript"
                        >
                          <FiEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => downloadTranscript(meeting)}
                          className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition-colors"
                          title="Download Transcript"
                        >
                          <FiDownload className="w-4 h-4" />
                        </button>
                        <button
                          className="p-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition-colors"
                          title="Share"
                        >
                          <FiShare2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <Modal onClose={() => setShowSettings(false)}>
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                <T>Meeting Settings</T>
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-white/80">
                    <T>Auto-join meetings</T>
                  </label>
                  <input
                    type="checkbox"
                    checked={settings.autoJoin}
                    onChange={(e) => setSettings({...settings, autoJoin: e.target.checked})}
                    className="rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-white/80">
                    <T>Speaker detection</T>
                  </label>
                  <input
                    type="checkbox"
                    checked={settings.speakerDetection}
                    onChange={(e) => setSettings({...settings, speakerDetection: e.target.checked})}
                    className="rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-white/80">
                    <T>Real-time transcription</T>
                  </label>
                  <input
                    type="checkbox"
                    checked={settings.realTimeTranscription}
                    onChange={(e) => setSettings({...settings, realTimeTranscription: e.target.checked})}
                    className="rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-white/80">
                    <T>Auto-generate summary</T>
                  </label>
                  <input
                    type="checkbox"
                    checked={settings.autoSummary}
                    onChange={(e) => setSettings({...settings, autoSummary: e.target.checked})}
                    className="rounded"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  <T>Cancel</T>
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <T>Save Settings</T>
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Transcript Modal */}
        {showTranscriptModal && selectedTranscript && (
          <Modal onClose={() => setShowTranscriptModal(false)}>
            <div className="p-6 max-w-4xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">
                  {selectedTranscript.title}
                </h2>
                <button
                  onClick={() => downloadTranscript(selectedTranscript)}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <FiDownload className="w-4 h-4" />
                  <span><T>Download</T></span>
                </button>
              </div>
              
              <div className="bg-black/30 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="text-white/80 whitespace-pre-wrap text-sm leading-relaxed">
                  {selectedTranscript.transcript}
                </pre>
              </div>
              
              {selectedTranscript.summary && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium text-white mb-2">
                    <T>AI Summary</T>
                  </h3>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <p className="text-white/80">
                      {selectedTranscript.summary}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Modal>
        )}
      </div>
    </>
  );
}