import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../components/AuthContext';
import { getLanguageName } from '../../utils/languages';
import Sidebar from '../../components/Sidebar';
import { 
  FiFileText, 
  FiClock, 
  FiUser, 
  FiDownload,
  FiExternalLink,
  FiRefreshCw,
  FiSearch,
  FiCopy
} from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function TranscriptView() {
  const router = useRouter();
  const { id } = router.query;
  const { user, logout, authChecked, authLoading } = useAuth();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('full-transcript');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [notionToken, setNotionToken] = useState('');
  const [notionPageId, setNotionPageId] = useState('');
  const [showNotionModal, setShowNotionModal] = useState(false);

  useEffect(() => {
    if (authChecked && !user) {
      router.push('/login');
      return;
    }

    if (id && user) {
      fetchTranscriptDetails();
    }
  }, [user, router, id, authChecked]);

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportDropdownOpen && !event.target.closest('.export-dropdown')) {
        setExportDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [exportDropdownOpen]);

  const fetchTranscriptDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/files/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFile(data.file);
      } else {
        setError('Failed to load transcript');
      }
    } catch (error) {
      console.error('Transcript fetch error:', error);
      setError('Error loading transcript');
    } finally {
      setLoading(false);
    }
  };
  
  const regenerateSummary = async () => {
    try {
      setRegenerating(true);
      // Show loading toast
      toast.info('Generating new summary...', { autoClose: false, toastId: 'summary-toast' });
      
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/ai-settings/regenerate-summary`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fileId: id })
      });

      if (response.ok) {
        const data = await response.json();
        // Update file with new summary
        setFile(prevFile => ({
          ...prevFile,
          summary: data.summary
        }));
        toast.dismiss('summary-toast');
        toast.success('Summary regenerated successfully!');
      } else {
        toast.dismiss('summary-toast');
        toast.error('Failed to regenerate summary');
      }
    } catch (error) {
      console.error('Summary regeneration error:', error);
      toast.dismiss('summary-toast');
      toast.error('Error regenerating summary');
    } finally {
      setRegenerating(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const copyToClipboard = () => {
    if (!file || !file.transcript) return;
    
    navigator.clipboard.writeText(file.transcript)
      .then(() => {
        toast.success('Transcript copied to clipboard');
      })
      .catch((error) => {
        console.error('Failed to copy transcript:', error);
        toast.error('Failed to copy transcript');
      });
  };

  const exportTranscript = async (format) => {
    if (!file || exporting) return;
    
    setExporting(true);
    setExportDropdownOpen(false);
    
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
          toast.success(`Successfully exported to Notion!`);
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
          toast.success(`Successfully exported as ${format.toUpperCase()}!`);
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
    await exportTranscript('notion');
  };

  const downloadAsText = () => {
    if (!file || !file.transcript) return;
    
    const element = document.createElement('a');
    let fileText = `Transcript: ${file.name}\nDate: ${new Date(file.createdAt).toLocaleDateString()}\nDuration: ${formatDuration(file.duration)}\nLanguage: ${file.language || 'English'}\n\n--- FULL TRANSCRIPT ---\n\n${file.transcript}`;
    
    if (file.timestamps && file.timestamps.length > 0) {
      const timestampText = file.timestamps.map(ts => 
        `[${formatTime(ts.start)} - ${formatTime(ts.end)}] ${ts.speaker || 'Speaker'}: ${ts.text}`
      ).join('\n\n');
      fileText += `\n\n--- TIMESTAMPS ---\n\n${timestampText}`;
    }
    
    const blob = new Blob([fileText], { type: 'text/plain' });
    element.href = URL.createObjectURL(blob);
    element.download = `${file.name.replace(/\.[^/.]+$/, '')}_transcript.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(element.href);
  };

  const formatTime = (milliseconds) => {
    if (!milliseconds) return '0:00';
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
        <title>Transcript Details - Ecouter Transcribe</title>
        <meta name="description" content="View detailed transcript information" />
      </Head>

      <div className="min-h-screen bg-black text-white flex">
        <Sidebar 
          currentPage="files" 
          user={user} 
          onLogout={logout} 
          onSidebarToggle={(collapsed) => setSidebarCollapsed(collapsed)}
        />
        
        <div className={`flex-1 overflow-auto transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'lg:ml-64'}`}>
          {loading ? (
            <div className="flex justify-center items-center h-screen">
              <div className="spinner w-8 h-8"></div>
            </div>
          ) : error ? (
            <div className="p-8">
              <div className="max-w-5xl mx-auto">
                <div className="bg-white/5 rounded-xl p-8">
                  <div className="text-red-400">{error}</div>
                </div>
              </div>
            </div>
          ) : file ? (
            <>
              {/* Header */}
              <div className="border-b border-white/10 py-3 px-6 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => router.back()} 
                    className="text-white/60 hover:text-white transition-colors text-xs"
                  >
                    ← Back
                  </button>
                  <h1 className="text-sm font-medium ml-4">{file.name || 'TranscriptionStaff (11).mp3'}</h1>
                  <div className="text-white/60 text-xs ml-4">
                    Generated on {formatDate(file.createdAt || new Date()).split(',')[0]}
                  </div>
                </div>
                <div className="flex items-center">
                  <select 
                    className="bg-black border border-white/20 rounded-lg px-3 py-1 text-xs mr-2"
                    defaultValue="en"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                  <div className="relative export-dropdown">
                    <button 
                      onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                      className="py-1 px-3 border border-white/20 rounded-lg bg-black flex items-center text-xs"
                      disabled={exporting}
                    >
                      <FiDownload className="w-3 h-3 mr-1" />
                      <span>{exporting ? 'Exporting...' : 'Export'}</span>
                    </button>
                    
                    {exportDropdownOpen && (
                      <div className="absolute right-0 mt-1 w-48 bg-black border border-white/20 rounded-lg shadow-lg z-50">
                        <div className="py-1">
                          <button
                            onClick={downloadAsText}
                            className="w-full text-left px-4 py-2 text-xs hover:bg-white/10 flex items-center"
                          >
                            <FiFileText className="w-3 h-3 mr-2" />
                            Export as TXT
                          </button>
                          <button
                            onClick={() => exportTranscript('pdf')}
                            className="w-full text-left px-4 py-2 text-xs hover:bg-white/10 flex items-center"
                          >
                            <FiFileText className="w-3 h-3 mr-2" />
                            Export as PDF
                          </button>
                          <button
                            onClick={() => exportTranscript('docx')}
                            className="w-full text-left px-4 py-2 text-xs hover:bg-white/10 flex items-center"
                          >
                            <FiFileText className="w-3 h-3 mr-2" />
                            Export as DOCX
                          </button>
                          <hr className="border-white/10 my-1" />
                          <button
                            onClick={() => exportTranscript('notion')}
                            className="w-full text-left px-4 py-2 text-xs hover:bg-white/10 flex items-center"
                          >
                            <FiExternalLink className="w-3 h-3 mr-2" />
                            Export to Notion
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-white/10">
                <div className="bg-black rounded-lg p-4 border border-white/10">
                  <div className="text-white/60 mb-1 text-xs">Duration</div>
                  <div className="flex items-center">
                    <FiClock className="w-3 h-3 mr-1 text-white/60" />
                    <span className="text-sm">{formatDuration(file.duration)}</span>
                  </div>
                </div>
                <div className="bg-black rounded-lg p-4 border border-white/10">
                  <div className="text-white/60 mb-1 text-xs">Speakers</div>
                  <div className="flex items-center">
                    <FiUser className="w-3 h-3 mr-1 text-white/60" />
                    <span className="text-sm">{(file.speakers && file.speakers.length) || 2}</span>
                  </div>
                </div>
                <div className="bg-black rounded-lg p-4 border border-white/10">
                  <div className="text-white/60 mb-1 text-xs">Words</div>
                  <div className="flex items-center">
                    <FiFileText className="w-3 h-3 mr-1 text-white/60" />
                    <span className="text-sm">{file.wordCount || 60}</span>
                  </div>
                </div>
                <div className="bg-black rounded-lg p-4 border border-white/10">
                  <div className="text-white/60 mb-1 text-xs">Confidence</div>
                  <div className="flex items-center">
                    <span className="text-sm">{file.confidence || '93.4%'}</span>
                  </div>
                </div>
              </div>
              
              {/* Tab Navigation */}
              <div className="border-b border-white/10 px-6 bg-black">
                <div className="flex">
                  <button
                    className={`py-4 px-4 ${activeTab === 'full-transcript' ? 'bg-black text-white' : 'text-white/60 hover:text-white'} transition-colors`}
                    onClick={() => setActiveTab('full-transcript')}
                  >
                    Full Transcript
                  </button>
                  <button
                    className={`py-4 px-4 ${activeTab === 'ai-summary' ? 'bg-black text-white' : 'text-white/60 hover:text-white'} transition-colors`}
                    onClick={() => setActiveTab('ai-summary')}
                  >
                    AI Summary
                  </button>
                  <button
                    className={`py-4 px-4 ${activeTab === 'timestamps' ? 'bg-black text-white' : 'text-white/60 hover:text-white'} transition-colors`}
                    onClick={() => setActiveTab('timestamps')}
                  >
                    Timestamps
                  </button>
                  <button
                    className={`py-4 px-4 ${activeTab === 'file-details' ? 'bg-black text-white' : 'text-white/60 hover:text-white'} transition-colors`}
                    onClick={() => setActiveTab('file-details')}
                  >
                    File Details
                  </button>
                </div>
              </div>
              
              {/* Content Area */}
              <div className="p-6">
                {/* Transcript Tab */}
                {activeTab === 'full-transcript' && (
                  <div className="max-w-5xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                      <div className="relative flex-grow mr-4">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" />
                        <input
                          type="text"
                          placeholder="Search transcript..."
                          className="w-full bg-black border border-white/10 rounded-lg pl-10 pr-4 py-2 text-xs"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                      <button
                        onClick={copyToClipboard}
                        className="py-1 px-3 bg-black border border-white/20 rounded flex items-center text-xs"
                      >
                        <FiCopy className="w-3 h-3 mr-1" />
                        <span>Copy</span>
                      </button>
                    </div>
                    
                    <div className="bg-black border border-white/10 rounded-xl p-6 overflow-y-auto">
                      <div className="transcript text-sm">
                        {file.transcript ? (
                          <div className="whitespace-pre-wrap">
                            {file.transcript}
                          </div>
                        ) : (
                          <p className="text-white/60">No transcript available</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* AI Summary Tab */}
                {activeTab === 'ai-summary' && (
                  <div className="max-w-5xl mx-auto grid grid-cols-2 gap-6">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-base text-green-400">AI Summary</h2>
                        <div className="flex space-x-2">
                          <button
                            onClick={regenerateSummary}
                            disabled={regenerating}
                            className="py-1 px-3 bg-black border border-white/20 rounded flex items-center text-xs"
                          >
                            <FiRefreshCw className={`w-3 h-3 mr-1 ${regenerating ? 'animate-spin' : ''}`} />
                            <span>{regenerating ? 'Generating...' : 'Regenerate'}</span>
                          </button>
                          <button
                            onClick={copyToClipboard}
                            className="py-1 px-3 bg-black border border-white/20 rounded flex items-center text-xs"
                          >
                            <FiCopy className="w-3 h-3 mr-1" />
                            <span>Copy</span>
                          </button>
                        </div>
                      </div>
                      
                      <div className="bg-black rounded-xl p-4 border border-white/10">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-sm font-medium">File Summary</h3>
                          {file.summary && file.transcript && 
                            file.summary === file.transcript.substring(0, file.summary.length) && (
                            <span className="bg-amber-800/40 text-amber-300 text-xs px-2 py-0.5 rounded">
                              Low Quality
                            </span>
                          )}
                        </div>
                        {file.summary && file.summary !== 'Summary not available' && file.summary !== 'Summary generation failed' ? (
                          <p className="text-sm">
                            {file.summary}
                          </p>
                        ) : (
                          <p className="text-white/60 text-sm">
                            Summary not available. Try regenerating the summary.
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h2 className="text-base text-purple-400 mb-4">Key Insights</h2>
                      <div className="bg-black rounded-xl p-4 border border-white/10">
                        <div className="mb-2">
                          <span className="text-xs text-white/60">Topic:</span>
                          <span className="ml-2 text-sm">{file.topic || 'Not identified'}</span>
                        </div>
                        
                        <div className="mb-2">
                          <span className="text-xs text-white/60">Duration:</span>
                          <span className="ml-2 text-sm">{file.duration ? `${Math.ceil(file.duration / 60)} minutes` : 'Unknown'}</span>
                        </div>
                        
                        <div className="mb-2">
                          <span className="text-xs text-white/60">Word count:</span>
                          <span className="ml-2 text-sm">{file.wordCount || 'Unknown'}</span>
                        </div>
                        
                        {file.speakers && file.speakers.length > 0 && (
                          <div className="mb-2">
                            <span className="text-xs text-white/60">Speakers:</span>
                            <span className="ml-2 text-sm">{file.speakers.length}</span>
                          </div>
                        )}
                        
                        <button 
                          onClick={regenerateSummary} 
                          disabled={regenerating}
                          className="mt-3 py-1.5 px-3 bg-purple-600/60 hover:bg-purple-600/80 text-xs font-medium rounded flex items-center"
                        >
                          {regenerating ? (
                            <>
                              <FiRefreshCw className="w-3 h-3 mr-1.5 animate-spin" />
                              <span>Regenerating...</span>
                            </>
                          ) : (
                            <>
                              <FiRefreshCw className="w-3 h-3 mr-1.5" />
                              <span>Regenerate Summary</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Timestamps Tab */}
                {activeTab === 'timestamps' && (
                  <div className="max-w-5xl mx-auto">
                    <div className="mb-4">
                      <h2 className="text-base font-medium mb-2">Speaker Timeline</h2>
                      <p className="text-xs text-white/60">Detailed breakdown with timestamps and speaker identification</p>
                    </div>
                    
                    <div className="space-y-4">
                      {file.timestamps && file.timestamps.length > 0 ? (
                        (() => {
                          // Create speaker mapping to assign consistent labels
                          const speakerMap = {};
                          let speakerCount = 0;
                          
                          // First pass: identify unique speakers
                          file.timestamps.forEach(timestamp => {
                            const originalSpeaker = timestamp.speaker || 'Unknown';
                            if (!speakerMap[originalSpeaker]) {
                              speakerCount++;
                              speakerMap[originalSpeaker] = `Speaker ${String.fromCharCode(64 + speakerCount)}`; // A, B, C, etc.
                            }
                          });
                          
                          return file.timestamps.map((timestamp, index) => (
                            <div key={index} className="bg-black rounded-xl p-4 border border-white/10">
                              <div className="flex items-center mb-2">
                                <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center mr-4">
                                  <span className="font-medium text-sm">
                                    {speakerMap[timestamp.speaker || 'Unknown']?.split(' ')[1] || 'A'}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center mb-1">
                                    <span className="text-xs text-white/60 mr-2">
                                      {speakerMap[timestamp.speaker || 'Unknown'] || 'Speaker A'}
                                    </span>
                                  </div>
                                  <p className="text-sm">{timestamp.text}</p>
                                </div>
                              </div>
                              <div className="text-white/60 text-xs pl-12">
                                {timestamp.start ? `${Math.floor(timestamp.start / 1000 / 60)}:${Math.floor((timestamp.start / 1000) % 60).toString().padStart(2, '0')}` : '0:00'} - 
                                {timestamp.end ? `${Math.floor(timestamp.end / 1000 / 60)}:${Math.floor((timestamp.end / 1000) % 60).toString().padStart(2, '0')}` : '0:00'}
                              </div>
                            </div>
                          ));
                        })()
                      ) : (
                        <div className="bg-black rounded-xl p-4 border border-white/10">
                          <p className="text-white/60 text-sm">No timestamp data available. Enable timestamps during transcription to see detailed breakdown.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* File Details Tab */}
                {activeTab === 'file-details' && (
                  <div className="max-w-5xl mx-auto">
                    <h2 className="text-base font-medium mb-6">File Details</h2>
                    
                    <div className="bg-white/5 rounded-xl overflow-hidden">
                      <div className="border-b border-white/10">
                        <div className="grid grid-cols-2 py-4 px-6">
                          <div className="text-white/60 text-sm">File Name</div>
                          <div className="text-sm">{file.name}</div>
                        </div>
                      </div>
                      <div className="border-b border-white/10">
                        <div className="grid grid-cols-2 py-4 px-6">
                          <div className="text-white/60 text-sm">File Type</div>
                          <div className="text-sm">{file.type || 'Audio File'}</div>
                        </div>
                      </div>
                      <div className="border-b border-white/10">
                        <div className="grid grid-cols-2 py-4 px-6">
                          <div className="text-white/60 text-sm">File Size</div>
                          <div className="text-sm">{file.size ? Math.round(file.size / (1024 * 1024) * 10) / 10 + ' MB' : 'Unknown'}</div>
                        </div>
                      </div>
                      <div className="border-b border-white/10">
                        <div className="grid grid-cols-2 py-4 px-6">
                          <div className="text-white/60 text-sm">Language</div>
                          <div className="text-sm">{getLanguageName(file.language || file.settings?.language || 'en')}</div>
                        </div>
                      </div>
                      <div className="border-b border-white/10">
                        <div className="grid grid-cols-2 py-4 px-6">
                          <div className="text-white/60 text-sm">Created</div>
                          <div className="text-sm">{formatDate(file.createdAt)}</div>
                        </div>
                      </div>
                      <div>
                        <div className="grid grid-cols-2 py-4 px-6">
                          <div className="text-white/60 text-sm">Status</div>
                          <div>
                            <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded text-xs">
                              Completed
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-8">
              <div className="text-white/60">Transcript not found</div>
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
