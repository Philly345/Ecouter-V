import Head from 'next/head';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useDropzone } from 'react-dropzone';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import { useAuth } from '../components/AuthContext';
import T from '../components/T';
import { 
  FiUpload, 
  FiFile, 
  FiX, 
  FiPlay,
  FiSettings,
  FiInfo,
  FiCheck,
  FiClock,
  FiUserPlus,
  FiClock as FiClockIcon,
  FiFilter,
  FiType
} from 'react-icons/fi';
import { SUPPORTED_LANGUAGES } from '../utils/languages';

export default function Upload() {
  const router = useRouter();
  const { user, logout, loading: authLoading, authChecked } = useAuth();
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFormats, setShowFormats] = useState(false);
  const [processingEstimate, setProcessingEstimate] = useState('~1 min');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [languageSearchTerm, setLanguageSearchTerm] = useState('');
  const [settings, setSettings] = useState({
    language: 'en',
    quality: 'standard',
    speakerIdentification: false,
    includeTimestamps: true,
    filterProfanity: false,
    autoPunctuation: true,
    verbatimTranscription: true, // true = verbatim (exact), false = non-verbatim (clean)
  });

  // Get language name helper function
  const getLanguageName = (code) => {
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
    return lang ? lang.name : 'English';
  };

  // Filter languages based on search term
  const filteredLanguages = SUPPORTED_LANGUAGES.filter(lang =>
    lang.name.toLowerCase().includes(languageSearchTerm.toLowerCase()) ||
    lang.code.toLowerCase().includes(languageSearchTerm.toLowerCase())
  );

  // Get popular languages (filtered if search term exists)
  const popularLanguages = languageSearchTerm 
    ? filteredLanguages.slice(0, 12)
    : SUPPORTED_LANGUAGES.slice(0, 12);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowLanguageDropdown(false);
        setLanguageSearchTerm(''); // Reset search when closing
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && showLanguageDropdown) {
        setShowLanguageDropdown(false);
        setLanguageSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showLanguageDropdown]);

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (showLanguageDropdown && searchInputRef.current) {
      // Small delay to ensure the dropdown is rendered
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [showLanguageDropdown]);

  useEffect(() => {
    // Only redirect if auth check is complete and no user found
    if (authChecked && !user) {
      router.push('/login');
    }
  }, [user, router, authChecked]);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(({ file, errors }) => {
        const errorMessages = errors.map(e => e.message).join(', ');
        return `${file.name}: ${errorMessages}`;
      }).join('\n');
      
      alert(`Some files were rejected:\n${errors}`);
      return;
    }
    
    if (acceptedFiles.length > 0) {
      // Validate file sizes
      const oversizedFiles = acceptedFiles.filter(file => file.size > 500 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        alert(`The following files exceed the 500MB limit:\n${oversizedFiles.map(f => f.name).join('\n')}`);
        return;
      }

      setSelectedFiles(acceptedFiles);
      
      // Calculate processing estimate based on file size
      const totalSizeInMB = acceptedFiles.reduce((acc, file) => acc + file.size / (1024 * 1024), 0);
      if (totalSizeInMB < 20) {
        setProcessingEstimate('~1 min');
      } else if (totalSizeInMB < 50) {
        setProcessingEstimate('~2 mins');
      } else {
        setProcessingEstimate('2-5 mins');
      }
      
      // No automatic transcription start - user will click the button
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.flac', '.aac'],
      'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.wmv', '.webm'],
    },
    maxSize: 500 * 1024 * 1024, // 500MB
    multiple: true,
  });

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const token = localStorage.getItem('token');
      const failedUploads = [];
      let completedUploads = 0;

      // Process each file
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        try {
          // Check if file is large (>4MB) - use direct upload
          const isLargeFile = file.size > 4 * 1024 * 1024; // 4MB
          
          console.log(`File: ${file.name}, Size: ${file.size} bytes (${(file.size / 1024 / 1024).toFixed(2)}MB), Large: ${isLargeFile}`);
          
          if (isLargeFile) {
            console.log('Using large file upload method');
            await handleLargeFileUpload(file, token);
          } else {
            console.log('Using small file upload method');
            await handleSmallFileUpload(file, token);
          }
          
          completedUploads++;
          setUploadProgress((completedUploads / selectedFiles.length) * 100);
          
        } catch (error) {
          console.error(`Upload failed for ${file.name}:`, error);
          failedUploads.push({
            file: file.name,
            error: error.message || 'Unknown error'
          });
        }
      }

      if (failedUploads.length === 0) {
        setTimeout(() => {
          router.push('/files/processing');
        }, 1000);
      } else {
        console.error('Upload failures:', failedUploads);
        const errorMsg = failedUploads.map(f => `${f.file}: ${f.error}`).join('\n');
        alert(`Some uploads failed:\n${errorMsg}`);
        
        // Still redirect if at least one file succeeded
        if (completedUploads > 0) {
          setTimeout(() => {
            router.push('/files/processing');
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Handle large files (>4MB) with direct upload to R2
  const handleLargeFileUpload = async (file, token) => {
    console.log('🔍 Starting large file upload process...');
    
    // Step 1: Get presigned URL (using debug endpoint for better error info)
    console.log('📡 Requesting presigned URL...');
    const presignedResponse = await fetch('/api/upload/presigned-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      }),
    });

    console.log('📊 Presigned URL response status:', presignedResponse.status);

    if (!presignedResponse.ok) {
      const errorText = await presignedResponse.text();
      console.error('❌ Presigned URL failed:', errorText);
      const errorData = await presignedResponse.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Presigned URL failed: ${errorData.error} - ${errorData.details || errorText}`);
    }

    const { presignedUrl, fileName, publicUrl } = await presignedResponse.json();
    console.log('✅ Presigned URL obtained');

    // Step 2: Upload directly to R2 using presigned URL
    console.log('☁️ Uploading to R2...');
    const uploadResponse = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    console.log('📊 R2 upload response status:', uploadResponse.status);

    if (!uploadResponse.ok) {
      console.error('❌ R2 upload failed:', uploadResponse.status, uploadResponse.statusText);
      throw new Error(`Upload to storage failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }

    console.log('✅ R2 upload successful');

    // Step 3: Confirm upload and start transcription
    console.log('✅ Confirming upload...');
    
    // Choose confirm endpoint based on quality setting
    const confirmEndpoint = settings.quality === 'enhanced' ? '/api/upload/confirm-gladia' : '/api/upload/confirm';
    
    console.log(`Using ${settings.quality} quality for transcription (large file)`);
    
    const confirmResponse = await fetch(confirmEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileUrl: publicUrl,
        fileKey: fileName,
        language: settings.language,
        quality: settings.quality,
        speakerIdentification: settings.speakerIdentification,
        includeTimestamps: settings.includeTimestamps,
        filterProfanity: settings.filterProfanity,
        autoPunctuation: settings.autoPunctuation,
        verbatimTranscription: settings.verbatimTranscription,
      }),
    });

    console.log('📊 Confirm response status:', confirmResponse.status);

    if (!confirmResponse.ok) {
      const errorText = await confirmResponse.text();
      console.error('❌ Confirmation failed:', errorText);
      const errorData = await confirmResponse.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Confirmation failed: ${errorData.error} - ${errorData.details || errorText}`);
    }

    const confirmResult = await confirmResponse.json();
    console.log(`🎉 Large file upload completed successfully with ${settings.quality} quality!`, confirmResult);
  };

  // Handle small files (<4MB) with original upload method
  const handleSmallFileUpload = async (file, token) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', settings.language);
    formData.append('quality', settings.quality);
    formData.append('speakerIdentification', settings.speakerIdentification);
    formData.append('includeTimestamps', settings.includeTimestamps);
    formData.append('filterProfanity', settings.filterProfanity);
    formData.append('autoPunctuation', settings.autoPunctuation);
    formData.append('verbatimTranscription', settings.verbatimTranscription);

    // Choose API endpoint based on quality setting
    const endpoint = settings.quality === 'enhanced' ? '/api/transcribe-gladia' : '/api/transcribe';
    
    console.log(`Using ${settings.quality} quality for transcription (small file)`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }
    
    const result = await response.json();
    console.log(`Small file upload successful with ${settings.quality} quality:`, result);
  };

  const removeFile = (index) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
    
    if (newFiles.length === 0) {
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getUploadMethod = (fileSize) => {
    const isLargeFile = fileSize > 4 * 1024 * 1024; // 4MB
    return isLargeFile ? 'Direct Upload' : 'Standard';
  };

  const getUploadMethodColor = (fileSize) => {
    const isLargeFile = fileSize > 4 * 1024 * 1024; // 4MB
    return isLargeFile ? 'text-blue-400' : 'text-green-400';
  };

  const calculateAudioLength = (fileSize) => {
    // Very rough estimate: ~1MB per minute for standard audio
    const sizeInMB = fileSize / (1024 * 1024);
    const estimatedMinutes = Math.round(sizeInMB);
    
    if (estimatedMinutes < 1) return '< 1 min';
    return `~${estimatedMinutes} min`;
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
        <title><T>Upload</T> | Ecouter</title>
      </Head>

      <div className="min-h-screen flex bg-black text-white">
        <Sidebar 
          currentPage="upload" 
          user={user}
          onLogout={logout}
          onSidebarToggle={(collapsed) => setSidebarCollapsed(collapsed)}
        />
        
        <div className={`flex-1 px-4 py-8 overflow-auto transition-all duration-300 ${sidebarCollapsed ? 'ml-0 lg:ml-16' : 'ml-0 lg:ml-64'}`}>
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-bold">
                <T>Upload Media</T>
              </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Left Column - Upload Area */}
              <div className="md:col-span-2 space-y-6">
                {/* Dropzone */}
                <div 
                  {...getRootProps()} 
                  className={`
                    border-2 border-dashed rounded-xl p-8 
                    transition-colors text-center cursor-pointer
                    ${isDragActive ? 'border-white/40 bg-white/10' : 'border-white/20 hover:border-white/30 hover:bg-white/5'}
                    ${selectedFiles.length > 0 ? 'bg-white/5' : ''}
                  `}
                >
                  <input {...getInputProps()} />
                  
                  {selectedFiles.length === 0 ? (
                    <div>
                      <FiUpload className="w-12 h-12 mx-auto text-white/60 mb-4" />
                  <p className="text-lg mb-2">Drag & drop files here</p>
                  <p className="text-sm text-white/60">or click to browse your files</p>
                  <p className="text-xs text-white/40 mt-2">Supports files up to 500MB</p>
                  
                  <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-xs text-blue-300">
                      ✨ <strong>Smart Upload:</strong> Small files (&lt;4MB) use fast upload, large files use direct storage upload
                    </p>
                  </div>                      <div className="mt-6 flex justify-center">
                        <button 
                          type="button" 
                          className="text-xs text-white/60 underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowFormats(true);
                          }}
                        >
                          Supported file formats
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">Ready for transcription</p>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFiles([]);
                          }}
                          className="text-white/60 hover:text-white"
                        >
                          <FiX className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {selectedFiles.map((file, index) => (
                          <div 
                            key={index} 
                            className="flex items-center justify-between p-3 bg-white/10 rounded-lg"
                          >
                            <div className="flex items-center overflow-hidden">
                              <FiFile className="w-5 h-5 flex-shrink-0 mr-3" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {file.name}
                                </p>
                                <div className="flex text-xs text-white/60 mt-0.5">
                                  <span>{formatFileSize(file.size)}</span>
                                  <span className="mx-1.5">•</span>
                                  <span>{calculateAudioLength(file.size)}</span>
                                  <span className="mx-1.5">•</span>
                                  <span className={getUploadMethodColor(file.size)}>
                                    {getUploadMethod(file.size)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFile(index);
                              }}
                              className="p-1.5 hover:bg-white/10 rounded-full text-white/60 hover:text-white ml-2"
                            >
                              <FiX className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      
                      <p className="text-sm text-white/60 mt-4">
                        Click to add a different file
                      </p>
                    </div>
                  )}
                </div>

                {/* Start Transcription Button */}
                <button
                  onClick={handleUpload}
                  disabled={uploading || selectedFiles.length === 0}
                  className="w-full py-3 bg-white/10 hover:bg-white/15 disabled:bg-white/5 disabled:opacity-50 rounded-lg text-white text-sm font-medium transition-colors flex items-center justify-center"
                >
                  {uploading ? (
                    <>
                      <div className="spinner w-3 h-3 mr-2"></div>
                      <span>Transcribing...</span>
                    </>
                  ) : (
                    <>
                      <FiPlay className="w-3 h-3 mr-2" />
                      <span>Start Transcription</span>
                    </>
                  )}
                </button>
                
                {/* Audio Preview - If we add waveform visualization later */}
              </div>
              
              {/* Right Column - Settings */}
              <div className="space-y-6">
                {/* Settings Panel */}
                <div className="bg-white/5 rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <FiSettings className="w-5 h-5 text-white/60" />
                    <h3 className="text-lg font-semibold">Settings</h3>
                  </div>
                
                  <div className="space-y-4">
                    <div className="relative" ref={dropdownRef}>
                      <label className="block text-sm mb-1.5">Language</label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowLanguageDropdown(!showLanguageDropdown);
                          if (!showLanguageDropdown) {
                            setLanguageSearchTerm(''); // Reset search when opening
                          }
                        }}
                        className="w-full bg-white/10 rounded-lg border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between"
                      >
                        <span>{getLanguageName(settings.language)}</span>
                        <svg className={`w-4 h-4 transition-transform ${
                          showLanguageDropdown ? 'rotate-180' : ''
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {showLanguageDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-black border border-white/20 rounded-lg shadow-lg z-20 max-h-96 overflow-hidden">
                          <div className="p-3">
                            <div className="text-xs text-white/60 mb-3">Select Language:</div>
                            
                            {/* Search Input */}
                            <div className="mb-3">
                              <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Search languages..."
                                value={languageSearchTerm}
                                onChange={(e) => setLanguageSearchTerm(e.target.value)}
                                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                autoComplete="off"
                              />
                            </div>
                            
                            {/* Popular Languages Section - only show if no search term */}
                            {!languageSearchTerm && (
                              <div className="mb-3">
                                <div className="text-xs text-white/40 mb-2">Popular Languages</div>
                                <div className="grid grid-cols-2 gap-1">
                                  {popularLanguages.map((lang) => (
                                    <button
                                      key={lang.code}
                                      onClick={() => {
                                        setSettings({...settings, language: lang.code});
                                        setShowLanguageDropdown(false);
                                        setLanguageSearchTerm('');
                                      }}
                                      className={`text-left px-2 py-1.5 text-xs rounded transition-colors ${
                                        settings.language === lang.code
                                          ? 'bg-white/20 text-white'
                                          : 'hover:bg-white/10 text-white/80'
                                      }`}
                                      title={lang.name}
                                    >
                                      {settings.language === lang.code && '✓ '}{lang.name}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {!languageSearchTerm && <hr className="border-white/10 my-2" />}

                            {/* All Languages Section */}
                            <div>
                              <div className="text-xs text-white/40 mb-2">
                                {languageSearchTerm ? `Search Results (${filteredLanguages.length})` : `All Languages (${SUPPORTED_LANGUAGES.length})`}
                              </div>
                              <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                {(languageSearchTerm ? filteredLanguages : SUPPORTED_LANGUAGES).length > 0 ? (
                                  (languageSearchTerm ? filteredLanguages : SUPPORTED_LANGUAGES).map((lang) => (
                                    <button
                                      key={lang.code}
                                      onClick={() => {
                                        setSettings({...settings, language: lang.code});
                                        setShowLanguageDropdown(false);
                                        setLanguageSearchTerm('');
                                      }}
                                      className={`w-full text-left px-3 py-2 text-sm rounded flex justify-between items-center transition-colors hover:bg-white/10 ${
                                        settings.language === lang.code
                                          ? 'bg-white/20 text-white'
                                          : 'text-white/80'
                                      }`}
                                    >
                                      <span>{settings.language === lang.code && '✓ '}{lang.name}</span>
                                      {lang.needsTranslation && (
                                        <span className="text-xs text-white/40">via EN</span>
                                      )}
                                    </button>
                                  ))
                                ) : (
                                  <div className="text-center py-4 text-white/40 text-sm">
                                    No languages found matching "{languageSearchTerm}"
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm mb-1.5">Quality</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSettings({...settings, quality: 'standard'})}
                          className={`px-2 py-1 text-xs rounded border ${
                            settings.quality === 'standard' 
                              ? 'bg-white/20 border-white/30 text-white' 
                              : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                          }`}
                        >
                          <div>Standard</div>
                          <div className="text-[10px] text-white/60">Fast & Reliable</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSettings({...settings, quality: 'enhanced'})}
                          className={`px-2 py-1 text-xs rounded border ${
                            settings.quality === 'enhanced' 
                              ? 'bg-white/20 border-white/30 text-white' 
                              : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>Enhanced</span>
                            <span className="text-[9px] px-1.5 py-0.5 bg-blue-500 text-white rounded-full font-medium">Beta</span>
                          </div>
                          <div className="text-[10px] text-white/60">AI Auto-Correction</div>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm mb-1.5">Transcription Style</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSettings({...settings, verbatimTranscription: true})}
                          className={`px-2 py-1 text-xs rounded border ${
                            settings.verbatimTranscription 
                              ? 'bg-white/20 border-white/30 text-white' 
                              : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                          }`}
                        >
                          <div>Verbatim</div>
                          <div className="text-[10px] text-white/60">Exact Speech</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSettings({...settings, verbatimTranscription: false})}
                          className={`px-2 py-1 text-xs rounded border ${
                            !settings.verbatimTranscription 
                              ? 'bg-white/20 border-white/30 text-white' 
                              : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                          }`}
                        >
                          <div>Non-Verbatim</div>
                          <div className="text-[10px] text-white/60">Clean & Readable</div>
                        </button>
                      </div>
                      <div className="mt-2 p-2 bg-white/5 rounded-lg">
                        <div className="text-xs text-white/60">
                          {settings.verbatimTranscription ? (
                            <>
                              <strong>Verbatim:</strong> Includes all filler words (um, uh), repetitions, hesitations, and non-verbal sounds exactly as spoken.
                            </>
                          ) : (
                            <>
                              <strong>Non-Verbatim:</strong> Removes filler words, repetitions, and false starts for cleaner, more readable text.
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4 pt-4 border-t border-white/10">
                      <label className="flex items-center justify-between">
                        <div className="flex items-center">
                          <FiUserPlus className="w-4 h-4 mr-2 text-white/60" />
                          <span className="text-sm">Speaker Identification</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.speakerIdentification}
                          onChange={(e) => setSettings({...settings, speakerIdentification: e.target.checked})}
                          className="toggle"
                        />
                      </label>

                      <label className="flex items-center justify-between">
                        <div className="flex items-center">
                          <FiClockIcon className="w-4 h-4 mr-2 text-white/60" />
                          <span className="text-sm">Include Timestamps</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.includeTimestamps}
                          onChange={(e) => setSettings({...settings, includeTimestamps: e.target.checked})}
                          className="toggle"
                        />
                      </label>

                      <label className="flex items-center justify-between">
                        <div className="flex items-center">
                          <FiFilter className="w-4 h-4 mr-2 text-white/60" />
                          <span className="text-sm">Filter Profanity</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.filterProfanity}
                          onChange={(e) => setSettings({...settings, filterProfanity: e.target.checked})}
                          className="toggle"
                        />
                      </label>

                      <label className="flex items-center justify-between">
                        <div className="flex items-center">
                          <FiType className="w-4 h-4 mr-2 text-white/60" />
                          <span className="text-sm">Auto-punctuation</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.autoPunctuation}
                          onChange={(e) => setSettings({...settings, autoPunctuation: e.target.checked})}
                          className="toggle"
                        />
                      </label>
                    </div>
                </div>

                {/* Processing Time Estimate */}
                <div className="bg-white/5 rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-2">
                    <FiClock className="w-5 h-5 text-white/60" />
                    <h3 className="text-lg font-semibold">Processing Estimate</h3>
                  </div>
                  
                  <div className="flex items-center justify-center py-4">
                    <div className="text-2xl font-bold">{processingEstimate}</div>
                  </div>
                  
                  <p className="text-xs text-white/60 text-center">
                    Estimated processing time<br />
                    2-5 minutes per hour of audio
                  </p>
                </div>
              </div>
            </div>
            
            {/* Upload Progress - Hidden */}
            {false && uploading && selectedFiles.length > 0 && (
              <div className="max-w-2xl mx-auto mt-8">
                <div className="progress-bar h-4 rounded-full bg-white/10 mb-2">
                  <div 
                    className="progress-fill h-full rounded-full transition-all duration-300 bg-white/50"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/80">Uploading file...</span>
                  <span className="text-white/60">{Math.round(uploadProgress)}%</span>
                </div>
              </div>
            )}
            
            {/* Supported Formats Modal */}
            <Modal
              isOpen={showFormats}
              onClose={() => setShowFormats(false)}
              title="Supported File Formats"
              maxWidth="max-w-2xl"
            >
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-white mb-3 flex items-center space-x-2">
                    <FiFile className="w-4 h-4" />
                    <span>Audio Formats</span>
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {['MP3', 'WAV', 'M4A', 'FLAC', 'AAC', 'OGG'].map(format => (
                      <span key={format} className="px-3 py-1 bg-white/10 rounded text-sm text-center">
                        {format}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-3 flex items-center space-x-2">
                    <FiPlay className="w-4 h-4" />
                    <span>Video Formats</span>
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {['MP4', 'MOV', 'AVI', 'MKV', 'WMV', 'WEBM'].map(format => (
                      <span key={format} className="px-3 py-1 bg-white/10 rounded text-sm text-center">
                        {format}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Modal>
          </div>
        </div>
      </div>
    </>
  );
}