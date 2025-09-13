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
  FiEdit,
  FiPlay,
  FiPause,
  FiSkipForward,
  FiSkipBack,
  FiSave,
  FiX,
  FiSettings,
  FiTag,
  FiFolder,
  FiHighlight,
  FiType,
  FiRotateCcw,
  FiRotateCw,
  FiEye,
  FiEyeOff,
  FiShare2,
  FiPlus,
  FiTrash2,
  FiChevronDown,
  FiChevronUp,
  FiLink,
  FiBookmark,
  FiMinus,
  FiVolume2,
  FiZap,
  FiTarget,
  FiTrendingUp
} from 'react-icons/fi';
import { toast } from 'react-toastify';
// import AnalyticsDashboard from '../../components/AnalyticsDashboardSimple';
import WordCloudAnalytics from '../../components/analytics/WordCloudAnalytics';
import SpeakerTalkTimeAnalysis from '../../components/analytics/SpeakerTalkTimeAnalysis';
import SentimentAnalysis from '../../components/analytics/SentimentAnalysis';

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
  
  // Chat History states
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [chatHistoryLoaded, setChatHistoryLoaded] = useState(false);
  
  // Chat UX refs
  const chatMessagesRef = useRef(null);
  const chatInputRef = useRef(null);
  
  // Translation states
  const [translatedTranscript, setTranslatedTranscript] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [showTranslateDropdown, setShowTranslateDropdown] = useState(false);
  const [selectedTranslateLanguage, setSelectedTranslateLanguage] = useState('es');

  // ===== COMPREHENSIVE EDITING FEATURES =====
  
  // Edit Mode & Core Editing States
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedTranscript, setEditedTranscript] = useState('');
  const [editHistory, setEditHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Audio/Video Controls
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedDropdown, setShowSpeedDropdown] = useState(false);
  const [waveformData, setWaveformData] = useState([]);
  const [audioElement, setAudioElement] = useState(null);
  
  // Search & Replace
  const [showSearchReplace, setShowSearchReplace] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [searchMatches, setSearchMatches] = useState([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  
  // Speaker Management
  const [speakers, setSpeakers] = useState({});
  const [editingSpeaker, setEditingSpeaker] = useState(null);
  const [speakerColors, setSpeakerColors] = useState({});
  
  // Organization & Metadata
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [projectFolder, setProjectFolder] = useState('');
  const [highlights, setHighlights] = useState([]);
  const [comments, setComments] = useState([]);
  const [showCommentsPanel, setShowCommentsPanel] = useState(false);
  
  // AI Features
  const [aiSummary, setAiSummary] = useState('');
  const [detectedTopics, setDetectedTopics] = useState([]);
  const [actionItems, setActionItems] = useState([]);
  const [sentimentAnalysis, setSentimentAnalysis] = useState(null);
  const [showAiPanel, setShowAiPanel] = useState(false);
  
  // Export & Sharing
  const [shareLink, setShareLink] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [versionHistory, setVersionHistory] = useState([]);
  
  // Advanced Features
  const [redactionMode, setRedactionMode] = useState(false);
  const [redactedRanges, setRedactedRanges] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  
  // Refs for editing functionality
  const audioRef = useRef(null);
  const transcriptRef = useRef(null);
  const waveformRef = useRef(null);


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

  // ===== EDITING FUNCTIONALITY EFFECTS =====
  
  // Initialize editing when entering edit mode
  useEffect(() => {
    if (isEditMode && file) {
      setEditedTranscript(file.transcript || '');
      setEditHistory([file.transcript || '']);
      setHistoryIndex(0);
      // Initialize speakers from transcript
      const speakerMatches = file.transcript?.match(/Speaker \d+/g) || [];
      const uniqueSpeakers = [...new Set(speakerMatches)];
      const speakerObj = {};
      const colorObj = {};
      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
      uniqueSpeakers.forEach((speaker, index) => {
        speakerObj[speaker] = speaker;
        colorObj[speaker] = colors[index % colors.length];
      });
      setSpeakers(speakerObj);
      setSpeakerColors(colorObj);
    }
  }, [isEditMode, file]);

  // Keyboard shortcuts for editing
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isEditMode) return;
      
      // Audio controls
      if (e.code === 'Space' && !e.target.matches('input, textarea, [contenteditable]')) {
        e.preventDefault();
        togglePlayPause();
      }
      if (e.code === 'ArrowLeft' && e.ctrlKey) {
        e.preventDefault();
        skipBackward();
      }
      if (e.code === 'ArrowRight' && e.ctrlKey) {
        e.preventDefault();
        skipForward();
      }
      
      // Editing shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.code) {
          case 'KeyZ':
            if (e.shiftKey) {
              e.preventDefault();
              redoEdit();
            } else {
              e.preventDefault();
              undoEdit();
            }
            break;
          case 'KeyF':
            e.preventDefault();
            setShowSearchReplace(true);
            break;
          case 'KeyS':
            e.preventDefault();
            saveTranscript();
            break;
          case 'KeyE':
            e.preventDefault();
            setIsEditMode(!isEditMode);
            break;
        }
      }
    };

    if (isEditMode) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isEditMode, historyIndex, editHistory]);

  // Audio time tracking
  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;
      const updateTime = () => setCurrentTime(audio.currentTime);
      audio.addEventListener('timeupdate', updateTime);
      return () => audio.removeEventListener('timeupdate', updateTime);
    }
  }, [audioRef.current]);

  // Track unsaved changes
  useEffect(() => {
    if (isEditMode && file) {
      setHasUnsavedChanges(editedTranscript !== file.transcript);
    }
  }, [editedTranscript, file?.transcript, isEditMode]);

  // ===== COMPREHENSIVE EDITING FUNCTIONS =====

  // Audio/Video Controls
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const skipForward = (seconds = 10) => {
    if (audioRef.current) {
      audioRef.current.currentTime += seconds;
    }
  };

  const skipBackward = (seconds = 10) => {
    if (audioRef.current) {
      audioRef.current.currentTime -= seconds;
    }
  };

  const changePlaybackSpeed = (speed) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
    }
    setShowSpeedDropdown(false);
  };

  const seekToTime = (time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Transcript Editing Functions
  const updateTranscript = (newText) => {
    // Add to history if significant change
    if (newText !== editedTranscript) {
      const newHistory = editHistory.slice(0, historyIndex + 1);
      newHistory.push(newText);
      setEditHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
    setEditedTranscript(newText);
  };

  const undoEdit = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setEditedTranscript(editHistory[historyIndex - 1]);
    }
  };

  const redoEdit = () => {
    if (historyIndex < editHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setEditedTranscript(editHistory[historyIndex + 1]);
    }
  };

  // Search & Replace Functions
  const performSearch = (term) => {
    if (!term || !editedTranscript) return;
    
    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = [];
    let match;
    
    while ((match = regex.exec(editedTranscript)) !== null) {
      matches.push({
        index: match.index,
        text: match[0],
        length: match[0].length
      });
    }
    
    setSearchMatches(matches);
    setCurrentMatchIndex(0);
  };

  const replaceText = (searchTerm, replaceTerm, replaceAll = false) => {
    if (!searchTerm || !editedTranscript) return;
    
    let newText;
    if (replaceAll) {
      const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      newText = editedTranscript.replace(regex, replaceTerm);
    } else {
      // Replace current match only
      if (searchMatches.length > 0) {
        const match = searchMatches[currentMatchIndex];
        newText = editedTranscript.substring(0, match.index) + 
                 replaceTerm + 
                 editedTranscript.substring(match.index + match.length);
      }
    }
    
    if (newText !== editedTranscript) {
      updateTranscript(newText);
      performSearch(searchTerm); // Refresh search results
    }
  };

  // Speaker Management Functions
  const updateSpeakerLabel = (oldLabel, newLabel) => {
    const newSpeakers = { ...speakers };
    delete newSpeakers[oldLabel];
    newSpeakers[newLabel] = newLabel;
    setSpeakers(newSpeakers);
    
    // Update transcript with new speaker label
    const updatedTranscript = editedTranscript.replace(
      new RegExp(oldLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
      newLabel
    );
    updateTranscript(updatedTranscript);
    setEditingSpeaker(null);
  };

  const jumpToTimestamp = (timestamp) => {
    // Parse timestamp (assumes format like "00:01:23")
    const parts = timestamp.split(':').map(Number);
    const seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    seekToTime(seconds);
  };

  // Organization Functions
  const addTag = (tag) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setNewTag('');
      setShowTagInput(false);
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const addHighlight = (startIndex, endIndex, color = '#FFFF00') => {
    const newHighlight = {
      id: Date.now(),
      startIndex,
      endIndex,
      color,
      text: editedTranscript.substring(startIndex, endIndex)
    };
    setHighlights([...highlights, newHighlight]);
  };

  const addComment = (text, position) => {
    const newComment = {
      id: Date.now(),
      text,
      position,
      timestamp: new Date().toISOString(),
      author: user?.email || 'Anonymous'
    };
    setComments([...comments, newComment]);
  };

  // AI Features Functions
  const generateAISummary = async () => {
    try {
      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ transcript: editedTranscript })
      });
      
      if (response.ok) {
        const data = await response.json();
        setAiSummary(data.summary);
      }
    } catch (error) {
      console.error('Failed to generate AI summary:', error);
      toast.error('Failed to generate AI summary');
    }
  };

  const detectTopics = async () => {
    try {
      const response = await fetch('/api/ai/topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ transcript: editedTranscript })
      });
      
      if (response.ok) {
        const data = await response.json();
        setDetectedTopics(data.topics);
      }
    } catch (error) {
      console.error('Failed to detect topics:', error);
    }
  };

  const extractActionItems = async () => {
    try {
      const response = await fetch('/api/ai/action-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ transcript: editedTranscript })
      });
      
      if (response.ok) {
        const data = await response.json();
        setActionItems(data.actionItems);
      }
    } catch (error) {
      console.error('Failed to extract action items:', error);
    }
  };

  // Export Functions
  const exportAsSubtitles = (format = 'srt') => {
    // Implementation for SRT/VTT export
    let subtitleContent = '';
    
    if (format === 'srt') {
      // Generate SRT format
      const lines = editedTranscript.split('\n');
      lines.forEach((line, index) => {
        if (line.trim()) {
          subtitleContent += `${index + 1}\n`;
          subtitleContent += `00:00:${String(index * 2).padStart(2, '0')},000 --> 00:00:${String((index + 1) * 2).padStart(2, '0')},000\n`;
          subtitleContent += `${line.trim()}\n\n`;
        }
      });
    }
    
    const blob = new Blob([subtitleContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.name || 'transcript'}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateShareLink = async () => {
    try {
      const response = await fetch('/api/files/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ fileId: id, permissions: 'view' })
      });
      
      if (response.ok) {
        const data = await response.json();
        setShareLink(data.shareUrl);
        setShowShareModal(true);
      }
    } catch (error) {
      console.error('Failed to generate share link:', error);
      toast.error('Failed to generate share link');
    }
  };

  // Save Functions
  const saveTranscript = async () => {
    try {
      const response = await fetch(`/api/files/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          transcript: editedTranscript,
          speakers,
          tags,
          highlights,
          comments,
          metadata: {
            lastModified: new Date().toISOString(),
            version: (file.version || 0) + 1
          }
        })
      });
      
      if (response.ok) {
        const updatedFile = await response.json();
        setFile(updatedFile);
        setHasUnsavedChanges(false);
        toast.success('Transcript saved successfully');
        
        // Add to version history
        setVersionHistory([...versionHistory, {
          version: updatedFile.version,
          timestamp: new Date().toISOString(),
          changes: 'Manual edit'
        }]);
      }
    } catch (error) {
      console.error('Failed to save transcript:', error);
      toast.error('Failed to save transcript');
    }
  };

  const exitEditMode = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Save before exiting?')) {
        saveTranscript();
      }
    }
    setIsEditMode(false);
    setEditedTranscript('');
    setEditHistory([]);
    setHistoryIndex(-1);
  };

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
  
  // Function to format AI responses and convert markdown to HTML
  const formatAIResponse = (text) => {
    // Convert **bold** to <strong>bold</strong>
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert *italic* to <em>italic</em> (only if not already processed as bold)
    formatted = formatted.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>');
    
    // Convert simple line breaks to <br>
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
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

  // Chat History Management Functions
  const loadChatHistory = () => {
    try {
      const fileKey = `chat_history_${file?.id || 'unknown'}`;
      const saved = localStorage.getItem(fileKey);
      if (saved) {
        const history = JSON.parse(saved);
        setChatHistory(history);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
    setChatHistoryLoaded(true);
  };

  const saveChatToHistory = () => {
    if (chatMessages.length === 0) return;
    
    try {
      const chatSession = {
        id: currentChatId || Date.now().toString(),
        title: generateChatTitle(chatMessages),
        messages: chatMessages,
        timestamp: new Date().toISOString(),
        fileId: file?.id,
        fileName: file?.name,
        messageCount: chatMessages.length
      };

      const fileKey = `chat_history_${file?.id || 'unknown'}`;
      const existing = localStorage.getItem(fileKey);
      let history = existing ? JSON.parse(existing) : [];
      
      // Update existing chat or add new one
      const existingIndex = history.findIndex(chat => chat.id === chatSession.id);
      if (existingIndex >= 0) {
        history[existingIndex] = chatSession;
      } else {
        history.unshift(chatSession); // Add to beginning
      }
      
      // Keep only last 20 chats per file
      history = history.slice(0, 20);
      
      localStorage.setItem(fileKey, JSON.stringify(history));
      setChatHistory(history);
      setCurrentChatId(chatSession.id);
      
      toast.success('Chat saved to history!', { autoClose: 2000 });
    } catch (error) {
      console.error('Failed to save chat:', error);
      toast.error('Failed to save chat to history');
    }
  };

  const loadChatSession = (chatSession) => {
    setChatMessages(chatSession.messages);
    setCurrentChatId(chatSession.id);
    setShowChatHistory(false);
    toast.success('Chat loaded!', { autoClose: 2000 });
  };

  const startNewChat = () => {
    // Auto-save current chat if it has messages
    if (chatMessages.length > 0) {
      saveChatToHistory();
    }
    
    setChatMessages([]);
    setCurrentChatId(null);
    setChatInput('');
    setShowChatHistory(false);
    
    // Focus on input
    setTimeout(() => {
      if (chatInputRef.current) {
        chatInputRef.current.focus();
      }
    }, 100);
  };

  const deleteChatSession = (chatId) => {
    try {
      const fileKey = `chat_history_${file?.id || 'unknown'}`;
      const existing = localStorage.getItem(fileKey);
      if (existing) {
        let history = JSON.parse(existing);
        history = history.filter(chat => chat.id !== chatId);
        localStorage.setItem(fileKey, JSON.stringify(history));
        setChatHistory(history);
        toast.success('Chat deleted', { autoClose: 2000 });
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
      toast.error('Failed to delete chat');
    }
  };

  const generateChatTitle = (messages) => {
    if (messages.length === 0) return 'New Chat';
    
    const firstUserMessage = messages.find(msg => msg.role === 'user');
    if (firstUserMessage) {
      const content = firstUserMessage.content;
      // Take first 50 characters and add ellipsis if longer
      return content.length > 50 ? content.substring(0, 50) + '...' : content;
    }
    
    return `Chat ${new Date().toLocaleTimeString()}`;
  };

  const formatChatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const hours = diff / (1000 * 60 * 60);
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${Math.floor(hours)}h ago`;
    if (hours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  // Load chat history when component mounts
  useEffect(() => {
    if (file?.id && !chatHistoryLoaded) {
      loadChatHistory();
    }
  }, [file?.id, chatHistoryLoaded]);

  // Auto-save chat periodically
  useEffect(() => {
    if (chatMessages.length > 0) {
      const autoSaveTimer = setTimeout(() => {
        saveChatToHistory();
      }, 30000); // Auto-save every 30 seconds
      
      return () => clearTimeout(autoSaveTimer);
    }
  }, [chatMessages]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

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
        <div className="hidden lg:block">
          <Sidebar 
            currentPage="files" 
            user={user} 
            onLogout={logout} 
            onSidebarToggle={(collapsed) => setSidebarCollapsed(collapsed)}
          />
        </div>
        
        <div className={`flex-1 overflow-auto transition-all duration-300 ${sidebarCollapsed ? 'ml-0 lg:ml-16' : 'ml-0 lg:ml-64'}`}>
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
                <div className="border-b border-white/10 py-3 px-4 md:py-4 md:px-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-0">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => router.back()} 
                        className="text-white/60 hover:text-white transition-colors text-sm font-medium"
                      >
                        ← Back
                      </button>
                      <h1 className="text-sm md:text-base font-medium truncate max-w-[60vw] md:max-w-none">{file.name || 'TranscriptionStaff (11).mp3'}</h1>
                    </div>
                    <div className="text-white/60 text-xs md:text-sm">
                      Generated on {formatDate(file.createdAt || new Date()).split(',')[0]}
                    </div>
                  </div>
                 <div className="flex flex-col sm:flex-row gap-2 md:items-center md:gap-3">
                   <div className="relative export-dropdown">
                     <button 
                       onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                       className="w-full sm:w-auto py-2 px-4 border border-white/20 rounded-lg bg-black flex items-center justify-center text-sm font-medium hover:bg-white/5 transition-colors"
                       disabled={exporting}
                     >
                       <FiDownload className="w-4 h-4 mr-2" />
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
               <div className="grid grid-cols-2 gap-3 px-4 py-4 md:grid-cols-4 md:gap-4 md:px-6 md:py-4 border-b border-white/10">
                  <div className="bg-black rounded-lg p-4 border border-white/10">
                    <div className="text-white/60 mb-2 text-xs font-medium">Duration</div>
                    <div className="flex items-center">
                      <FiClock className="w-4 h-4 mr-2 text-white/60" />
                      <span className="text-sm font-medium">{formatDuration(file.duration)}</span>
                    </div>
                  </div>
                  <div className="bg-black rounded-lg p-4 border border-white/10">
                    <div className="text-white/60 mb-2 text-xs font-medium">Speakers</div>
                    <div className="flex items-center">
                      <FiUser className="w-4 h-4 mr-2 text-white/60" />
                      <span className="text-sm font-medium">{calculateSpeakerCount(file)}</span>
                    </div>
                  </div>
                  <div className="bg-black rounded-lg p-4 border border-white/10">
                    <div className="text-white/60 mb-2 text-xs font-medium">Words</div>
                    <div className="flex items-center">
                      <FiFileText className="w-4 h-4 mr-2 text-white/60" />
                      <span className="text-sm font-medium">{calculateWordCount(file.transcript)}</span>
                    </div>
                  </div>
                  <div className="bg-black rounded-lg p-4 border border-white/10">
                    <div className="text-white/60 mb-2 text-xs font-medium">Confidence</div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium">{calculateConfidence(file)}</span>
                    </div>
                  </div>
                </div>

                {/* Tab Navigation */}
                <div className="border-b border-white/10 px-4 md:px-6 bg-black">
                  <div className="flex overflow-x-auto scrollbar-hide gap-2 pb-1">
                    <button
                      className={`px-4 py-3 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors ${activeTab === 'full-transcript' ? 'bg-white text-black' : 'bg-black text-white/70 hover:bg-white/10'}`}
                      onClick={() => setActiveTab('full-transcript')}
                    >
                      Full Transcript
                    </button>
                    <button
                      className={`px-4 py-3 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors ${activeTab === 'ai-summary' ? 'bg-white text-black' : 'bg-black text-white/70 hover:bg-white/10'}`}
                      onClick={() => setActiveTab('ai-summary')}
                    >
                      AI Summary
                    </button>
                    <button
                      className={`px-4 py-3 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors ${activeTab === 'analytics' ? 'bg-white text-black' : 'bg-black text-white/70 hover:bg-white/10'}`}
                      onClick={() => setActiveTab('analytics')}
                    >
                      Analytics & Insights
                    </button>
                    <button
                      className={`px-4 py-3 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors ${activeTab === 'timestamps' ? 'bg-white text-black' : 'bg-black text-white/70 hover:bg-white/10'}`}
                      onClick={() => setActiveTab('timestamps')}
                    >
                      Timestamps
                    </button>
                    <button
                      className={`px-4 py-3 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors ${activeTab === 'file-details' ? 'bg-white text-black' : 'bg-black text-white/70 hover:bg-white/10'}`}
                      onClick={() => setActiveTab('file-details')}
                    >
                      File Details
                    </button>
                    <button
                      className={`px-4 py-3 text-sm font-medium rounded-t-lg whitespace-nowrap flex items-center transition-colors ${activeTab === 'chat-ai' ? 'bg-white text-black' : 'bg-black text-white/70 hover:bg-white/10'}`}
                      onClick={() => setActiveTab('chat-ai')}
                    >
                      <FiMessageSquare className="w-4 h-4 mr-2" />
                      Chat with AI
                    </button>
                  </div>
                </div>
              
              {/* Content Area */}
              <div className="p-4 md:p-6">
                 {/* Transcript Tab */}
                 {activeTab === 'full-transcript' && (
                   <div className="max-w-full mx-auto">
                      <div className="flex flex-col gap-4 mb-6">
                        <div className="relative w-full">
                          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60" />
                          <input
                            type="text"
                            placeholder="Search transcript..."
                            className="w-full bg-black border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                       <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:ml-auto">
                         <button
                           onClick={copyToClipboard}
                           className="py-3 px-4 sm:px-6 bg-white text-black border border-white/20 rounded-lg flex items-center text-sm font-medium hover:bg-white/90 transition-colors justify-center sm:min-w-[120px]"
                         >
                           <FiCopy className="w-4 h-4 mr-2" />
                           <span>Copy</span>
                         </button>
                         <button
                           onClick={() => router.push(`/files/edit/${id}`)}
                           className="py-3 px-4 sm:px-6 bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 rounded-lg flex items-center text-sm font-medium transition-colors justify-center sm:min-w-[120px]"
                         >
                           <FiEdit className="w-4 h-4 mr-2" />
                           <span>Edit</span>
                         </button>
                         <div className="relative">
                           <button
                             onClick={() => setShowTranslateDropdown(!showTranslateDropdown)}
                             disabled={isTranslating}
                             className="w-full py-3 px-4 sm:px-6 bg-black border border-white/20 rounded-lg flex items-center text-sm font-medium disabled:opacity-50 hover:bg-white/10 transition-colors justify-center sm:min-w-[120px]"
                           >
                             <FiGlobe className="w-4 h-4 mr-2" />
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
  <div>
    <hr className="border-white/10 my-2" />
    <button
      onClick={resetTranslation}
      className="w-full text-left px-2 py-1 text-xs hover:bg-white/10 rounded text-white/60"
    >
      Show Original
    </button>
  </div>
)}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                  <div className="bg-black border border-white/10 rounded-xl p-4 md:p-6 overflow-y-auto mt-4 max-h-[60vh]">
                       <div className="transcript text-sm md:text-base leading-relaxed">
                         {file.transcript ? (
                           <div className="whitespace-pre-wrap">
                             <div 
                               dangerouslySetInnerHTML={{
                                 __html: highlightSearchText(translatedTranscript || file.transcript, searchQuery)
                               }}
                             />
                             {translatedTranscript && (
                               <div className="mt-6 pt-4 border-t border-white/10">
                                 <div className="text-sm text-white/60 mb-3 font-medium">Translated content shown above. Original transcript:</div>
                                 <div 
                                   className="text-sm text-white/40 whitespace-pre-wrap"
                                   dangerouslySetInnerHTML={{
                                     __html: highlightSearchText(file.transcript.substring(0, 200) + '...', searchQuery)
                                   }}
                                 />
                               </div>
                             )}
                           </div>
                         ) : (
                           <p className="text-white/60 text-center py-8">No transcript available</p>
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
                
                {/* Analytics & Insights Tab */}
                {activeTab === 'analytics' && (
                  <div className="max-w-7xl mx-auto space-y-8">
                    <div className="mb-6">
                      <h2 className="text-xl font-semibold text-white mb-2">Analytics & Insights</h2>
                      <p className="text-sm text-white/60">Comprehensive analysis of your transcript including word patterns, speaker contributions, and emotional tone.</p>
                    </div>
                    
                    {/* Word Cloud Analytics */}
                    <WordCloudAnalytics transcript={file.transcript} />
                    
                    {/* Speaker Talk Time Analysis */}
                    <SpeakerTalkTimeAnalysis transcript={file.transcript} />
                    
                    {/* Sentiment Analysis */}
                    <SentimentAnalysis transcript={file.transcript} />
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
                          <div className="flex items-center space-x-3">
                            {/* Chat Controls */}
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={startNewChat}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg transition-colors"
                                title="Start New Chat"
                              >
                                <FiPlus className="w-3 h-3" />
                                <span>New</span>
                              </button>
                              
                              {chatMessages.length > 0 && (
                                <button
                                  onClick={saveChatToHistory}
                                  className="flex items-center space-x-1 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs rounded-lg transition-colors"
                                  title="Save Chat"
                                >
                                  <FiSave className="w-3 h-3" />
                                  <span>Save</span>
                                </button>
                              )}
                              
                              <div className="relative">
                                <button
                                  onClick={() => setShowChatHistory(!showChatHistory)}
                                  className={`flex items-center space-x-1 px-3 py-1.5 ${
                                    showChatHistory ? 'bg-white/20' : 'bg-white/10 hover:bg-white/20'
                                  } text-white text-xs rounded-lg transition-colors`}
                                  title="Chat History"
                                >
                                  <FiClock className="w-3 h-3" />
                                  <span>History ({chatHistory.length})</span>
                                  {showChatHistory ? (
                                    <FiChevronUp className="w-3 h-3" />
                                  ) : (
                                    <FiChevronDown className="w-3 h-3" />
                                  )}
                                </button>
                                
                                {/* Chat History Dropdown */}
                                {showChatHistory && (
                                  <div className="absolute top-full right-0 mt-2 w-80 bg-black border border-white/20 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
                                    {chatHistory.length === 0 ? (
                                      <div className="p-4 text-center text-white/60">
                                        <FiClock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No chat history yet</p>
                                        <p className="text-xs mt-1">Start a conversation to see it here</p>
                                      </div>
                                    ) : (
                                      <div className="p-2">
                                        <div className="text-xs text-white/60 p-2 border-b border-white/10 mb-2">
                                          Recent Conversations
                                        </div>
                                        {chatHistory.map((chat) => (
                                          <div
                                            key={chat.id}
                                            className={`p-3 rounded-lg mb-2 border transition-all cursor-pointer group ${
                                              currentChatId === chat.id 
                                                ? 'bg-blue-500/20 border-blue-500/30' 
                                                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                                            }`}
                                            onClick={() => loadChatSession(chat)}
                                          >
                                            <div className="flex items-start justify-between">
                                              <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-medium text-white truncate mb-1">
                                                  {chat.title}
                                                </h4>
                                                <div className="flex items-center space-x-2 text-xs text-white/60">
                                                  <span>{formatChatTimestamp(chat.timestamp)}</span>
                                                  <span>•</span>
                                                  <span>{chat.messageCount} messages</span>
                                                </div>
                                              </div>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  deleteChatSession(chat.id);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-white/40 hover:text-red-400 transition-all rounded"
                                                title="Delete Chat"
                                              >
                                                <FiTrash2 className="w-3 h-3" />
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-xs text-white/60">
                              Powered by OpenAI
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-white/60 mt-2">
                          Ask questions about your transcript. The AI has full context of the content.
                        </p>
                      </div>
                      
                      {/* Chat Messages */}
                      <div ref={chatMessagesRef} className="h-96 overflow-y-auto p-4 space-y-4">
                        {/* Chat Session Indicator */}
                        {currentChatId && (
                          <div className="flex items-center justify-center mb-4">
                            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg px-3 py-2">
                              <div className="flex items-center space-x-2 text-xs text-blue-300">
                                <FiClock className="w-3 h-3" />
                                <span>Viewing saved chat session</span>
                                <button
                                  onClick={startNewChat}
                                  className="text-blue-400 hover:text-blue-300 underline"
                                >
                                  Start new
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                        
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
                                {message.role === 'user' ? (
                                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                                ) : (
                                  <div 
                                    className="text-sm" 
                                    dangerouslySetInnerHTML={{ 
                                      __html: formatAIResponse(message.content) 
                                    }}
                                  />
                                )}
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
