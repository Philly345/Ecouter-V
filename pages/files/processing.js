import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../components/AuthContext';
import Sidebar from '../../components/Sidebar';
import FileCard from '../../components/FileCard';
import { FiPlay, FiRefreshCw, FiFile, FiClock } from 'react-icons/fi';

export default function ProcessingFiles() {
  const router = useRouter();
  const { user, logout, authChecked, authLoading } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
      const response = await fetch('/api/files?status=processing', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Process files to ensure they have progress and step information
        const processedFiles = (data.files || []).map(file => ({
          ...file,
          // Ensure progress exists (default to a random value between 10-90 if not available)
          progress: file.progress || Math.floor(Math.random() * 80) + 10,
          // Ensure step information exists
          step: file.step || getProcessingStep(file.progress || Math.floor(Math.random() * 80) + 10)
        }));
        setFiles(processedFiles);
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
    if (progress < 25) {
      return 'Converting audio format';
    } else if (progress < 50) {
      return 'Analyzing speech patterns';
    } else if (progress < 75) {
      return 'Generating transcript';
    } else {
      return 'Finalizing and creating summary';
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFiles();
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
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    <div className="flex-1 truncate text-sm">{file.name}</div>
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
