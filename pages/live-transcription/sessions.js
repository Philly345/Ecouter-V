import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../components/AuthContext';
import Sidebar from '../../components/Sidebar';
import T from '../../components/T';
import { 
  FiClock, 
  FiUser, 
  FiPlay, 
  FiDownload, 
  FiSearch,
  FiCalendar,
  FiMic,
  FiLoader,
  FiChevronRight,
  FiX,
  FiEdit3,
  FiSave,
  FiVolume2
} from 'react-icons/fi';

export default function LiveTranscriptionSessions() {
  const { user, logout, loading: authLoading, authChecked } = useAuth();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedSession, setSelectedSession] = useState(null);
  const [error, setError] = useState(null);
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);
  const [editedTranscripts, setEditedTranscripts] = useState([]);
  const [isSavingTranscript, setIsSavingTranscript] = useState(false);

  useEffect(() => {
    if (authChecked && !user) {
      router.push('/login');
    }
  }, [user, router, authChecked]);

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user, currentPage, searchTerm]);

  const fetchSessions = async () => {
    try {
      const authToken = localStorage.getItem('token');
      
      if (!authToken) {
        setError('No authentication token available');
        return;
      }

      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: searchTerm
      });

      const response = await fetch(`/api/live-transcription/list?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }

      const data = await response.json();
      setSessions(data.sessions);
      setTotalPages(data.pagination.pages);
      setError(null);
    } catch (error) {
      console.error('Fetch sessions error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const viewSession = async (sessionId) => {
    try {
      const authToken = localStorage.getItem('token');
      
      const response = await fetch(`/api/live-transcription/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch session details');
      }

      const session = await response.json();
      console.log('🔍 Session loaded:', {
        id: session.id,
        title: session.title,
        hasAudioUrl: Boolean(session.audioUrl),
        audioUrl: session.audioUrl,
        audioUrlType: typeof session.audioUrl,
        audioUrlLength: session.audioUrl?.length || 0,
        sessionKeys: Object.keys(session)
      });
      setSelectedSession(session);
      setEditedTranscripts(session.transcripts || []);
      setIsEditingTranscript(false);
    } catch (error) {
      console.error('View session error:', error);
      setError(error.message);
    }
  };

  const startEditingTranscript = () => {
    setIsEditingTranscript(true);
    setEditedTranscripts([...selectedSession.transcripts]);
  };

  const cancelEditingTranscript = () => {
    setIsEditingTranscript(false);
    setEditedTranscripts([...selectedSession.transcripts]);
  };

  const updateTranscriptText = (index, newText) => {
    const updated = [...editedTranscripts];
    updated[index].text = newText;
    setEditedTranscripts(updated);
  };

  const saveTranscriptChanges = async () => {
    if (!selectedSession) return;

    setIsSavingTranscript(true);
    try {
      const authToken = localStorage.getItem('token');

      const response = await fetch(`/api/live-transcription/${selectedSession.id}/update-transcript`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcripts: editedTranscripts
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save transcript changes');
      }

      // Update the selected session with new transcripts
      setSelectedSession({
        ...selectedSession,
        transcripts: editedTranscripts
      });
      setIsEditingTranscript(false);
      
      alert('Transcript updated successfully!');
    } catch (error) {
      console.error('Save transcript error:', error);
      alert('Failed to save transcript changes. Please try again.');
    } finally {
      setIsSavingTranscript(false);
    }
  };

  const downloadTranscript = (session) => {
    if (!session.transcripts || !Array.isArray(session.transcripts) || session.transcripts.length === 0) {
      alert('No transcripts available for this session.');
      return;
    }

    const content = session.transcripts.map(t => 
      `[${t.recordingTime || 'Unknown'}] ${t.speaker || 'Unknown'}: ${t.text || ''}`
    ).join('\n\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.title || 'transcript'}-transcript.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
        <title>Live Transcription Sessions | Ecouter</title>
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
            
            <div className="mb-8">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold mb-2">
                    <T>Live Transcription Sessions</T>
                  </h1>
                  <p className="text-sm text-white/60">
                    <T>View and manage your recorded live transcription sessions</T>
                  </p>
                </div>
                <button
                  onClick={() => router.push('/live-transcription')}
                  className="flex items-center px-3 py-1.5 bg-white text-black rounded-lg hover:bg-white/90 transition-colors text-sm font-medium"
                >
                  <FiMic className="w-3 h-3 mr-1.5" />
                  <T>New Recording</T>
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search sessions..."
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 hover:border-white/30 transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="border border-red-500/20 bg-red-500/10 rounded-xl p-4 mb-6">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="spinner w-8 h-8"></div>
              </div>
            ) : (
              <>
                {/* Sessions List */}
                {sessions.length === 0 ? (
                  <div className="text-center py-12">
                    <FiMic className="w-12 h-12 text-white/50 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">
                      <T>No sessions found</T>
                    </h3>
                    <p className="text-white/60 mb-4">
                      <T>
                        {searchTerm ? 'No sessions match your search.' : 'You haven\'t recorded any live sessions yet.'}
                      </T>
                    </p>
                    {!searchTerm && (
                      <button
                        onClick={() => router.push('/live-transcription')}
                        className="flex items-center mx-auto px-4 py-2 bg-white text-black rounded-xl hover:bg-white/90 transition-colors font-medium"
                      >
                        <FiMic className="w-4 h-4 mr-2" />
                        <T>Start Your First Recording</T>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className="file-card p-6 hover:bg-white/8 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-white mb-2">{session.title}</h3>
                            
                            <div className="flex items-center space-x-6 text-sm text-white/60 mb-3">
                              <div className="flex items-center">
                                <FiClock className="w-4 h-4 mr-1" />
                                {formatDuration(session.duration)}
                              </div>
                              <div className="flex items-center">
                                <FiUser className="w-4 h-4 mr-1" />
                                {session.transcriptCount} <T>transcripts</T>
                              </div>
                              <div className="flex items-center">
                                <FiCalendar className="w-4 h-4 mr-1" />
                                {formatDate(session.createdAt)}
                              </div>
                            </div>

                            {session.speakers && session.speakers.length > 0 && (
                              <div className="flex items-center space-x-2 mb-3">
                                <span className="text-sm text-white/60">
                                  <T>Speakers:</T>
                                </span>
                                {session.speakers.map((speaker, index) => (
                                  <span
                                    key={speaker}
                                    className="text-xs px-2 py-1 bg-white/10 text-white/80 rounded-full"
                                  >
                                    {speaker}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center space-x-2">
                            {session.audioUrl && (
                              <audio controls className="h-8">
                                <source src={session.audioUrl} type="audio/wav" />
                              </audio>
                            )}
                            
                            <button
                              onClick={() => viewSession(session.id)}
                              className="flex items-center px-2.5 py-1.5 bg-white text-black rounded-lg hover:bg-white/90 transition-colors text-sm font-medium"
                            >
                              <T>View Details</T>
                              <FiChevronRight className="w-3 h-3 ml-1" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-8">
                    <div className="flex space-x-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 rounded-xl text-sm transition-colors ${
                            page === currentPage
                              ? 'bg-white text-black font-medium'
                              : 'bg-white/10 text-white/80 hover:bg-white/15'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Session Detail Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="file-card max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-white/20 flex-shrink-0">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-medium text-white">{selectedSession.title}</h2>
                <button
                  onClick={() => {
                    setSelectedSession(null);
                    setIsEditingTranscript(false);
                  }}
                  className="text-white/60 hover:text-white transition-colors p-1"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center space-x-4 text-sm text-white/60 mt-2">
                <span>
                  <T>Duration:</T> {formatDuration(selectedSession.duration)}
                </span>
                <span>
                  <T>Created:</T> {formatDate(selectedSession.createdAt)}
                </span>
                <span>
                  <T>Transcripts:</T> {selectedSession.transcripts?.length || 0}
                </span>
              </div>
            </div>

            {/* Audio Player Section */}
            <div className="p-6 border-b border-white/20 flex-shrink-0">
              <div className="flex items-center space-x-3 mb-3">
                <FiVolume2 className="w-5 h-5 text-white/60" />
                <h3 className="text-base font-medium text-white">
                  <T>Recorded Audio</T>
                </h3>
                {selectedSession.audioUrl && (
                  <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">
                    <T>Available</T>
                  </span>
                )}
              </div>
              
              {selectedSession.audioUrl ? (
                <div className="bg-white/5 rounded-xl p-4">
                  {/* Debug info */}
                  <div className="bg-black/20 p-2 rounded mb-3 text-xs">
                    <div className="text-white/70 mb-1">
                      <strong>Debug Info:</strong>
                    </div>
                    <div className="text-white/50 mb-1">
                      Audio URL: {selectedSession.audioUrl || 'null'}
                    </div>
                    <div className="text-white/50 mb-1">
                      Type: {typeof selectedSession.audioUrl}
                    </div>
                    <div className="text-white/50">
                      Length: {selectedSession.audioUrl?.length || 0}
                    </div>
                  </div>
                  
                  <audio 
                    controls 
                    preload="metadata"
                    className="w-full h-12 rounded-lg"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    }}
                    onError={(e) => {
                      console.error('Audio playback error:', e);
                      console.log('Audio URL:', selectedSession.audioUrl);
                    }}
                    onLoadedMetadata={(e) => {
                      console.log('Audio loaded successfully:', e.target.duration);
                    }}
                  >
                    <source src={selectedSession.audioUrl} type="audio/wav" />
                    <source src={selectedSession.audioUrl} type="audio/mpeg" />
                    <source src={selectedSession.audioUrl} type="audio/webm" />
                    Your browser does not support the audio element.
                  </audio>
                  <div className="mt-2 text-xs text-white/50">
                    <T>Audio file:</T> {selectedSession.audioUrl}
                  </div>
                </div>
              ) : (
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  {/* Debug info for empty audio */}
                  <div className="bg-black/20 p-2 rounded mb-3 text-xs">
                    <div className="text-white/70 mb-1">
                      <strong>Debug Info (No Audio):</strong>
                    </div>
                    <div className="text-white/50 mb-1">
                      Audio URL: {selectedSession.audioUrl || 'null/undefined'}
                    </div>
                    <div className="text-white/50 mb-1">
                      Type: {typeof selectedSession.audioUrl}
                    </div>
                    <div className="text-white/50 mb-1">
                      Has audioUrl property: {selectedSession.hasOwnProperty('audioUrl') ? 'Yes' : 'No'}
                    </div>
                    <div className="text-white/50">
                      Session keys: {Object.keys(selectedSession).join(', ')}
                    </div>
                  </div>
                  
                  <FiVolume2 className="w-8 h-8 text-white/30 mx-auto mb-2" />
                  <p className="text-sm text-white/50">
                    <T>No audio recording available for this session</T>
                  </p>
                  <p className="text-xs text-white/30 mt-1">
                    <T>Audio may not have been saved during recording</T>
                  </p>
                  <div className="mt-3 text-xs text-white/30 bg-black/10 p-2 rounded">
                    <p className="mb-1"><T>To record audio for future sessions:</T></p>
                    <p>• <T>Start recording before speaking</T></p>
                    <p>• <T>Ensure microphone permissions are granted</T></p>
                    <p>• <T>Audio will be saved when you save the session</T></p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Transcript Section */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="p-6 pb-4 flex justify-between items-center flex-shrink-0">
                <h3 className="text-lg font-medium text-white">
                  <T>Transcript</T>
                </h3>
                <div className="flex space-x-2">
                  {!isEditingTranscript ? (
                    <>
                      <button
                        onClick={startEditingTranscript}
                        disabled={!selectedSession.transcripts || selectedSession.transcripts.length === 0}
                        className="flex items-center px-3 py-2 border border-white/20 rounded-xl text-white/80 hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FiEdit3 className="w-4 h-4 mr-2" />
                        <T>Edit Transcript</T>
                      </button>
                      <button
                        onClick={() => downloadTranscript(selectedSession)}
                        disabled={!selectedSession.transcripts || !Array.isArray(selectedSession.transcripts) || selectedSession.transcripts.length === 0}
                        className="flex items-center px-3 py-2 bg-white text-black rounded-xl hover:bg-white/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FiDownload className="w-4 h-4 mr-2" />
                        <T>Download</T>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={cancelEditingTranscript}
                        className="flex items-center px-3 py-2 border border-white/20 rounded-xl text-white/80 hover:bg-white/5 transition-colors"
                      >
                        <FiX className="w-4 h-4 mr-2" />
                        <T>Cancel</T>
                      </button>
                      <button
                        onClick={saveTranscriptChanges}
                        disabled={isSavingTranscript}
                        className="flex items-center px-3 py-2 bg-white text-black rounded-xl hover:bg-white/90 transition-colors font-medium disabled:opacity-50"
                      >
                        {isSavingTranscript ? (
                          <div className="spinner w-4 h-4 mr-2"></div>
                        ) : (
                          <FiSave className="w-4 h-4 mr-2" />
                        )}
                        <T>Save Changes</T>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Transcript Content */}
              <div className="px-6 pb-6 overflow-y-auto flex-1">
                {selectedSession.transcripts && Array.isArray(selectedSession.transcripts) && selectedSession.transcripts.length > 0 ? (
                  <div className="space-y-4">
                    {(isEditingTranscript ? editedTranscripts : selectedSession.transcripts).map((transcript, index) => (
                      <div key={transcript.id || index} className="border-l-2 border-white/20 pl-4 bg-white/5 rounded-r-xl p-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <FiUser className="w-3 h-3 text-white/60" />
                          <span className="text-sm font-medium text-white">{transcript.speaker || 'Unknown'}</span>
                          <span className="text-xs text-white/50">{transcript.recordingTime || 'Unknown'}</span>
                          <span className="text-xs text-white/50">{transcript.timestamp || 'Unknown'}</span>
                        </div>
                        
                        {isEditingTranscript ? (
                          <textarea
                            value={transcript.text || ''}
                            onChange={(e) => updateTranscriptText(index, e.target.value)}
                            className="w-full bg-white/5 border border-white/20 rounded-lg p-3 text-white/80 text-sm leading-relaxed resize-none hover:border-white/30 transition-all"
                            rows={3}
                            style={{ minHeight: '80px' }}
                          />
                        ) : (
                          <p className="text-white/80 text-sm leading-relaxed">{transcript.text || ''}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-white/50 py-8">
                    <FiMic className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      <T>No transcripts available for this session.</T>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}