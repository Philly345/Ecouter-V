import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../components/AuthContext';
import Sidebar from '../../components/Sidebar';
import FileCard from '../../components/FileCard';
import { FiCheck, FiRefreshCw, FiDownload } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function CompletedFiles() {
  const router = useRouter();
  const { user, authChecked, authLoading, logout } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [notionToken, setNotionToken] = useState('');
  const [notionPageId, setNotionPageId] = useState('');
  const [showNotionModal, setShowNotionModal] = useState(false);

  useEffect(() => {
    if (authChecked && !user) {
      router.push('/login');
      return;
    }
    
    if (user) {
      fetchFiles();
    }
  }, [user, router, authChecked]);

  const fetchFiles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/files?status=completed', {
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
      const content = `Title: ${file.name}
Date: ${new Date(file.createdAt).toLocaleDateString()}
Duration: ${file.duration ? Math.ceil(file.duration / 60) : 'N/A'} minutes
${file.summary ? `\nSummary:\n${file.summary}` : ''}
${file.topic ? `\nTopic: ${file.topic}` : ''}
${file.speakers && file.speakers.length > 0 ? `\nSpeakers: ${file.speakers.join(', ')}` : ''}

Transcript:
${file.transcript}`;

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name.replace(/\.[^/.]+$/, '')}_transcript.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleDownloadAll = () => {
    if (files.length === 0) return;

    const allTranscripts = files.map(file => {
      return `=== ${file.name} ===
Date: ${new Date(file.createdAt).toLocaleDateString()}
Duration: ${file.duration ? Math.ceil(file.duration / 60) : 'N/A'} minutes
${file.summary ? `Summary: ${file.summary}` : ''}
${file.topic ? `Topic: ${file.topic}` : ''}
${file.speakers && file.speakers.length > 0 ? `Speakers: ${file.speakers.join(', ')}` : ''}

${file.transcript || 'No transcript available'}

`;
    }).join('\n');

    const blob = new Blob([allTranscripts], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all_transcripts_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = async (file, format) => {
    if (exporting) return;
    
    setExporting(true);
    
    try {
      const token = localStorage.getItem('token');
      const requestBody = {
        fileId: file.id,
        format: format
      };
      
      if (format === 'notion') {
        if (!notionToken) {
          setShowNotionModal(true);
          setExporting(false);
          return;
        }
        requestBody.notionToken = notionToken;
        requestBody.notionPageId = notionPageId;
      }
      
      const response = await fetch('/api/files/export', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        if (format === 'notion') {
          const data = await response.json();
          toast.success(`Successfully exported "${file.name}" to Notion!`);
          if (data.notionUrl) {
            window.open(data.notionUrl, '_blank');
          }
        } else {
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
          toast.success(`Successfully exported "${file.name}" as ${format.toUpperCase()}!`);
        }
      } else {
        const errorData = await response.json();
        toast.error(`Export failed: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const exportToNotion = async () => {
    if (!notionToken.trim()) {
      toast.error('Please enter your Notion integration token');
      return;
    }
    
    setShowNotionModal(false);
    // Re-trigger the export with the current file - we'll need to store which file triggered the modal
    // For now, just close the modal and let user try again
    toast.info('Please click Export to Notion again after entering your token');
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
        <title>Completed Files - Ecouter Transcribe</title>
        <meta name="description" content="View your completed transcriptions and download transcripts." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-black text-white">
        <Sidebar 
          user={user} 
          currentPage="completed" 
          onLogout={logout}
          onSidebarToggle={(collapsed) => setSidebarCollapsed(collapsed)}
        />
        
        <div className={`p-6 overflow-auto transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'lg:ml-64'}`}>
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">
              Completed Files
            </h1>
            <p className="text-white/60">
              Successfully transcribed files ready for download
            </p>
          </div>

          {/* Files Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="spinner w-8 h-8"></div>
            </div>
          ) : files.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {files.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  onDelete={handleDelete}
                  onDownload={handleDownload}
                  onExport={handleExport}
                />
              ))}
            </div>
          ) : (
            <div className="bg-black border border-white/10 rounded-xl text-center py-16 px-4 mt-10">
              <FiCheck className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <h3 className="text-base font-medium text-white mb-2">No completed files</h3>
              <p className="text-sm text-white/60 mb-6">
                Your completed transcriptions will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Notion Export Modal */}
      {showNotionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-black border border-white/20 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Export to Notion</h3>
            
            <div className="mb-4">
              <label className="block text-sm text-white/70 mb-2">
                Notion Integration Token *
              </label>
              <input
                type="password"
                value={notionToken}
                onChange={(e) => setNotionToken(e.target.value)}
                placeholder="secret_..."
                className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-sm"
              />
              <p className="text-xs text-white/50 mt-1">
                Create an integration at notion.com/my-integrations
              </p>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm text-white/70 mb-2">
                Page ID (optional)
              </label>
              <input
                type="text"
                value={notionPageId}
                onChange={(e) => setNotionPageId(e.target.value)}
                placeholder="Leave empty to create new page"
                className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-sm"
              />
              <p className="text-xs text-white/50 mt-1">
                Copy from page URL: notion.so/Page-ID
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowNotionModal(false)}
                className="flex-1 py-2 px-4 border border-white/20 rounded-lg text-sm hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={exportToNotion}
                disabled={!notionToken.trim()}
                className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 rounded-lg text-sm"
              >
                Export
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
