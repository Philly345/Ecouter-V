import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../components/AuthContext';
import Layout from '../../components/Layout';
import { 
  FiClock, 
  FiUser, 
  FiDownload, 
  FiPlay, 
  FiTrash2, 
  FiSearch,
  FiLoader,
  FiCalendar,
  FiMic,
  FiFileText
} from 'react-icons/fi';

export default function LiveTranscriptionSessions() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && token) {
      fetchSessions();
    }
  }, [user, token]);

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
      
      const response = await fetch('/api/live-transcription/list', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }

      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setError('Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSession = async (sessionId) => {
    if (!confirm('Are you sure you want to delete this session?')) {
      return;
    }

    try {
      const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
      
      const response = await fetch(`/api/live-transcription/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        setSessions(sessions.filter(session => session._id !== sessionId));
      } else {
        throw new Error('Failed to delete session');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      setError('Failed to delete session');
    }
  };

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (session.speakers && session.speakers.some(speaker => 
      speaker.toLowerCase().includes(searchTerm.toLowerCase())
    ))
  );

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Layout currentPage="live-transcription-sessions">
        <div className="min-h-screen bg-black flex items-center justify-center">
          <FiLoader className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Layout currentPage="live-transcription-sessions">
      <div className="min-h-screen bg-black">
        <div className="max-w-6xl mx-auto px-4 py-8">
          
          <div className="mb-8">
            <h1 className="text-2xl font-normal text-white mb-2">Live Transcription Sessions</h1>
            <p className="text-gray-400 text-sm">
              Manage and access your recorded transcription sessions
            </p>
          </div>

          <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="relative flex-1 max-w-md">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-black border border-gray-600 rounded text-white text-sm placeholder-gray-500 focus:border-gray-500 focus:outline-none"
              />
            </div>
            <Link href="/live-transcription">
              <button className="flex items-center px-4 py-2 bg-white text-black rounded hover:bg-gray-200 transition-colors text-sm font-medium">
                <FiMic className="w-4 h-4 mr-2" />
                New Session
              </button>
            </Link>
          </div>

          {error && (
            <div className="border border-red-600 bg-red-900/20 rounded p-4 mb-6">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <FiLoader className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-12">
              <FiMic className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">
                {searchTerm ? 'No sessions found' : 'No sessions yet'}
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                {searchTerm 
                  ? 'Try adjusting your search terms' 
                  : 'Start your first live transcription session'
                }
              </p>
              {!searchTerm && (
                <Link href="/live-transcription">
                  <button className="flex items-center mx-auto px-4 py-2 bg-white text-black rounded hover:bg-gray-200 transition-colors text-sm font-medium">
                    <FiMic className="w-4 h-4 mr-2" />
                    Start Recording
                  </button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredSessions.map((session) => (
                <div
                  key={session._id}
                  className="border border-gray-600 rounded-lg p-6 bg-gray-900 hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-white mb-2 truncate">
                        {session.title}
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-3">
                        <div className="flex items-center">
                          <FiCalendar className="w-4 h-4 mr-2" />
                          {new Date(session.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <FiClock className="w-4 h-4 mr-2" />
                          {formatDuration(session.duration)}
                        </div>
                        {session.speakers && session.speakers.length > 0 && (
                          <div className="flex items-center">
                            <FiUser className="w-4 h-4 mr-2" />
                            {session.speakers.length} speaker{session.speakers.length > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>

                      {session.speakers && session.speakers.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {session.speakers.map((speaker, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-xs"
                            >
                              {speaker}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {session.audioUrl && (
                        <a
                          href={session.audioUrl}
                          download
                          className="p-2 border border-gray-600 rounded text-gray-300 hover:bg-gray-800 transition-colors"
                          title="Download Audio"
                        >
                          <FiDownload className="w-4 h-4" />
                        </a>
                      )}
                      
                      <Link href={`/live-transcription/${session._id}`}>
                        <button
                          className="p-2 border border-gray-600 rounded text-gray-300 hover:bg-gray-800 transition-colors"
                          title="View Details"
                        >
                          <FiFileText className="w-4 h-4" />
                        </button>
                      </Link>
                      
                      <button
                        onClick={() => deleteSession(session._id)}
                        className="p-2 border border-red-600 rounded text-red-400 hover:bg-red-900/20 transition-colors"
                        title="Delete Session"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}