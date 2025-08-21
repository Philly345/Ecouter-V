import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../components/AuthContext';
import Layout from '../../components/Layout';
import { 
  FiArrowLeft, 
  FiClock, 
  FiUser, 
  FiDownload, 
  FiCalendar,
  FiLoader,
  FiMic,
  FiTrash2
} from 'react-icons/fi';

export default function LiveTranscriptionSession() {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (id && user && token) {
      fetchSession();
    }
  }, [id, user, token]);

  const fetchSession = async () => {
    try {
      setIsLoading(true);
      const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
      
      const response = await fetch(`/api/live-transcription/${id}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setError('Session not found');
        } else {
          throw new Error('Failed to fetch session');
        }
        return;
      }

      const data = await response.json();
      setSession(data.session);
    } catch (error) {
      console.error('Error fetching session:', error);
      setError('Failed to load session');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSession = async () => {
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }

    try {
      const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
      
      const response = await fetch(`/api/live-transcription/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        router.push('/live-transcription/sessions');
      } else {
        throw new Error('Failed to delete session');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      setError('Failed to delete session');
    }
  };

  const downloadTranscript = () => {
    if (!session || !session.transcripts) return;

    const content = session.transcripts.map(t => 
      `[${t.recordingTime || '00:00'}] ${t.speaker}: ${t.text}`
    ).join('\n\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.title}-transcript-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading || isLoading) {
    return (
      <Layout currentPage="live-transcription-detail">
        <div className="min-h-screen bg-black flex items-center justify-center">
          <FiLoader className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  if (error || !session) {
    return (
      <Layout currentPage="live-transcription-detail">
        <div className="min-h-screen bg-black">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="text-center py-12">
              <FiMic className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-300 mb-2">
                {error || 'Session not found'}
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                The session you're looking for doesn't exist or has been deleted.
              </p>
              <Link href="/live-transcription/sessions">
                <button className="flex items-center mx-auto px-4 py-2 bg-white text-black rounded hover:bg-gray-200 transition-colors text-sm font-medium">
                  <FiArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sessions
                </button>
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout currentPage="live-transcription-detail">
      <div className="min-h-screen bg-black">
        <div className="max-w-4xl mx-auto px-4 py-8">
          
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <Link href="/live-transcription/sessions">
                <button className="flex items-center px-3 py-2 text-gray-400 hover:text-white transition-colors text-sm mr-4">
                  <FiArrowLeft className="w-4 h-4 mr-2" />
                  Sessions
                </button>
              </Link>
              <div>
                <h1 className="text-2xl font-normal text-white mb-1">{session.title}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-400">
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
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {session.transcripts && session.transcripts.length > 0 && (
                <button
                  onClick={downloadTranscript}
                  className="flex items-center px-3 py-2 border border-gray-600 rounded text-gray-300 hover:bg-gray-800 transition-colors text-sm"
                >
                  <FiDownload className="w-4 h-4 mr-2" />
                  Transcript
                </button>
              )}
              
              {session.audioUrl && (
                <a
                  href={session.audioUrl}
                  download
                  className="flex items-center px-3 py-2 border border-gray-600 rounded text-gray-300 hover:bg-gray-800 transition-colors text-sm"
                >
                  <FiDownload className="w-4 h-4 mr-2" />
                  Audio
                </a>
              )}
              
              <button
                onClick={deleteSession}
                className="flex items-center px-3 py-2 border border-red-600 rounded text-red-400 hover:bg-red-900/20 transition-colors text-sm"
              >
                <FiTrash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            <div className="lg:col-span-1">
              {session.speakers && session.speakers.length > 0 && (
                <div className="border border-gray-600 rounded-lg p-6 bg-gray-900 mb-6">
                  <h3 className="text-base font-medium text-white mb-4">Speakers</h3>
                  <div className="space-y-2">
                    {session.speakers.map((speaker, index) => (
                      <div
                        key={index}
                        className="flex items-center px-3 py-2 bg-black rounded text-sm"
                      >
                        <FiUser className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="text-gray-300">{speaker}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {session.audioUrl && (
                <div className="border border-gray-600 rounded-lg p-6 bg-gray-900">
                  <h3 className="text-base font-medium text-white mb-4">Audio Recording</h3>
                  <audio controls className="w-full rounded bg-black">
                    <source src={session.audioUrl} type="audio/wav" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
            </div>

            <div className="lg:col-span-3">
              <div className="border border-gray-600 rounded-lg p-6 bg-gray-900">
                <h3 className="text-base font-medium text-white mb-4">Transcript</h3>
                
                {session.transcripts && session.transcripts.length > 0 ? (
                  <div className="space-y-4 max-h-96 overflow-y-auto bg-black rounded p-4">
                    {session.transcripts.map((transcript, index) => (
                      <div key={index} className="border-l-2 border-gray-600 pl-4">
                        <div className="flex items-center space-x-2 mb-1">
                          <FiUser className="w-3 h-3 text-gray-400" />
                          <span className="text-sm font-medium text-white">{transcript.speaker}</span>
                          {transcript.recordingTime && (
                            <span className="text-xs text-gray-500">{transcript.recordingTime}</span>
                          )}
                          {transcript.timestamp && (
                            <span className="text-xs text-gray-500">{transcript.timestamp}</span>
                          )}
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed">{transcript.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FiMic className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No transcript available for this session</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}