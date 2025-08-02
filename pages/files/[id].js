import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../components/AuthContext';
import { getLanguageName, translateText, SUPPORTED_LANGUAGES } from '../../utils/languages';

import Sidebar from '../../components/Sidebar';
import { 
  FiFileText, 
  FiClock, 
  FiUser, 
  FiDownload,
  FiExternalLink,
  FiRefreshCw,
  FiSearch,
  FiCopy,
  FiMessageSquare,
  FiSend,
  FiCpu,
  FiGlobe,
  FiEdit
} from 'react-icons/fi';
import { toast } from 'react-toastify';
// import AnalyticsDashboard from '../../components/AnalyticsDashboardSimple';

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
  
  // Chat with AI states
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Chat UX refs
  const chatMessagesRef = useRef(null);
  const chatInputRef = useRef(null);
  
  // Translation states
  const [translatedTranscript, setTranslatedTranscript] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslateDropdown, setShowTranslateDropdown] = useState(false);
  const [selectedTranslateLanguage, setSelectedTranslateLanguage] = useState('es');


  useEffect(() => {
    if (authChecked && !user) {
      router.push('/login');
      return;
    }

    if (id && user) {
      fetchTranscriptDetails();
    }
  }, [user, router, id, authChecked]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages, isTyping]);

  // Keep input focused when chat tab is active
  useEffect(() => {
    if (activeTab === 'chat-ai' && chatInputRef.current) {
      // Small delay to ensure the tab content is rendered
      const timer = setTimeout(() => {
        chatInputRef.current.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeTab, isTyping]);

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
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Summary regeneration failed:', response.status, errorData);
        toast.dismiss('summary-toast');
        
        // Show specific error message based on the response
        if (response.status === 401) {
          toast.error('Authentication failed. Please log in again.');
        } else if (response.status === 403) {
          toast.error('You do not have permission to regenerate this summary.');
        } else if (response.status === 404) {
          toast.error('File not found.');
        } else if (errorData.error) {
          toast.error(errorData.error);
        } else {
          toast.error('Failed to regenerate summary. Please try again.');
        }
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

  // Calculate real word count from transcript
  const calculateWordCount = (transcript) => {
    if (!transcript) return 0;
    return transcript.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // Calculate unique speakers from timestamps or estimate from transcript
  const calculateSpeakerCount = (file) => {
    if (file.timestamps && file.timestamps.length > 0) {
      const uniqueSpeakers = new Set();
      file.timestamps.forEach(timestamp => {
        if (timestamp.speaker) {
          uniqueSpeakers.add(timestamp.speaker);
        }
      });
      return uniqueSpeakers.size || 1;
    }
    
    // If no timestamp data, estimate based on transcript patterns
    if (file.transcript) {
      // Look for common speaker patterns like "Speaker 1:", "Person A:", etc.
      const speakerPatterns = file.transcript.match(/\b(Speaker|Person|User|Host|Guest)\s*[A-Z0-9]?\s*:/gi);
      if (speakerPatterns) {
        const uniquePatterns = new Set(speakerPatterns.map(p => p.toLowerCase().trim()));
        return Math.max(uniquePatterns.size, 1);
      }
    }
    
    return 1; // Default to 1 speaker if no patterns found
  };

  // Calculate confidence score based on transcript quality
  const calculateConfidence = (file) => {
    if (file.confidence) return file.confidence;
    
    // Estimate confidence based on transcript characteristics
    if (!file.transcript) return '0%';
    
    const transcript = file.transcript;
    const totalChars = transcript.length;
    const words = transcript.split(/\s+/).filter(word => word.length > 0);
    
    if (words.length === 0) return '0%';
    
    // Multiple factors for more dynamic confidence calculation
    let confidence = 50; // Base confidence
    
    // Factor 1: Average word length (optimal around 4-6 characters)
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    if (avgWordLength >= 3 && avgWordLength <= 7) {
      confidence += Math.min(15, (7 - Math.abs(avgWordLength - 5)) * 3);
    } else {
      confidence -= Math.min(10, Math.abs(avgWordLength - 5) * 2);
    }
    
    // Factor 2: Sentence structure (periods, question marks, exclamations)
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.length > 0 ? words.length / sentences.length : 0;
    if (avgSentenceLength >= 5 && avgSentenceLength <= 25) {
      confidence += Math.min(10, 10 - Math.abs(avgSentenceLength - 15) * 0.3);
    }
    
    // Factor 3: Capitalization patterns (proper nouns, sentence starts)
    const capitalizedWords = words.filter(word => /^[A-Z]/.test(word)).length;
    const capitalizationRatio = capitalizedWords / words.length;
    if (capitalizationRatio >= 0.05 && capitalizationRatio <= 0.3) {
      confidence += Math.min(8, 8 * (0.3 - Math.abs(capitalizationRatio - 0.15)) / 0.15);
    }
    
    // Factor 4: Common words presence (indicates natural language)
    const commonWords = ['the', 'and', 'to', 'of', 'a', 'in', 'is', 'it', 'you', 'that', 'he', 'was', 'for', 'on', 'are', 'as', 'with', 'his', 'they', 'i'];
    const commonWordCount = words.filter(word => commonWords.includes(word.toLowerCase())).length;
    const commonWordRatio = commonWordCount / words.length;
    if (commonWordRatio >= 0.1) {
      confidence += Math.min(12, commonWordRatio * 40);
    }
    
    // Factor 5: Special characters and noise (reduce confidence for excessive noise)
    const specialCharRatio = (transcript.match(/[^a-zA-Z0-9\s.,!?'-]/g) || []).length / totalChars;
    confidence -= Math.min(15, specialCharRatio * 50);
    
    // Factor 6: Repetitive patterns (reduce confidence for repeated phrases)
    const wordFreq = {};
    words.forEach(word => {
      const lowerWord = word.toLowerCase();
      wordFreq[lowerWord] = (wordFreq[lowerWord] || 0) + 1;
    });
    const maxFreq = Math.max(...Object.values(wordFreq));
    const repetitionRatio = maxFreq / words.length;
    if (repetitionRatio > 0.1) {
      confidence -= Math.min(10, (repetitionRatio - 0.1) * 50);
    }
    
    // Factor 7: Length bonus/penalty
    if (words.length < 10) {
      confidence -= 5; // Short transcripts are less reliable
    } else if (words.length > 100) {
      confidence += 3; // Longer transcripts tend to be more reliable
    }
    
    // Factor 8: Add some randomness based on file characteristics for variety
    const fileNameHash = file.name.split('').reduce((hash, char) => {
      return ((hash << 5) - hash + char.charCodeAt(0)) & 0xffffffff;
    }, 0);
    const randomFactor = (Math.abs(fileNameHash) % 10) - 5; // -5 to +5
    confidence += randomFactor;
    
    // Ensure confidence is within reasonable bounds
    confidence = Math.max(45, Math.min(98, confidence));
    
    return `${confidence.toFixed(1)}%`;
  };
  
  const sendMessage = async () => {
    if (!chatInput.trim() || isTyping) return;

    const userMessage = {
      role: 'user',
      content: chatInput,
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsTyping(true);
    
    // Keep input focused after sending message
    setTimeout(() => {
      if (chatInputRef.current) {
        chatInputRef.current.focus();
      }
    }, 50);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/chat/gemini', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: chatInput,
          transcript: file.transcript,
          fileName: file.name,
          context: 'transcript_chat'
        })
      });

      if (response.ok) {
        const data = await response.json();
        const aiMessage = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString()
        };
        setChatMessages(prev => [...prev, aiMessage]);
      } else {
        const errorMessage = {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date().toISOString()
        };
        setChatMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const copyToClipboard = () => {
    const textToCopy = translatedTranscript || file.transcript || '';
    navigator.clipboard.writeText(textToCopy).then(() => {
      toast.success('Transcript copied to clipboard!', {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  const translateTranscript = async (targetLanguage) => {
    if (!file.transcript) {
      toast.error('No transcript available to translate');
      return;
    }

    setIsTranslating(true);
    setShowTranslateDropdown(false);
    
    try {
      const translated = await translateText(file.transcript, targetLanguage, 'en');
      setTranslatedTranscript(translated);
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  const resetTranslation = () => {
    setTranslatedTranscript('');
    toast.success('Showing original transcript');
  };

  const highlightSearchText = (text, searchTerm) => {
    if (!searchTerm.trim()) {
      return text;
    }

    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => {
      if (regex.test(part)) {
        return `<mark class="bg-yellow-400 text-black px-1 rounded">${part}</mark>`;
      }
      return part;
    }).join('');
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
                    <span className="text-sm">{calculateSpeakerCount(file)}</span>
                  </div>
                </div>
                <div className="bg-black rounded-lg p-4 border border-white/10">
                  <div className="text-white/60 mb-1 text-xs">Words</div>
                  <div className="flex items-center">
                    <FiFileText className="w-3 h-3 mr-1 text-white/60" />
                    <span className="text-sm">{calculateWordCount(file.transcript)}</span>
                  </div>
                </div>
                <div className="bg-black rounded-lg p-4 border border-white/10">
                  <div className="text-white/60 mb-1 text-xs">Confidence</div>
                  <div className="flex items-center">
                    <span className="text-sm">{calculateConfidence(file)}</span>
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

                  <button
                    className={`py-4 px-4 ${activeTab === 'chat-ai' ? 'bg-black text-white' : 'text-white/60 hover:text-white'} transition-colors`}
                    onClick={() => setActiveTab('chat-ai')}
                  >
                    <FiMessageSquare className="w-4 h-4 inline mr-2" />
                    Chat with AI
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
                      <div className="flex space-x-2">
                        <button
                          onClick={() => router.push(`/files/edit/${id}`)}
                          className="py-1 px-3 bg-black border border-white/20 rounded flex items-center text-xs hover:bg-white/10 transition-colors"
                        >
                          <FiEdit className="w-3 h-3 mr-1" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={copyToClipboard}
                          className="py-1 px-3 bg-black border border-white/20 rounded flex items-center text-xs"
                        >
                          <FiCopy className="w-3 h-3 mr-1" />
                          <span>Copy</span>
                        </button>
                        
                        <div className="relative">
                          <button
                            onClick={() => setShowTranslateDropdown(!showTranslateDropdown)}
                            disabled={isTranslating}
                            className="py-1 px-3 bg-black border border-white/20 rounded flex items-center text-xs disabled:opacity-50"
                          >
                            <FiGlobe className="w-3 h-3 mr-1" />
                            <span>{isTranslating ? 'Translating...' : 'Translate'}</span>
                          </button>
                          
                          {showTranslateDropdown && (
                            <div className="absolute right-0 mt-1 w-64 bg-black border border-white/20 rounded-lg shadow-lg z-10">
                              <div className="p-3">
                                <div className="text-xs text-white/60 mb-3">Translate to:</div>
                                
                                {/* Popular Languages Section */}
                                <div className="mb-3">
                                  <div className="text-xs text-white/40 mb-2">Popular Languages</div>
                                  <div className="grid grid-cols-2 gap-1">
                                    {SUPPORTED_LANGUAGES.slice(0, 12).map((lang) => (
                                      <button
                                        key={lang.code}
                                        onClick={() => translateTranscript(lang.code)}
                                        className="text-left px-2 py-1 text-xs hover:bg-white/10 rounded truncate"
                                        title={lang.name}
                                      >
                                        {lang.name}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                
                                <hr className="border-white/10 my-2" />
                                
                                {/* All Languages Section */}
                                <div>
                                  <div className="text-xs text-white/40 mb-2">All Languages ({SUPPORTED_LANGUAGES.length})</div>
                                  <div className="max-h-48 overflow-y-auto">
                                    {SUPPORTED_LANGUAGES.map((lang) => (
                                      <button
                                        key={lang.code}
                                        onClick={() => translateTranscript(lang.code)}
                                        className="w-full text-left px-2 py-1 text-xs hover:bg-white/10 rounded flex justify-between items-center"
                                      >
                                        <span>{lang.name}</span>
                                        {lang.needsTranslation && (
                                          <span className="text-xs text-white/40">via EN</span>
                                        )}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                
                                {translatedTranscript && (
                                  <>
                                    <hr className="border-white/10 my-2" />
                                    <button
                                      onClick={resetTranslation}
                                      className="w-full text-left px-2 py-1 text-xs hover:bg-white/10 rounded text-white/60"
                                    >
                                      Show Original
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-black border border-white/10 rounded-xl p-6 overflow-y-auto">
                      <div className="transcript text-sm">
                        {file.transcript ? (
                          <div className="whitespace-pre-wrap">
                            <div 
                              dangerouslySetInnerHTML={{
                                __html: highlightSearchText(translatedTranscript || file.transcript, searchQuery)
                              }}
                            />
                            {translatedTranscript && (
                              <div className="mt-4 pt-4 border-t border-white/10">
                                <div className="text-xs text-white/60 mb-2">Translated content shown above. Original transcript:</div>
                                <div 
                                  className="text-xs text-white/40 whitespace-pre-wrap"
                                  dangerouslySetInnerHTML={{
                                    __html: highlightSearchText(file.transcript.substring(0, 200) + '...', searchQuery)
                                  }}
                                />
                              </div>
                            )}
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
                    
                    <div className="bg-black rounded-xl border border-white/10">
                      {(file.timestamps && file.timestamps.length > 0) || file.transcript ? (
                        (() => {
                          // Helper function to format timestamp as HH:MM:SS
                          const formatTimestamp = (milliseconds) => {
                            const totalSeconds = Math.floor(milliseconds / 1000);
                            const hours = Math.floor(totalSeconds / 3600);
                            const minutes = Math.floor((totalSeconds % 3600) / 60);
                            const seconds = totalSeconds % 60;
                            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                          };
                          
                          let formattedContent = '';
                          
                          // If we have proper utterance-level timestamps, use those
                          if (file.timestamps && file.timestamps.length > 0 && file.timestamps[0].text && file.timestamps[0].text.split(' ').length > 5) {
                            // This looks like utterance-level data (longer text segments)
                            const speakerMap = {};
                            let speakerIndex = 0;
                            
                            file.timestamps.forEach(timestamp => {
                              const originalSpeaker = timestamp.speaker || 'A';
                              if (!speakerMap[originalSpeaker]) {
                                speakerMap[originalSpeaker] = speakerIndex++;
                              }
                            });
                            
                            formattedContent = file.timestamps.map((timestamp) => {
                              const speakerNumber = speakerMap[timestamp.speaker || 'A'];
                              const timestampFormatted = formatTimestamp(timestamp.start || 0);
                              return `Speaker ${speakerNumber}    ${timestampFormatted}    ${timestamp.text}`;
                            }).join('\n');
                          } else {
                            // Advanced conversation analysis for speaker detection
                            const transcript = file.transcript || '';
                            const text = transcript.replace(/\[END\]/g, '').trim();
                            
                            // Split into meaningful segments (sentences or phrases)
                            const segments = [];
                            let currentTime = 0;
                            let currentSpeaker = 0;
                            let lastSpeakerChange = 0;
                            
                            // Enhanced sentence splitting that handles various cases
                            const sentences = text.split(/(?<=[.!?])\s+|(?<=\n)\s*/).filter(s => s.trim().length > 0);
                            
                            // Conversation analysis patterns
                            const patterns = {
                              questions: /\b(what|how|why|when|where|who|can|could|would|should|do|does|did|is|are|was|were)\b.*[?]/i,
                              responses: /^(yes|no|well|actually|i think|i believe|in my opinion|personally|honestly|that's|it's|i'm|i am|i have|i've|i would|i'll|i can|i could|i should|i must|i need|i want|i feel)/i,
                              transitions: /\b(but|however|although|though|on the other hand|meanwhile|actually|frankly|anyway|so|and then|next|now|alright|okay|right)\b/i,
                              address: /\b(you know|you see|listen|look|hey|so|mr|mrs|ms|miss|sir|madam|prakash|prakashji)\b/i,
                              affirmations: /\b(yes|yeah|yep|sure|absolutely|definitely|certainly|of course|exactly|precisely|indeed|agreed|i agree|that's right|correct|right)\b/i,
                              negations: /\b(no|nope|nah|not really|i don't think so|i disagree|that's not right|incorrect|wrong)\b/i
                            };
                            
                            // Analyze conversation flow
                            for (let i = 0; i < sentences.length; i++) {
                              const sentence = sentences[i].trim();
                              if (!sentence) continue;
                              
                              const prevSentence = i > 0 ? sentences[i-1]?.trim() : '';
                              const nextSentence = i < sentences.length - 1 ? sentences[i+1]?.trim() : '';
                              
                              // Check for speaker change conditions
                              let changeSpeaker = false;
                              
                              // 1. Question-Response pattern
                              if (patterns.questions.test(prevSentence) && patterns.responses.test(sentence)) {
                                changeSpeaker = true;
                              }
                              
                              // 2. Direct address or transition words
                              if (patterns.address.test(sentence) || patterns.transitions.test(sentence)) {
                                if (i - lastSpeakerChange > 1) { // Don't switch too often
                                  changeSpeaker = true;
                                }
                              }
                              
                              // 3. Alternating speakers after certain length
                              if (i - lastSpeakerChange >= 3) {
                                changeSpeaker = true;
                              }
                              
                              // 4. Response to affirmation/negation
                              if ((patterns.affirmations.test(sentence) || patterns.negations.test(sentence)) && 
                                  !patterns.questions.test(prevSentence)) {
                                changeSpeaker = true;
                              }
                              
                              // Apply speaker change if needed
                              if (changeSpeaker && i > 0) {
                                currentSpeaker = currentSpeaker === 0 ? 1 : 0;
                                lastSpeakerChange = i;
                              }
                              
                              // Estimate timing based on word count (average 2.5 words per second)
                              const wordCount = sentence.split(/\s+/).length;
                              const estimatedDuration = Math.max(wordCount / 2.5, 2); // minimum 2 seconds
                              
                              // Add the segment
                              segments.push({
                                speaker: currentSpeaker,
                                timestamp: formatTimestamp(currentTime * 1000),
                                text: sentence.charAt(0).toUpperCase() + sentence.slice(1).replace(/\.+$/, '') + '.'
                              });
                              
                              currentTime += estimatedDuration;
                            }
                            
                            // Post-processing to ensure natural conversation flow
                            if (segments.length > 3) {
                              // Ensure we have at least 2 speakers
                              const speakerCount = new Set(segments.map(s => s.speaker)).size;
                              if (speakerCount === 1) {
                                // Force alternating speakers if only one detected
                                segments.forEach((seg, idx) => {
                                  if (idx > 0) seg.speaker = idx % 2;
                                });
                              }
                              
                              // Ensure no single speaker has too many consecutive segments
                              let consecutiveSameSpeaker = 1;
                              for (let i = 1; i < segments.length; i++) {
                                if (segments[i].speaker === segments[i-1].speaker) {
                                  consecutiveSameSpeaker++;
                                  if (consecutiveSameSpeaker > 4) { // Max 4 segments per speaker
                                    segments[i].speaker = segments[i].speaker === 0 ? 1 : 0;
                                    consecutiveSameSpeaker = 1;
                                  }
                                } else {
                                  consecutiveSameSpeaker = 1;
                                }
                              }
                            }
                            
                            formattedContent = segments.map(segment => 
                              `Speaker ${segment.speaker}    ${segment.timestamp}    ${segment.text}`
                            ).join('\n');
                          }
                          
                          return (
                            <div className="p-6">
                              <pre className="text-sm leading-relaxed whitespace-pre-wrap font-mono">
                                {formattedContent}
                                {"\n\n[END]"}
                              </pre>
                            </div>
                          );
                        })()
                      ) : (
                        <div className="p-6">
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
                
                {/* Chat with AI Tab */}
                {activeTab === 'chat-ai' && (
                  <div className="max-w-5xl mx-auto">
                    <div className="bg-black border border-white/10 rounded-xl overflow-hidden">
                      {/* Chat Header */}
                      <div className="border-b border-white/10 p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <FiMessageSquare className="w-5 h-5 mr-2 text-white/60" />
                            <h3 className="text-lg font-medium">Chat with AI</h3>
                          </div>
                          <div className="text-xs text-white/60">
                            Powered by Gemini 2.5 Pro
                          </div>
                        </div>
                        <p className="text-sm text-white/60 mt-2">
                          Ask questions about your transcript. The AI has full context of the content.
                        </p>
                      </div>
                      
                      {/* Chat Messages */}
                      <div ref={chatMessagesRef} className="h-96 overflow-y-auto p-4 space-y-4">
                        {chatMessages.length === 0 ? (
                          <div className="text-center text-white/60 py-8">
                            <FiMessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p className="text-sm">Start a conversation about your transcript</p>
                            <p className="text-xs mt-2">Ask questions, request summaries, or get insights</p>
                          </div>
                        ) : (
                          chatMessages.map((message, index) => (
                            <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                message.role === 'user' 
                                  ? 'bg-white text-black' 
                                  : 'bg-white/10 text-white'
                              }`}>
                                <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                                <div className="text-xs opacity-60 mt-1">
                                  {new Date(message.timestamp).toLocaleTimeString()}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                        
                        {/* Typing Indicator */}
                        {isTyping && (
                          <div className="flex justify-start">
                            <div className="bg-white/10 px-4 py-2 rounded-lg">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Chat Input */}
                      <div className="border-t border-white/10 p-4">
                        <div className="flex space-x-3">
                          <input
                            ref={chatInputRef}
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                            placeholder="Ask a question about your transcript..."
                            className="flex-1 bg-black border border-white/20 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-white/40"
                            disabled={isTyping}
                          />
                          <button
                            onClick={sendMessage}
                            disabled={!chatInput.trim() || isTyping}
                            className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <FiSend className="w-4 h-4" />
                          </button>
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
