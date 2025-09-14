import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../components/AuthContext';
import Sidebar from '../../components/Sidebar';
import FileCard from '../../components/FileCard';
import { FiPlay, FiRefreshCw, FiFile, FiClock, FiX, FiZap, FiStar, FiTrendingUp, FiUsers, FiCheck } from 'react-icons/fi';

export default function ProcessingFiles() {
  const router = useRouter();
  const { user, logout, authChecked, authLoading } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [cancellingFiles, setCancellingFiles] = useState(new Set());
  const [animatedMessages, setAnimatedMessages] = useState({});
  const [simulatedProgress, setSimulatedProgress] = useState({});

  useEffect(() => {
    if (authChecked && !user) {
      router.push('/login');
      return;
    }
    
    if (user) {
      fetchFiles();
      
      // Auto-refresh every 10 seconds for processing files
      const interval = setInterval(fetchFiles, 10000);
      return () => clearInterval(interval);
    }
  }, [user, router, authChecked]);

  const fetchFiles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/files?status=processing,processing_ai', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Process files to ensure they have progress and step information
        const processedFiles = (data.files || []).map(file => ({
          ...file,
          // Use actual progress from database, or default if not available
          progress: file.progress || 15,
          // Use animated step message based on progress and file ID
          step: file.step || getProcessingStep(file.progress || 15, file._id)
        }));
        
        setFiles(processedFiles);
        
        // Auto-redirect to recent files if no processing files remain
        if (processedFiles.length === 0 && !loading) {
          router.push('/files/recent');
          return;
        }
      } else {
        console.error('Failed to fetch files');
      }
    } catch (error) {
      console.error('Files fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Dynamic message sequences for each processing stage
  const messageSequences = {
    'starting': [
      'Starting AI transcription',
      'Great things are coming...',
      'Our AI is warming up',
      'Processing your audio file',
      'AI engines are spinning up',
      'Getting ready for magic'
    ],
    'processing': [
      'Processing audio with AI',
      'AI is analyzing your content',
      'Deep learning in progress',
      'Extracting audio patterns',
      'AI is listening carefully',
      'Converting speech to text'
    ],
    'speakers': [
      'Processing transcript and speakers',
      'Identifying unique voices',
      'AI is distinguishing speakers',
      'Analyzing conversation flow',
      'Mapping speaker patterns',
      'Almost there!'
    ],
    'translating': [
      'Translating content',
      'AI is working its magic',
      'Converting to your language',
      'Linguistic AI processing',
      'Translation engines active',
      'Making it perfect for you'
    ],
    'summary': [
      'Generating AI summary',
      'Creating intelligent insights',
      'AI is crafting your summary',
      'Analyzing key points',
      'Almost ready!',
      'Final touches being added'
    ],
    'finalizing': [
      'Finalizing transcription',
      'Polishing the results',
      'Quality checks in progress',
      'Adding final touches',
      'Success is moments away!',
      'Get ready for amazing results!'
    ]
  };

  // Simulate progress increase for files stuck at low progress
  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedProgress(prev => {
        const newProgress = { ...prev };
        files.forEach(file => {
          const currentProgress = file.progress || 15;
          const simulated = newProgress[file._id] || 0;
          
          // Only simulate if actual progress is low and file is still processing
          if (currentProgress < 30 && file.status === 'processing') {
            newProgress[file._id] = Math.min(simulated + Math.random() * 2, 25); // Slowly increase up to 25%
          }
        });
        return newProgress;
      });
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [files]);

  // Get effective progress (real + simulated)
  const getEffectiveProgress = (file) => {
    const realProgress = file.progress || 15;
    const simulated = simulatedProgress[file._id] || 0;
    return Math.min(realProgress + simulated, 100);
  };
  useEffect(() => {
    files.forEach(file => {
      if (!animatedMessages[file._id]) {
        const stage = getProcessingStage(file.progress || 15);
        setAnimatedMessages(prev => ({
          ...prev,
          [file._id]: { 
            stage, 
            messageIndex: 0, 
            lastUpdate: Date.now() 
          }
        }));
      }
    });
  }, [files]);

  // Animate messages every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedMessages(prev => {
        const newMessages = { ...prev };
        Object.keys(newMessages).forEach(fileId => {
          const messageData = newMessages[fileId];
          const currentSequence = messageSequences[messageData.stage];
          if (currentSequence) {
            newMessages[fileId] = {
              ...messageData,
              messageIndex: (messageData.messageIndex + 1) % currentSequence.length,
              lastUpdate: Date.now()
            };
          }
        });
        return newMessages;
      });
    }, 3000); // Change message every 3 seconds

    return () => clearInterval(interval);
  }, []);

  // Helper function to determine processing stage based on progress
  const getProcessingStage = (progress) => {
    if (progress < 20) return 'starting';
    if (progress < 40) return 'processing';
    if (progress < 70) return 'speakers';
    if (progress < 85) return 'translating';
    if (progress < 95) return 'summary';
    return 'finalizing';
  };
  
  // Helper function to determine processing step based on progress with animated messages
  const getProcessingStep = (progress, fileId) => {
    const stage = getProcessingStage(progress);
    const messageData = animatedMessages[fileId];
    
    if (messageData && messageData.stage === stage) {
      const currentSequence = messageSequences[stage];
      return currentSequence[messageData.messageIndex] || currentSequence[0];
    }
    
    // Fallback to first message of stage
    return messageSequences[stage]?.[0] || 'Processing...';
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFiles();
  };

  const handleCancelFile = async (fileId, fileName) => {
    if (!window.confirm(`Are you sure you want to cancel processing "${fileName}"? This action cannot be undone.`)) {
      return;
    }

    setCancellingFiles(prev => new Set([...prev, fileId]));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/files/${fileId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Remove the file from the list immediately
        setFiles(prev => prev.filter(file => file.id !== fileId));
        
        // Show success message
        console.log(`Successfully cancelled processing for "${fileName}"`);
        
        // Refresh the list to ensure consistency
        fetchFiles();
      } else {
        const errorData = await response.json();
        console.error('Failed to cancel file:', errorData.error);
        alert(`Failed to cancel file: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Cancel file error:', error);
      alert('Failed to cancel file. Please try again.');
    } finally {
      setCancellingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    }
  };
  
  if (!authChecked || authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="spinner w-6 h-6"></div>
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
        <title>Processing Files - Ecouter Transcribe</title>
        <meta name="description" content="View files currently being transcribed." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style jsx>{`
          .animate-fade-in {
            animation: fadeIn 0.5s ease-in-out;
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(2px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .processing-glow {
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
            animation: glow 2s ease-in-out infinite alternate;
          }
          
          @keyframes glow {
            from {
              box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
            }
            to {
              box-shadow: 0 0 30px rgba(255, 255, 255, 0.2);
            }
          }
        `}</style>
      </Head>

      <div className="min-h-screen bg-black text-white">
        <Sidebar 
          user={user} 
          currentPage="processing" 
          onLogout={logout}
          onSidebarToggle={(collapsed) => setSidebarCollapsed(collapsed)}
        />
        
        <div className={`p-6 overflow-auto transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'lg:ml-64'}`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-semibold mb-1">
                Processing Files
              </h1>
              <p className="text-sm text-white/60">
                Files currently being transcribed and analyzed
              </p>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-1.5 bg-black border border-white/20 rounded-lg text-xs flex items-center space-x-2 disabled:opacity-50"
            >
              <FiRefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Auto-refresh indicator */}
          <div className="mb-6 flex items-center">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse mr-2"></div>
            <span className="text-xs text-white/60">
              Auto-refreshing every 10 seconds
            </span>
          </div>

          {/* Files Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="spinner w-6 h-6"></div>
            </div>
          ) : files.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {files.map((file) => (
                <div key={file.id} className="p-4 bg-black border border-white/10 rounded-lg processing-glow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                      <div className="flex-1 truncate text-sm font-medium">{file.name}</div>
                    </div>
                    
                    {/* Cancel Button */}
                    <button
                      onClick={() => handleCancelFile(file.id, file.name)}
                      disabled={cancellingFiles.has(file.id)}
                      className="ml-3 p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Cancel processing"
                    >
                      {cancellingFiles.has(file.id) ? (
                        <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <FiX className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  
                  {/* File Details - simplified */}
                  <div className="mt-2">
                    {/* Enhanced Progress Bar - White, thinner */}
                    <div className="w-full bg-white/10 rounded-full h-1 mt-2 overflow-hidden">
                      <div 
                        className="h-1 rounded-full bg-white transition-all duration-1000 ease-out shadow-sm" 
                        style={{ 
                          width: `${getEffectiveProgress(file)}%`,
                          boxShadow: '0 0 8px rgba(255, 255, 255, 0.3)'
                        }}
                      />
                    </div>
                    
                    {/* Progress Status with animated message and icon */}
                    <div className="mt-2 flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        {/* Dynamic icon based on processing stage */}
                        {(() => {
                          const stage = getProcessingStage(file.progress || 15);
                          switch(stage) {
                            case 'starting': return <FiZap className="w-3 h-3 text-yellow-400 animate-pulse" />;
                            case 'processing': return <FiTrendingUp className="w-3 h-3 text-blue-400 animate-pulse" />;
                            case 'speakers': return <FiUsers className="w-3 h-3 text-green-400 animate-pulse" />;
                            case 'translating': return <FiStar className="w-3 h-3 text-purple-400 animate-pulse" />;
                            case 'summary': return <FiFile className="w-3 h-3 text-orange-400 animate-pulse" />;
                            case 'finalizing': return <FiCheck className="w-3 h-3 text-green-500 animate-pulse" />;
                            default: return <FiClock className="w-3 h-3 text-gray-400 animate-pulse" />;
                          }
                        })()}
                        
                        {/* Animated processing message */}
                        <span className="text-xs text-white/80 font-medium animate-fade-in">
                          {getProcessingStep(file.progress || 15, file._id)}
                        </span>
                      </div>
                      
                      {/* Progress percentage */}
                      <span className="text-xs text-white/40 ml-auto">
                        {Math.round(getEffectiveProgress(file))}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-black text-center py-16 px-4 rounded-lg border border-white/10">
              <FiClock className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <h3 className="text-base font-medium text-white mb-2">No files processing</h3>
              <p className="text-sm text-white/60 mb-6">
                All your files have been processed or are waiting to be uploaded.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
