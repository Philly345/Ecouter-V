import Head from 'next/head';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useDropzone } from 'react-dropzone';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
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

export default function Upload({ user }) {
  const router = useRouter();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFormats, setShowFormats] = useState(false);
  const [processingEstimate, setProcessingEstimate] = useState('~1 min');
  const [settings, setSettings] = useState({
    language: 'en',
    quality: 'standard',
    speakerIdentification: false,
    includeTimestamps: true,
    filterProfanity: false,
    autoPunctuation: true,
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      alert('File type not supported or file too large (max 500MB)');
      return;
    }
    
    if (acceptedFiles.length > 0) {
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
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.flac', '.aac'],
      'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.wmv', '.webm'],
    },
    maxSize: 500 * 1024 * 1024, // 500MB
    multiple: false,
  });

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFiles[0]); // For now, just upload the first file
      formData.append('language', settings.language);
      formData.append('quality', settings.quality);
      formData.append('speakerIdentification', settings.speakerIdentification);
      formData.append('includeTimestamps', settings.includeTimestamps);
      formData.append('filterProfanity', settings.filterProfanity);
      formData.append('autoPunctuation', settings.autoPunctuation);

      const token = localStorage.getItem('token');
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 200);

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const data = await response.json();
        setTimeout(() => {
          router.push('/files/processing');
        }, 1000);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
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

  const calculateAudioLength = (fileSize) => {
    // Very rough estimate: ~1MB per minute for standard audio
    const sizeInMB = fileSize / (1024 * 1024);
    const estimatedMinutes = Math.round(sizeInMB);
    
    if (estimatedMinutes < 1) return '< 1 min';
    return `~${estimatedMinutes} min`;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Upload | Ecouter</title>
      </Head>

      <div className="min-h-screen flex bg-gray-950 text-white">
        <Sidebar activePage="upload" user={user} />
        
        <div className="flex-1 px-4 py-8 overflow-auto">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-bold">Upload Media</h1>
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
                    ${isDragActive ? 'border-blue-400 bg-blue-500/10' : 'border-white/20 hover:border-white/30 hover:bg-white/5'}
                    ${selectedFiles.length > 0 ? 'bg-white/5' : ''}
                  `}
                >
                  <input {...getInputProps()} />
                  
                  {selectedFiles.length === 0 ? (
                    <div>
                      <FiUpload className="w-12 h-12 mx-auto text-white/60 mb-4" />
                      <p className="text-lg mb-2">Drag & drop files here</p>
                      <p className="text-sm text-white/60">or click to browse your files</p>
                      
                      <div className="mt-6 flex justify-center">
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
                      
                      {selectedFiles.map((file, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between p-3 bg-white/10 rounded-lg"
                        >
                          <div className="flex items-center overflow-hidden">
                            <FiFile className="w-6 h-6 flex-shrink-0 mr-3" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">
                                {file.name}
                              </p>
                              <div className="flex text-xs text-white/60 mt-0.5">
                                <span>{formatFileSize(file.size)}</span>
                                <span className="mx-1.5">•</span>
                                <span>{calculateAudioLength(file.size)}</span>
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
                      
                      <p className="text-sm text-white/60 mt-4">
                        Click to add a different file
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Audio Preview - If we add waveform visualization later */}
              </div>
              
              {/* Right Column - Settings */}
              <div className="space-y-6">
                {/* Settings Panel */}
                <div className="bg-white/5 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <FiSettings className="w-5 h-5 text-white/60" />
                      <h3 className="text-lg font-semibold">Settings</h3>
                    </div>
                    
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className="text-xs text-white/60 underline"
                    >
                      {showSettings ? 'Hide options' : 'Show all options'}
                    </button>
                  </div>
                
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm mb-1.5">Language</label>
                      <select 
                        value={settings.language}
                        onChange={(e) => setSettings({...settings, language: e.target.value})}
                        className="w-full bg-white/10 rounded-lg border border-white/10 px-3 py-2 text-sm"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="it">Italian</option>
                        <option value="pt">Portuguese</option>
                        <option value="nl">Dutch</option>
                        <option value="ja">Japanese</option>
                        <option value="zh">Chinese</option>
                        <option value="ko">Korean</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm mb-1.5">Quality</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSettings({...settings, quality: 'standard'})}
                          className={`px-3 py-2 text-sm rounded border ${
                            settings.quality === 'standard' 
                              ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' 
                              : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                          }`}
                        >
                          Standard
                        </button>
                        <button
                          type="button"
                          onClick={() => setSettings({...settings, quality: 'enhanced'})}
                          className={`px-3 py-2 text-sm rounded border ${
                            settings.quality === 'enhanced' 
                              ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' 
                              : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                          }`}
                        >
                          Enhanced
                        </button>
                      </div>
                    </div>
                  </div>

                  {showSettings && (
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
                  )}
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

                {/* Transcribe Button */}
                <button
                  onClick={handleUpload}
                  disabled={uploading || selectedFiles.length === 0}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/50 rounded-lg text-white font-medium transition-colors flex items-center justify-center"
                >
                  {uploading ? (
                    <>
                      <div className="spinner w-4 h-4 mr-2"></div>
                      <span>Transcribing...</span>
                    </>
                  ) : (
                    <>
                      <FiPlay className="w-4 h-4 mr-2" />
                      <span>Start Transcription</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Upload Progress */}
            {uploading && selectedFiles.length > 0 && (
              <div className="max-w-2xl mx-auto mt-8">
                <div className="progress-bar h-4 rounded-full bg-white/10 mb-2">
                  <div 
                    className="progress-fill h-full rounded-full transition-all duration-300 bg-blue-600"
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
