import { useEffect, useState } from 'react';
import Head from 'next/head';
import Sidebar from '../components/Sidebar';
import { FiSettings, FiRefreshCw, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function AISettings({ user }) {
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState(false);
  const [stats, setStats] = useState({
    totalFiles: 0,
    needFixing: 0
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Check for summaries that might need fixing
    checkSummaries();
  }, []);

  const checkSummaries = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ai-settings/check-summaries', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats({
          totalFiles: data.totalFiles || 0,
          needFixing: data.needFixing || 0
        });
      } else {
        toast.error('Failed to check summaries');
      }
    } catch (error) {
      console.error('Error checking summaries:', error);
    } finally {
      setLoading(false);
    }
  };

  const fixAllSummaries = async () => {
    try {
      setFixing(true);
      toast.info('Fixing summaries - this may take a while...', { autoClose: false, toastId: 'fixing-summaries' });
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ai-settings/fix-all-summaries', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.dismiss('fixing-summaries');
        toast.success(`Fixed ${data.fixed} summaries successfully!`);
        
        // Update stats
        await checkSummaries();
      } else {
        toast.dismiss('fixing-summaries');
        toast.error('Failed to fix summaries');
      }
    } catch (error) {
      console.error('Error fixing summaries:', error);
      toast.error('Error fixing summaries');
    } finally {
      setFixing(false);
    }
  };

  return (
    <>
      <Head>
        <title>AI Settings - Ecouter Transcribe</title>
        <meta name="description" content="Manage AI settings for your transcriptions" />
      </Head>

      <div className="min-h-screen bg-black text-white">
        <Sidebar 
          user={user} 
          currentPage="ai-settings"
          onSidebarToggle={(collapsed) => setSidebarCollapsed(collapsed)}
        />
        
        <div className={`p-6 overflow-auto transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'lg:ml-64'}`}>
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-2">AI Settings</h1>
              <p className="text-white/60">
                Manage AI-powered features and summaries
              </p>
            </div>
            
            {/* Summary Quality Section */}
            <div className="bg-black border border-white/10 rounded-lg p-6 mb-8">
              <div className="flex items-center mb-4">
                <FiSettings className="w-5 h-5 text-blue-400 mr-2" />
                <h2 className="text-lg font-semibold">AI Summary Quality</h2>
              </div>
              
              <p className="text-sm text-white/80 mb-4">
                Our AI sometimes produces summaries that repeat the transcript verbatim. Use this tool to analyze and fix all summaries.
              </p>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="spinner w-8 h-8"></div>
                </div>
              ) : stats.needFixing > 0 ? (
                <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div className="flex items-start">
                    <FiAlertCircle className="w-5 h-5 text-yellow-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-yellow-300 font-medium">
                        {stats.needFixing} of {stats.totalFiles} transcripts may need better summaries
                      </p>
                      <p className="text-xs text-white/60 mt-1">
                        Some summaries may be repeating the transcript verbatim or lack quality analysis.
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={fixAllSummaries}
                    disabled={fixing}
                    className="mt-4 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 transition-colors border border-yellow-500/30 rounded flex items-center text-sm"
                  >
                    {fixing ? (
                      <>
                        <FiRefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        <span>Fixing Summaries...</span>
                      </>
                    ) : (
                      <>
                        <FiRefreshCw className="w-4 h-4 mr-2" />
                        <span>Fix All Summaries</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-start">
                    <FiCheck className="w-5 h-5 text-green-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-green-300 font-medium">
                        All {stats.totalFiles} summaries look good!
                      </p>
                      <p className="text-xs text-white/60 mt-1">
                        No low-quality summaries detected in your transcripts.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="text-xs text-white/50">
                <p>Last checked: {new Date().toLocaleString()}</p>
              </div>
            </div>
            
            {/* Other AI settings can be added here */}
          </div>
        </div>
      </div>
    </>
  );
}
