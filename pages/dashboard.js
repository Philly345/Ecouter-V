import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Sidebar from '../components/Sidebar';
import FileCard from '../components/FileCard';
import { useAuth } from '../components/AuthContext';
import T from '../components/T';
import { getDashboardEventManager, DASHBOARD_EVENTS, timeAgo, isRecentActivity } from '../utils/realtime';
import { 
  FiTrendingUp, 
  FiClock, 
  FiHardDrive, 
  FiActivity,
  FiUsers,
  FiFileText
} from 'react-icons/fi';

export default function Dashboard() {
  const router = useRouter();
  const { user, logout, loading: authLoading, authChecked } = useAuth();
  const { error, email } = router.query; // Get error params from Google OAuth redirect
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [eventManager, setEventManager] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle Google OAuth errors
  useEffect(() => {
    if (error === 'already_logged_in' && email) {
      setErrorMessage(`You are already signed in as ${decodeURIComponent(email)}. You cannot sign in with a different account in the same browser session.`);
      // Clear the error from URL
      router.replace('/dashboard', undefined, { shallow: true });
    }
  }, [error, email, router]);

  // Initialize event manager
  useEffect(() => {
    const manager = getDashboardEventManager();
    setEventManager(manager);

    // Subscribe to real-time events
    const unsubscribeDataUpdate = manager.subscribe(DASHBOARD_EVENTS.DATA_UPDATE, (data) => {
      console.log('📡 Real-time data update received:', data);
      setDashboardData(data);
      setLastUpdated(new Date());
    });

    return () => {
      unsubscribeDataUpdate();
    };
  }, []);

  useEffect(() => {
    console.log('🏠 Dashboard useEffect - authChecked:', authChecked, 'user:', !!user);
    
    // Only redirect if auth check is complete and no user found
    if (authChecked && !user) {
      console.log('🔄 No user after auth check, redirecting to login...');
      router.push('/login');
      return;
    }
    
    // Only fetch data if we have a user
    if (user) {
      console.log('👤 User found, fetching dashboard data...');
      fetchDashboardData();
    }
  }, [user, router, authChecked]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh || !user || loading) return;

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing dashboard data...');
      fetchDashboardData(true); // true = silent refresh
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, user, loading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setAutoRefresh(false);
    };
  }, []);

  const fetchDashboardData = async (silent = false) => {
    if (!silent) {
      console.log('🚀 Dashboard Frontend: Starting fetchDashboardData...');
      setIsRefreshing(true);
    }
    try {
      const token = localStorage.getItem('token');
      console.log('🔑 Dashboard Frontend: Token exists:', !!token);
      
      if (!token) {
        router.push('/login');
        return;
      }
      
      // Add timeout to prevent infinite loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      console.log('📡 Dashboard Frontend: Making API request to /api/dashboard');
      const response = await fetch('/api/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log('📡 Dashboard Frontend: API response status:', response.status);

      if (response.status === 401) {
        // Token is invalid, redirect to login
        localStorage.removeItem('token');
        router.push('/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        console.log('📈 Dashboard Frontend: Received data from API:', data);
        console.log('📊 Dashboard Frontend: Stats object:', data.stats);
        console.log('📊 Dashboard Frontend: Data structure check:', {
          hasStats: !!data.stats,
          statsKeys: data.stats ? Object.keys(data.stats) : [],
          recentFilesCount: data.recentFiles ? data.recentFiles.length : 0
        });
        console.log('📊 Dashboard Frontend: Setting dashboard data...');
        setDashboardData(data);
        console.log('✅ Dashboard Frontend: Dashboard data set successfully');
      } else {
        console.error('❌ Dashboard Frontend: Failed to fetch dashboard data:', response.status);
        const errorText = await response.text();
        console.error('❌ Dashboard Frontend: Error response:', errorText);
        // Set empty data to prevent infinite loading
        setDashboardData({
          stats: {
            totalTranscriptions: 0,
            completedTranscriptions: 0,
            processingTranscriptions: 0,
            errorTranscriptions: 0,
            storageUsed: 0,
            storageLimit: 1024 * 1024 * 1024,
            totalMinutes: 0
          },
          recentFiles: [],
          recentActivity: []
        });
      }
    } catch (error) {
      console.error('❌ Dashboard Frontend: Dashboard fetch error:', error);
      // Set empty data to prevent infinite loading
      setDashboardData({
        stats: {
          totalTranscriptions: 0,
          completedTranscriptions: 0,
          processingTranscriptions: 0,
          errorTranscriptions: 0,
          storageUsed: 0,
          storageLimit: 1024 * 1024 * 1024,
          totalMinutes: 0
        },
        recentFiles: [],
        recentActivity: []
      });
    } finally {
      if (!silent) {
        console.log('🏁 Dashboard Frontend: Setting loading to false');
        setLoading(false);
      }
      setIsRefreshing(false);
      setLastUpdated(new Date());
    }
  };

  // Manual refresh function
  const handleRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    fetchDashboardData();
  };

  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
    console.log('🔄 Auto-refresh toggled:', !autoRefresh);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Export functions
  const handleExport = async (file, format) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/files/export', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId: file.id,
          format: format
        }),
      });

      if (response.ok) {
        if (format === 'pdf' || format === 'docx') {
          // For PDF and DOCX, trigger download
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          const extension = format === 'pdf' ? 'pdf' : 'docx';
          a.href = url;
          a.download = `${file.name.replace(/\.[^/.]+$/, '')}_transcript.${extension}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }
      } else {
        const errorData = await response.json();
        console.error('Export failed:', errorData.error);
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const handleDownload = (file) => {
    if (!file || !file.transcript) return;
    
    const element = document.createElement('a');
    const fileText = `Transcript: ${file.name}\nDate: ${new Date(file.createdAt).toLocaleDateString()}\nDuration: ${formatDuration(file.duration)}\n\n--- FULL TRANSCRIPT ---\n\n${file.transcript}`;
    
    const blob = new Blob([fileText], { type: 'text/plain' });
    element.href = URL.createObjectURL(blob);
    element.download = `${file.name.replace(/\.[^/.]+$/, '')}_transcript.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(element.href);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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

  // Show loading while dashboard data is being fetched
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex">
        <Sidebar user={user} currentPage="dashboard" onLogout={logout} />
        <div className="flex-1 lg:ml-64 flex items-center justify-center">
          <div className="spinner w-8 h-8"></div>
        </div>
      </div>
    );
  }

  const stats = dashboardData?.stats || {};
  const recentFiles = dashboardData?.recentFiles || [];
  const recentActivity = dashboardData?.recentActivity || [];
  
  console.log('🎯 Dashboard Frontend: Rendering with data:', {
    loading,
    dashboardData: !!dashboardData,
    stats,
    recentFilesCount: recentFiles.length,
    recentActivityCount: recentActivity.length
  });

  // Additional debug - check specific stat values
  console.log('🔢 Dashboard Frontend: Individual stat values:', {
    totalTranscriptions: stats.totalTranscriptions,
    completedTranscriptions: stats.completedTranscriptions,
    processingTranscriptions: stats.processingTranscriptions,
    totalMinutes: stats.totalMinutes,
    storageUsed: stats.storageUsed,
    storagePercentage: stats.storagePercentage
  });

  return (
    <>
      <Head>
        <title>Dashboard - Ecouter Transcribe</title>
        <meta name="description" content="View your transcription analytics and recent files." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-black text-white">
        <Sidebar 
          user={user} 
          currentPage="dashboard"
          onLogout={logout}
          onSidebarToggle={(collapsed) => setSidebarCollapsed(collapsed)}
        />
        
        <div className={`p-6 overflow-auto transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'lg:ml-64'}`}>
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold gradient-text mb-2">
                  Welcome, {user?.name?.split(' ')[0] || 'User'}
                </h1>
                <p className="text-white/60">
                  <T>Here's what's happening with your transcriptions</T>
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FiUsers className="w-5 h-5" />
                  <span className="font-medium">Account Security Notice</span>
                </div>
                <button
                  onClick={() => setErrorMessage('')}
                  className="text-red-300 hover:text-red-200 transition-colors"
                >
                  ×
                </button>
              </div>
              <p className="mt-2 text-sm">{errorMessage}</p>
              <p className="mt-1 text-xs text-red-400">
                To use a different account, please sign out first using the sidebar menu.
              </p>
            </div>
          )}

          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Transcriptions */}
            <div className="file-card p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <FiFileText className="w-5 h-5 text-blue-400" />
                </div>
                <FiTrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {stats.totalTranscriptions !== undefined ? stats.totalTranscriptions : 0}
              </div>
              <div className="text-sm text-white/60">
                <T>Total Transcriptions</T>
              </div>
            </div>

            {/* Minutes Used */}
            <div className="file-card p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <FiClock className="w-5 h-5 text-yellow-400" />
                </div>
                <FiTrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {stats.totalMinutes || 0}
              </div>
              <div className="text-sm text-white/60">
                <T>Minutes Transcribed</T>
              </div>
            </div>

            {/* Storage Used */}
            <div className="file-card p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <FiHardDrive className="w-5 h-5 text-purple-400" />
                </div>
                <span className="text-xs text-white/60">{stats.storagePercentage || 0}%</span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {formatFileSize(stats.storageUsed || 0)}
              </div>
              <div className="text-sm text-white/60">
                <T>of 1 GB used</T>
              </div>
              
              {/* Storage Bar */}
              <div className="mt-3 progress-bar h-2 rounded-full">
                <div 
                  className="progress-fill h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(stats.storagePercentage || 0, 100)}%` }}
                />
              </div>
            </div>

            {/* Active Status */}
            <div className="file-card p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <FiActivity className="w-5 h-5 text-green-400" />
                </div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {stats.processingTranscriptions || 0}
              </div>
              <div className="text-sm text-white/60">
                <T>Processing Now</T>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Files */}
            <div className="file-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">
                  <T>Recent Files</T>
                </h2>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={handleRefresh}
                    className="text-white/40 hover:text-white/60 transition-colors"
                    title="Refresh files"
                  >
                    <FiActivity className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>
                  <button 
                    onClick={() => router.push('/files/recent')}
                    className="text-white/60 hover:text-white transition-colors text-sm"
                  >
                    <T>View All</T>
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                {recentFiles.length > 0 ? (
                  recentFiles.map((file) => (
                    <FileCard 
                      key={file.id} 
                      file={file} 
                      showActions={true}
                      onExport={handleExport}
                      onDownload={handleDownload}
                    />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FiFileText className="w-12 h-12 text-white/20 mx-auto mb-3" />
                    <p className="text-white/60 text-sm">
                      <T>No files yet</T>
                    </p>
                    <button 
                      onClick={() => router.push('/upload')}
                      className="mt-3 glow-button px-4 py-2 rounded-lg text-sm"
                    >
                      <T>Upload Your First File</T>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="file-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">
                  <T>Recent Activity</T>
                </h2>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={handleRefresh}
                    className="text-white/40 hover:text-white/60 transition-colors"
                    title="Refresh activity"
                  >
                    <FiActivity className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>
                  {autoRefresh && (
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" title="Auto-refresh active"></div>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => {
                    const isRecent = isRecentActivity(activity.timestamp);
                    return (
                      <div key={activity.id || index} className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          isRecent ? 'bg-green-400 animate-pulse' : 'bg-blue-400'
                        }`}></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white/80 truncate">{activity.description}</p>
                          <p className="text-xs text-white/60">{activity.type}</p>
                          <p className="text-xs text-white/40">
                            {activity.timestamp ? timeAgo(activity.timestamp) : 'Unknown time'}
                          </p>
                          {isRecent && (
                            <span className="inline-block px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full mt-1">
                              New
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <FiActivity className="w-12 h-12 text-white/20 mx-auto mb-3" />
                    <p className="text-white/60 text-sm">
                      <T>No recent activity</T>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-white mb-4">
              <T>Quick Actions</T>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={() => router.push('/upload')}
                className="file-card p-4 text-left hover:bg-white/8 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mb-3">
                  <FiFileText className="w-4 h-4 text-blue-400" />
                </div>
                <h3 className="font-medium text-white mb-1">
                  <T>Upload File</T>
                </h3>
                <p className="text-sm text-white/60">
                  <T>Start a new transcription</T>
                </p>
              </button>

              <button 
                onClick={() => router.push('/files/processing')}
                className="file-card p-4 text-left hover:bg-white/8 transition-colors"
              >
                <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center mb-3">
                  <FiClock className="w-4 h-4 text-yellow-400" />
                </div>
                <h3 className="font-medium text-white mb-1">
                  <T>Processing Files</T>
                </h3>
                <p className="text-sm text-white/60">
                  <T>Check active transcriptions</T>
                </p>
              </button>

              <button 
                onClick={() => router.push('/storage')}
                className="file-card p-4 text-left hover:bg-white/8 transition-colors"
              >
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center mb-3">
                  <FiHardDrive className="w-4 h-4 text-purple-400" />
                </div>
                <h3 className="font-medium text-white mb-1">
                  <T>Storage Usage</T>
                </h3>
                <p className="text-sm text-white/60">
                  <T>Manage your files</T>
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
