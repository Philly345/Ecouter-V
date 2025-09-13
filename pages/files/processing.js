import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../components/AuthContext';
import Sidebar from '../../components/Sidebar';
import FileCard from '../../components/FileCard';
import { FiPlay, FiRefreshCw, FiFile, FiClock, FiX } from 'react-icons/fi';

export default function ProcessingFiles() {
  const router = useRouter();
  const { user, logout, authChecked, authLoading } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [cancellingFiles, setCancellingFiles] = useState(new Set());

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
          // Use actual step from database, or generate one based on progress
          step: file.step || getProcessingStep(file.progress || 15)
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
  
  // Helper function to determine processing step based on progress
  const getProcessingStep = (progress) => {
    if (progress < 20) {
      return 'Starting AI transcription';
    } else if (progress < 40) {
      return 'Processing audio with AI';
    } else if (progress < 70) {
      return 'Processing transcript and speakers';
    } else if (progress < 85) {
      return 'Translating content';
    } else if (progress < 95) {
      return 'Generating AI summary';
    } else {
      return 'Finalizing transcription';
    }
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
                <div key={file.id} className="p-4 bg-black border border-white/10 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                      <div className="flex-1 truncate text-sm">{file.name}</div>
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
                    {/* Progress Bar */}
                    <div className="w-full bg-white/10 rounded-full h-1 mt-2">
                      <div 
                        className="bg-white/30 h-1 rounded-full" 
                        style={{ width: `${file.progress || 0}%` }}
                      />
                    </div>
                    
                    {/* Progress Status */}
                    <div className="mt-1 text-xs text-white/60">
                      {file.step || 'Audio processing'}
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
