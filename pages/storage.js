import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../components/AuthContext';
import { FiHardDrive, FiTrash2, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';

export default function Storage() {
  const router = useRouter();
  const { user, logout, loading: authLoading, authChecked } = useAuth();
  const [storageData, setStorageData] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Only redirect if auth check is complete and no user found
    if (authChecked && !user) {
      router.push('/login');
      return;
    }
    
    // Only fetch data if we have a user
    if (user) {
      fetchStorageData();
    }
  }, [user, router, authChecked]);

  const fetchStorageData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/files', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStorageData(data.storage);
        setFiles(data.files || []);
      } else {
        console.error('Failed to fetch storage data');
      }
    } catch (error) {
      console.error('Storage fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStorageData();
  };

  const handleDelete = async (fileId) => {
    if (!confirm('Are you sure you want to delete this file? This action cannot be undone.')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Refresh data after deletion
        fetchStorageData();
      } else {
        alert('Failed to delete file');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete file');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'processing':
        return 'text-yellow-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="spinner w-8 h-8"></div>
      </div>
    );
  }

  // Show loading while auth is being checked
  if (!authChecked || authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Storage Usage - Ecouter Transcribe</title>
        <meta name="description" content="Manage your storage usage and delete files to free up space." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-black text-white">
        <Sidebar 
          user={user} 
          currentPage="storage"
          onLogout={logout}
          onSidebarToggle={(collapsed) => setSidebarCollapsed(collapsed)}
        />
        
        <div className={`p-6 overflow-auto transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'lg:ml-64'}`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold gradient-text mb-2 flex items-center space-x-2">
                <FiHardDrive className="w-6 h-6" />
                <span>Storage Usage</span>
              </h1>
              <p className="text-white/60">
                Manage your storage and free up space
              </p>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="glow-button px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50"
            >
              <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="spinner w-8 h-8"></div>
            </div>
          ) : (
            <>
              {/* Storage Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Storage Usage */}
                <div className="file-card p-6 md:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Storage Usage</h3>
                    <span className="text-sm text-white/60">
                      {storageData?.percentage || 0}% used
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <div className="progress-bar h-4 rounded-full">
                      <div 
                        className={`progress-fill h-full rounded-full transition-all duration-500 ${
                          (storageData?.percentage || 0) > 80 ? 'bg-red-500' : 
                          (storageData?.percentage || 0) > 60 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(storageData?.percentage || 0, 100)}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-sm text-white/60">
                    <span>{formatFileSize(storageData?.used || 0)} used</span>
                    <span>{formatFileSize(storageData?.limit || 1073741824)} total</span>
                  </div>

                  {(storageData?.percentage || 0) > 80 && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <FiAlertCircle className="w-4 h-4 text-red-400" />
                        <span className="text-sm text-red-300">
                          Storage almost full. Consider deleting old files.
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="space-y-4">
                  <div className="file-card p-4">
                    <div className="text-xl font-bold text-white">{files.length}</div>
                    <div className="text-sm text-white/60">Total Files</div>
                  </div>
                  <div className="file-card p-4">
                    <div className="text-xl font-bold text-white">
                      {files.filter(f => f.status === 'completed').length}
                    </div>
                    <div className="text-sm text-white/60">Completed</div>
                  </div>
                  <div className="file-card p-4">
                    <div className="text-xl font-bold text-white">
                      {files.filter(f => f.status === 'processing').length}
                    </div>
                    <div className="text-sm text-white/60">Processing</div>
                  </div>
                </div>
              </div>

              {/* Files List */}
              <div className="file-card p-6">
                <h3 className="text-lg font-semibold text-white mb-6">All Files</h3>
                
                {files.length > 0 ? (
                  <div className="space-y-3">
                    {files
                      .sort((a, b) => (b.size || 0) - (a.size || 0)) // Sort by size, largest first
                      .map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/8 transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3">
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-white truncate">
                                  {file.name}
                                </h4>
                                <div className="flex items-center space-x-4 text-xs text-white/60 mt-1">
                                  <span className={`capitalize ${getStatusColor(file.status)}`}>
                                    {file.status}
                                  </span>
                                  <span>{formatFileSize(file.size || 0)}</span>
                                  <span>
                                    {new Date(file.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleDelete(file.id)}
                            className="ml-4 p-2 text-white/60 hover:text-red-400 transition-colors"
                            title="Delete file"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FiHardDrive className="w-12 h-12 text-white/20 mx-auto mb-3" />
                    <p className="text-white/60">No files found</p>
                  </div>
                )}
              </div>

              {/* Storage Tips */}
              <div className="mt-8 file-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Storage Tips</h3>
                <ul className="space-y-2 text-sm text-white/70">
                  <li>• Delete old or unnecessary files to free up space</li>
                  <li>• Download transcripts before deleting files</li>
                  <li>• Larger files take up more storage space</li>
                  <li>• Failed transcriptions still use storage space</li>
                  <li>• Your storage limit is 1GB for all uploaded files</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
