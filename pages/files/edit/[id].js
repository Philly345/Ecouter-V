import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../components/AuthContext';
import { getLanguageName, translateText, SUPPORTED_LANGUAGES } from '../../../utils/languages';
import Sidebar from '../../../components/Sidebar';
import { 
  FiPlay, 
  FiPause, 
  FiSkipBack, 
  FiSkipForward,
  FiVolume2,
  FiSave,
  FiDownload,
  FiArrowLeft,
  FiClock,
  FiFileText,
  FiEdit3,
  FiRefreshCw,
  FiGlobe
} from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function TranscriptEdit() {
  const router = useRouter();
  const { id } = router.query;
  const { user, authChecked } = useAuth();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Audio player states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [audioError, setAudioError] = useState(false);
  const audioRef = useRef(null);
  
  // Edit states
  const [editedTranscript, setEditedTranscript] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');

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

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);
    const handleError = (e) => {
      console.error('Audio error:', e);
      setAudioError(true);
      toast.error('Failed to load audio file');
    };
    const handleCanPlay = () => setAudioError(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [file]);

  // Warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Close translate dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showTranslateDropdown && !event.target.closest('.translate-dropdown')) {
        setShowTranslateDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTranslateDropdown]);

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
        setEditedTranscript(data.file.transcript || '');
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

  const getAudioUrl = () => {
    if (!file) return '';
    
    // Try different possible audio URL formats
    if (file.audioUrl) return file.audioUrl;
    if (file.url) return file.url;
    if (file.key) return `/api/files/stream/${file.key}`;
    if (file.filePath) return file.filePath;
    
    // Fallback - construct from file ID
    return `/api/files/stream/${id}`;
  };

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || audioError) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(error => {
        console.error('Audio play error:', error);
        setAudioError(true);
        toast.error('Failed to play audio. The audio file may not be available.');
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio || audioError) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * duration;
    
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const skipTime = (seconds) => {
    const audio = audioRef.current;
    if (!audio || audioError) return;

    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleTranscriptChange = (e) => {
    setEditedTranscript(e.target.value);
    setHasUnsavedChanges(true);
    // Reset translation when original text changes
    if (translatedTranscript) {
      setTranslatedTranscript('');
    }
  };

  const translateTranscript = async (targetLanguage) => {
    try {
      setIsTranslating(true);
      setShowTranslateDropdown(false);
      
      const textToTranslate = editedTranscript || file.transcript;
      if (!textToTranslate) {
        toast.error('No transcript available to translate');
        return;
      }

      const translated = await translateText(textToTranslate, targetLanguage);
      setTranslatedTranscript(translated);
      setSelectedTranslateLanguage(targetLanguage);
      
      toast.success(`Transcript translated to ${getLanguageName(targetLanguage)}`);
    } catch (error) {
      console.error('Translation error:', error);
      toast.error('Failed to translate transcript');
    } finally {
      setIsTranslating(false);
    }
  };

  const resetTranslation = () => {
    setTranslatedTranscript('');
    setSelectedTranslateLanguage('es');
  };

  const saveChanges = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/files/${id}/edit`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: editedTranscript,
        }),
      });

      if (response.ok) {
        setHasUnsavedChanges(false);
        toast.success('Changes saved successfully!');
      } else {
        throw new Error('Failed to save changes');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const exportTranscript = async (format) => {
    try {
      setExporting(true);
      const token = localStorage.getItem('token');
      
      // Use translated transcript if available, otherwise use edited transcript
      const transcriptToExport = translatedTranscript || editedTranscript;
      
      const response = await fetch(`/api/files/${id}/export`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format,
          transcript: transcriptToExport,
          title: file.originalName || 'Transcript',
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${file.originalName || 'transcript'}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success(`Transcript exported as ${format.toUpperCase()}!`);
      } else {
        throw new Error('Failed to export transcript');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export transcript');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <div>Loading transcript...</div>
        </div>
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">{error || 'Transcript not found'}</div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Edit Transcript - {file.originalName} | Ecouter</title>
      </Head>

      <div className="min-h-screen bg-black text-white flex">
        <div className="hidden lg:block">
          <Sidebar collapsed={sidebarCollapsed} onToggle={setSidebarCollapsed} />
        </div>
        
        <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-0 lg:ml-16' : 'ml-0 lg:ml-64'}`}>
          {/* Header */}
          <div className="bg-black border-b border-white/10 px-4 py-3 md:px-6 md:py-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => router.push(`/files/${id}`)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <FiArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-lg md:text-xl font-semibold">Edit Transcript</h1>
                  <p className="text-white/60 text-xs md:text-sm truncate max-w-[200px] md:max-w-none">{file.originalName}</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                {hasUnsavedChanges && (
                  <span className="text-yellow-400 text-xs md:text-sm">Unsaved changes</span>
                )}
                <button
                  onClick={saveChanges}
                  disabled={!hasUnsavedChanges || saving}
                  className="w-full sm:w-auto px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 rounded-lg text-sm flex items-center justify-center space-x-2"
                >
                  {saving ? <FiRefreshCw className="w-4 h-4 animate-spin" /> : <FiSave className="w-4 h-4" />}
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Audio Player */}
          <div className="bg-black border-b border-white/10 px-4 py-3 md:px-6 md:py-4">
            <audio
              ref={audioRef}
              src={getAudioUrl()}
              preload="metadata"
            />
            
            {audioError && (
              <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                Audio file is not available for playback. You can still edit the transcript.
              </div>
            )}
            
            {/* Mobile Layout */}
            <div className="block sm:hidden space-y-4">
              {/* Main Controls Row */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => skipTime(-10)}
                  disabled={audioError}
                  className="p-3 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiSkipBack className="w-5 h-5" />
                </button>
                
                <button
                  onClick={togglePlayPause}
                  disabled={audioError}
                  className="p-4 bg-white text-black rounded-full hover:bg-white/90 transition-colors disabled:bg-white/50 disabled:cursor-not-allowed"
                >
                  {isPlaying ? <FiPause className="w-6 h-6" /> : <FiPlay className="w-6 h-6 ml-0.5" />}
                </button>
                
                <button
                  onClick={() => skipTime(10)}
                  disabled={audioError}
                  className="p-3 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiSkipForward className="w-5 h-5" />
                </button>
              </div>
              
              {/* Progress Bar */}
              <div className="px-4">
                <div 
                  className={`bg-white/20 h-3 rounded-full ${audioError ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  onClick={audioError ? undefined : handleSeek}
                >
                  <div 
                    className="bg-white h-3 rounded-full transition-all duration-100"
                    style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-white/60 mt-2">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
              
              {/* Volume and Speed Controls */}
              <div className="flex items-center justify-between px-4">
                <div className="flex items-center space-x-3">
                  <FiVolume2 className="w-4 h-4 text-white/60" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    disabled={audioError}
                    onChange={(e) => {
                      const newVolume = parseFloat(e.target.value);
                      setVolume(newVolume);
                      if (audioRef.current) {
                        audioRef.current.volume = newVolume;
                      }
                    }}
                    className="w-24"
                  />
                </div>
                
                <select
                  value={playbackRate}
                  disabled={audioError}
                  onChange={(e) => {
                    const rate = parseFloat(e.target.value);
                    setPlaybackRate(rate);
                    if (audioRef.current) {
                      audioRef.current.playbackRate = rate;
                    }
                  }}
                  className="bg-black border border-white/20 rounded px-3 py-2 text-sm disabled:opacity-50"
                >
                  <option value="0.5">0.5x</option>
                  <option value="0.75">0.75x</option>
                  <option value="1">1x</option>
                  <option value="1.25">1.25x</option>
                  <option value="1.5">1.5x</option>
                  <option value="2">2x</option>
                </select>
              </div>
            </div>
            
            {/* Desktop Layout */}
            <div className="hidden sm:flex items-center gap-4">
              {/* Play/Pause Button */}
              <button
                onClick={togglePlayPause}
                disabled={audioError}
                className="p-3 bg-white text-black rounded-full hover:bg-white/90 transition-colors disabled:bg-white/50 disabled:cursor-not-allowed"
              >
                {isPlaying ? <FiPause className="w-5 h-5" /> : <FiPlay className="w-5 h-5 ml-0.5" />}
              </button>
              
              {/* Skip Buttons */}
              <button
                onClick={() => skipTime(-10)}
                disabled={audioError}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiSkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={() => skipTime(10)}
                disabled={audioError}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiSkipForward className="w-4 h-4" />
              </button>
              
              {/* Progress Bar */}
              <div className="flex-1 mx-4">
                <div 
                  className={`bg-white/20 h-2 rounded-full ${audioError ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  onClick={audioError ? undefined : handleSeek}
                >
                  <div 
                    className="bg-white h-2 rounded-full transition-all duration-100"
                    style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-white/60 mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
              
              {/* Volume Control */}
              <div className="flex items-center space-x-2">
                <FiVolume2 className="w-4 h-4 text-white/60" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  disabled={audioError}
                  onChange={(e) => {
                    const newVolume = parseFloat(e.target.value);
                    setVolume(newVolume);
                    if (audioRef.current) {
                      audioRef.current.volume = newVolume;
                    }
                  }}
                  className="w-20"
                />
              </div>
              
              {/* Playback Speed */}
              <select
                value={playbackRate}
                disabled={audioError}
                onChange={(e) => {
                  const rate = parseFloat(e.target.value);
                  setPlaybackRate(rate);
                  if (audioRef.current) {
                    audioRef.current.playbackRate = rate;
                  }
                }}
                className="bg-black border border-white/20 rounded px-2 py-1 text-xs disabled:opacity-50"
              >
                <option value="0.5">0.5x</option>
                <option value="0.75">0.75x</option>
                <option value="1">1x</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2x</option>
              </select>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-4 md:p-6">
            <div className="max-w-5xl mx-auto">
              {/* Action Bar */}
              <div className="mb-4 md:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h2 className="text-base md:text-lg font-semibold flex items-center">
                  <FiEdit3 className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  Edit Transcript
                </h2>
                
                {/* Mobile Action Buttons */}
                <div className="block sm:hidden space-y-3">
                  <div className="flex gap-2">
                    <div className="relative translate-dropdown flex-1">
                      <button
                        onClick={() => setShowTranslateDropdown(!showTranslateDropdown)}
                        disabled={isTranslating}
                        className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg flex items-center justify-center space-x-2 text-sm disabled:opacity-50 hover:bg-white/5"
                      >
                        <FiGlobe className="w-4 h-4" />
                        <span>{isTranslating ? 'Translating...' : 'Translate'}</span>
                      </button>
                      
                      {showTranslateDropdown && (
                        <div className="absolute left-0 mt-1 w-full bg-black border border-white/20 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                          <div className="p-3">
                            <div className="text-xs text-white/60 mb-3">Translate to:</div>
                            
                            {/* Popular Languages Section */}
                            <div className="mb-3">
                              <div className="text-xs text-white/40 mb-2">Popular Languages</div>
                              <div className="grid grid-cols-2 gap-1">
                                {SUPPORTED_LANGUAGES.slice(0, 8).map((lang) => (
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
                  
                  <div className="flex gap-2">
                    <select
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value)}
                      className="flex-1 bg-black border border-white/20 rounded-lg px-3 py-3 text-sm"
                    >
                      <option value="pdf">PDF</option>
                      <option value="docx">DOCX</option>
                      <option value="txt">TXT</option>
                    </select>
                    
                    <button
                      onClick={() => exportTranscript(exportFormat)}
                      disabled={exporting}
                      className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 rounded-lg text-sm flex items-center justify-center space-x-2"
                    >
                      {exporting ? <FiRefreshCw className="w-4 h-4 animate-spin" /> : <FiDownload className="w-4 h-4" />}
                      <span>{exporting ? 'Exporting...' : `Export ${exportFormat.toUpperCase()}`}</span>
                    </button>
                  </div>
                </div>
                
                {/* Desktop Action Buttons */}
                <div className="hidden sm:flex items-center gap-3">
                  {/* Translate Button */}
                  <div className="relative translate-dropdown">
                    <button
                      onClick={() => setShowTranslateDropdown(!showTranslateDropdown)}
                      disabled={isTranslating}
                      className="px-4 py-2 bg-black border border-white/20 rounded-lg flex items-center space-x-2 text-sm disabled:opacity-50 hover:bg-white/5"
                    >
                      <FiGlobe className="w-4 h-4" />
                      <span>{isTranslating ? 'Translating...' : 'Translate'}</span>
                    </button>
                    
                    {showTranslateDropdown && (
                      <div className="absolute right-0 mt-1 w-80 bg-black border border-white/20 rounded-lg shadow-lg z-10 max-h-96 overflow-y-auto">
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
                  
                  {/* Export Options */}
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                    className="bg-black border border-white/20 rounded px-3 py-2 text-sm"
                  >
                    <option value="pdf">PDF</option>
                    <option value="docx">DOCX</option>
                    <option value="txt">TXT</option>
                  </select>
                  
                  <button
                    onClick={() => exportTranscript(exportFormat)}
                    disabled={exporting}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 rounded-lg text-sm flex items-center space-x-2"
                  >
                    {exporting ? <FiRefreshCw className="w-4 h-4 animate-spin" /> : <FiDownload className="w-4 h-4" />}
                    <span>{exporting ? 'Exporting...' : `Export ${exportFormat.toUpperCase()}`}</span>
                  </button>
                </div>
              </div>

              {/* Translation Status */}
              {translatedTranscript && (
                <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <div className="text-sm text-blue-400">
                    Showing transcript translated to {getLanguageName(selectedTranslateLanguage)}
                  </div>
                </div>
              )}

              {/* Transcript Editor */}
              <div className="bg-black border border-white/10 rounded-lg">
                <div className="border-b border-white/10 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-white/60">
                      <div className="flex items-center">
                        <FiClock className="w-4 h-4 mr-1" />
                        Duration: {formatTime(file.duration || 0)}
                      </div>
                      <div className="flex items-center">
                        <FiFileText className="w-4 h-4 mr-1" />
                        Words: {(translatedTranscript || editedTranscript).split(/\s+/).filter(word => word.length > 0).length}
                      </div>
                    </div>
                  </div>
                </div>
                
                <textarea
                  value={translatedTranscript || editedTranscript}
                  onChange={handleTranscriptChange}
                  placeholder="Start editing your transcript..."
                  className="w-full h-96 p-4 bg-transparent border-none resize-none focus:outline-none text-sm leading-relaxed"
                  style={{ minHeight: '400px' }}
                />
              </div>

              {/* Tips */}
              <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg">
                <h3 className="text-sm font-medium mb-2">Editing Tips:</h3>
                <ul className="text-xs text-white/60 space-y-1">
                  <li>• Use the audio player to listen while editing (if available)</li>
                  <li>• Changes are automatically tracked - don't forget to save</li>
                  <li>• Use the translate button to view your transcript in different languages</li>
                  <li>• Export options include PDF, DOCX, and TXT formats</li>
                  <li>• Adjust playback speed for easier transcription review</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
