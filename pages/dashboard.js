import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Sidebar from '../components/Sidebar';
import FileCard from '../components/FileCard';
import { useAuth } from '../components/AuthContext';
import T from '../components/T';
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
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        console.error('Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
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

  return (
    <>
      <Head>
        <title><T>Dashboard</T> - Ecouter Transcribe</title>
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
            <h1 className="text-2xl font-bold gradient-text mb-2">
              <T>Welcome back</T>, {user.name}!
            </h1>
            <p className="text-white/60">
              <T>Here's what's happening with your transcriptions</T>
            </p>
          </div>

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
                {stats.totalTranscriptions || 0}
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
                <button 
                  onClick={() => router.push('/files/recent')}
                  className="text-white/60 hover:text-white transition-colors text-sm"
                >
                  <T>View All</T>
                </button>
              </div>
              
              <div className="space-y-4">
                {recentFiles.length > 0 ? (
                  recentFiles.map((file) => (
                    <FileCard 
                      key={file.id} 
                      file={file} 
                      showActions={false} 
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
                <FiActivity className="w-5 h-5 text-white/40" />
              </div>
              
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/80 truncate">{activity.name}</p>
                        <p className="text-xs text-white/60">{activity.type}</p>
                        <p className="text-xs text-white/40">
                          {new Date(activity.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))
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
