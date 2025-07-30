import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../components/AuthContext';
import Sidebar from '../../components/Sidebar';
import FileCard from '../../components/FileCard';
import { FiClock, FiRefreshCw, FiSearch, FiFilter, FiFileText } from 'react-icons/fi';

export default function RecentFiles() {
  const router = useRouter();
  const { user, logout, authChecked, authLoading } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (authChecked && !user) {
      router.push('/login');
      return;
    }
    
    if (user) {
      fetchFiles();
    }
  }, [user, router, activeFilter, authChecked]);

  const fetchFiles = async () => {
    try {
      const token = localStorage.getItem('token');
      // Add filter parameter based on activeFilter
      let url = '/api/files?limit=20&offset=0';
      if (activeFilter !== 'all') {
        url += `&status=${activeFilter}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
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

  const handleRefresh = () => {
    setRefreshing(true);
    fetchFiles();
  };

  const handleDelete = async (fileId) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setFiles(files.filter(file => file.id !== fileId));
      } else {
        alert('Failed to delete file');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete file');
    }
  };

  const handleDownload = (file) => {
    if (file.transcript) {
      const blob = new Blob([file.transcript], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name}_transcript.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
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
        <title>Recent Files - Ecouter Transcribe</title>
        <meta name="description" content="View your recently uploaded files and transcriptions." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-black text-white">
        <Sidebar 
          user={user} 
          currentPage="recent"
          onLogout={logout}
          onSidebarToggle={(collapsed) => setSidebarCollapsed(collapsed)} 
        />
        
        <div className={`p-6 overflow-auto transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'lg:ml-64'}`}>
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">
              Recent Files
            </h1>
            <p className="text-white/60 text-sm">
              Manage and access your transcribed files
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-6">
            <div className="relative mb-4">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60" />
              <input 
                type="text" 
                placeholder="Search files..." 
                className="w-full bg-black border border-white/10 rounded-lg py-3 px-12 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex space-x-2">
              <button 
                className={`px-4 py-2 rounded-lg flex items-center text-sm ${activeFilter === 'all' ? 'bg-white text-black' : 'bg-black border border-white/20 text-white'}`}
                onClick={() => setActiveFilter('all')}
              >
                <FiFilter className="mr-2 w-4 h-4" />
                All
              </button>
              <button 
                className={`px-4 py-2 rounded-lg flex items-center text-sm ${activeFilter === 'completed' ? 'bg-white text-black' : 'bg-black border border-white/20 text-white'}`}
                onClick={() => setActiveFilter('completed')}
              >
                Completed
              </button>
              <button 
                className={`px-4 py-2 rounded-lg flex items-center text-sm ${activeFilter === 'processing' ? 'bg-white text-black' : 'bg-black border border-white/20 text-white'}`}
                onClick={() => setActiveFilter('processing')}
              >
                Processing
              </button>
              <button 
                className={`px-4 py-2 rounded-lg flex items-center text-sm ${activeFilter === 'error' ? 'bg-white text-black' : 'bg-black border border-white/20 text-white'}`}
                onClick={() => setActiveFilter('error')}
              >
                Error
              </button>
            </div>
          </div>

          {/* Files List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="spinner w-8 h-8"></div>
            </div>
          ) : files.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {files
                .filter(file => 
                  file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (file.transcript && file.transcript.toLowerCase().includes(searchQuery.toLowerCase()))
                )
                .map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    onDelete={handleDelete}
                    onDownload={handleDownload}
                  />
                ))}
            </div>
          ) : (
            <div className="border border-white/10 rounded-xl p-16 text-center">
              <FiFileText className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No files found</h3>
              <p className="text-white/60 mb-6 text-sm">
                Upload your first file to get started
              </p>
              <button 
                onClick={() => router.push('/upload')}
                className="bg-white text-black px-6 py-3 rounded-lg text-sm font-medium"
              >
                Upload File
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
