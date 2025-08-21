import Head from 'next/head';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../components/AuthContext';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import T from '../components/T';
import { FiUpload, FiFileText, FiUsers, FiUser, FiPlay, FiDownload, FiLoader, FiX, FiCheck, FiCopy } from 'react-icons/fi';

export default function PDFDialogue() {
  const { user, logout, loading: authLoading, authChecked } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef();
  
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState('dialogue');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (authChecked && !user) {
      router.push('/login');
    }
  }, [user, router, authChecked]);

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

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Please select a PDF file.');
        return;
      }
      if (selectedFile.size > 50 * 1024 * 1024) {
        setError('File size must be less than 50MB.');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setProgress('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a PDF file first.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgress('Processing PDF...');

    try {
      const authToken = localStorage.getItem('token');
      
      if (!authToken) {
        throw new Error('No authentication token available. Please log in again.');
      }
      
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('mode', mode);

      const response = await fetch('/api/pdf-dialogue/process', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Processing failed');
      }

      const data = await response.json();
      setResult(data);
      setProgress('Completed!');
    } catch (error) {
      console.error('Processing error:', error);
      setError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <>
      <Head>
        <title><T>PDF to Dialogue</T> | Ecouter</title>
      </Head>

      <div className="min-h-screen flex bg-black text-white">
        <Sidebar 
          currentPage="pdf-dialogue" 
          user={user}
          onLogout={logout}
          onSidebarToggle={(collapsed) => setSidebarCollapsed(collapsed)}
        />
        
        <div className={`flex-1 px-4 py-8 overflow-auto transition-all duration-300 ${sidebarCollapsed ? 'ml-0 lg:ml-16' : 'ml-0 lg:ml-64'}`}>
          <div className="max-w-5xl mx-auto">
            
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold mb-2">
                  <T>PDF to Dialogue</T>
                </h1>
                <p className="text-sm text-white/60">
                  <T>Transform your PDF documents into engaging conversations or lectures</T>
                </p>
              </div>
            </div>

            {!result ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Left Column - Upload & Mode */}
                <div className="md:col-span-2 space-y-6">
                  
                  {/* Upload Section */}
                  <div className="file-card p-6">
                    <h2 className="text-base font-medium text-white mb-4">
                      <T>Upload PDF</T>
                    </h2>
                    
                    {!file ? (
                      <div 
                        className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center hover:border-white/30 transition-all cursor-pointer group"
                        onClick={() => fileInputRef.current?.click()}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            fileInputRef.current?.click();
                          }
                        }}
                      >
                        <FiUpload className="mx-auto w-12 h-12 text-white/60 mb-4 group-hover:text-white/80 transition-colors" />
                        <p className="text-sm text-white/80 mb-2">
                          <T>Click to upload your PDF file</T>
                        </p>
                        <p className="text-xs text-white/60">
                          <T>Maximum file size: 50MB</T>
                        </p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </div>
                    ) : (
                      <div className="bg-white/5 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <FiFileText className="w-8 h-8 text-white/60 mr-3" />
                            <div>
                              <p className="text-sm text-white font-medium">{file.name}</p>
                              <p className="text-xs text-white/60">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                          <button
                            onClick={handleReset}
                            className="text-xs text-white/60 hover:text-white underline transition-colors"
                          >
                            <T>Remove</T>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mode Selection */}
                  <div className="file-card p-6">
                    <h2 className="text-base font-medium text-white mb-4">
                      <T>Output Format</T>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      <button
                        onClick={() => setMode('dialogue')}
                        className={`p-6 rounded-xl border text-left transition-all ${
                          mode === 'dialogue'
                            ? 'border-white/30 bg-white/10'
                            : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
                        }`}
                      >
                        <FiUsers className="w-6 h-6 mb-3 text-white/60" />
                        <h3 className="text-white font-medium mb-2">
                          <T>Dialogue</T>
                        </h3>
                        <p className="text-white/60 text-sm mb-2">
                          <T>Conversation between a man and woman</T>
                        </p>
                        <p className="text-white/40 text-xs">
                          <T>👩 Female voice asks questions<br/>👨 Male voice provides explanations</T>
                        </p>
                      </button>
                      
                      <button
                        onClick={() => setMode('monologue')}
                        className={`p-6 rounded-xl border text-left transition-all ${
                          mode === 'monologue'
                            ? 'border-white/30 bg-white/10'
                            : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
                        }`}
                      >
                        <FiUser className="w-6 h-6 mb-3 text-white/60" />
                        <h3 className="text-white font-medium mb-2">
                          <T>Monologue</T>
                        </h3>
                        <p className="text-white/60 text-sm">
                          <T>Single speaker explaining the document</T>
                        </p>
                      </button>
                      
                    </div>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="border border-red-500/20 bg-red-500/10 rounded-xl p-4">
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  )}

                  {/* Generate Button */}
                  <div className="flex justify-center">
                    <button
                      onClick={handleUpload}
                      disabled={!file || isProcessing}
                      className={`flex items-center px-8 py-3 rounded-xl font-medium transition-all ${
                        !file || isProcessing
                          ? 'bg-white/10 text-white/50 cursor-not-allowed'
                          : 'bg-white text-black hover:bg-white/90'
                      }`}
                    >
                      {isProcessing ? (
                        <>
                          <div className="spinner w-4 h-4 mr-2"></div>
                          <T>Processing...</T>
                        </>
                      ) : (
                        <>
                          <FiPlay className="w-4 h-4 mr-2" />
                          <T>Generate {mode === 'dialogue' ? 'Dialogue' : 'Monologue'}</T>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Progress */}
                  {isProcessing && progress && (
                    <div className="text-center">
                      <p className="text-sm text-white/60">{progress}</p>
                    </div>
                  )}
                  
                </div>
                
                {/* Right Column - Info */}
                <div className="space-y-6">
                  
                  {/* Processing Info */}
                  <div className="file-card p-6">
                    <h3 className="text-base font-medium text-white mb-4">
                      <T>How it works</T>
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center mr-3 mt-0.5">
                          <span className="text-xs font-medium">1</span>
                        </div>
                        <div>
                          <p className="text-sm text-white/80">
                            <T>Upload your PDF document</T>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center mr-3 mt-0.5">
                          <span className="text-xs font-medium">2</span>
                        </div>
                        <div>
                          <p className="text-sm text-white/80">
                            <T>AI extracts and analyzes content</T>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center mr-3 mt-0.5">
                          <span className="text-xs font-medium">3</span>
                        </div>
                        <div>
                          <p className="text-sm text-white/80">
                            <T>Creates natural conversation</T>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center mr-3 mt-0.5">
                          <span className="text-xs font-medium">4</span>
                        </div>
                        <div>
                          <p className="text-sm text-white/80">
                            <T>Generates audio and transcript</T>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* File Requirements */}
                  <div className="file-card p-6">
                    <h3 className="text-base font-medium text-white mb-4">
                      <T>Requirements</T>
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <FiCheck className="w-4 h-4 text-green-400 mr-2" />
                        <span className="text-white/70">
                          <T>PDF format only</T>
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <FiCheck className="w-4 h-4 text-green-400 mr-2" />
                        <span className="text-white/70">
                          <T>Maximum 50MB file size</T>
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <FiCheck className="w-4 h-4 text-green-400 mr-2" />
                        <span className="text-white/70">
                          <T>Text-based content</T>
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <FiCheck className="w-4 h-4 text-green-400 mr-2" />
                        <span className="text-white/70">
                          <T>Processing time: 2-5 minutes</T>
                        </span>
                      </div>
                    </div>
                  </div>
                  
                </div>
                
              </div>
            ) : (
              
              /* Results Section */
              <div className="space-y-6">
                <div className="file-card p-6">
                  
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-medium text-white">
                      <T>Generated {mode === 'dialogue' ? 'Dialogue' : 'Monologue'}</T>
                    </h2>
                    <button
                      onClick={handleReset}
                      className="text-white/60 hover:text-white underline transition-colors"
                    >
                      <T>Process Another PDF</T>
                    </button>
                  </div>

                  {/* Audio Player */}
                  {result.audioUrl ? (
                    <div className="mb-6">
                      {/* Voice Information for Dialogue */}
                      {result.isDialogue && result.audioUrls && result.audioUrls.length > 0 && (
                        <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <span className="text-pink-400">👩</span>
                                <span className="text-white/70">Woman ({result.femaleSegments || 0} parts)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-blue-400">👨</span>
                                <span className="text-white/70">Man ({result.maleSegments || 0} parts)</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-white/50 text-xs">
                                {result.totalSegments || result.audioUrls.length} segments
                              </div>
                              {result.estimatedDuration && (
                                <div className="text-white/40 text-xs">
                                  ~{result.estimatedDuration} min
                                </div>
                              )}
                            </div>
                          </div>
                          {result.totalWords && (
                            <div className="mt-2 text-xs text-white/40">
                              {result.totalWords} words total
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Duration info for monologue */}
                      {!result.isDialogue && result.estimatedDuration && (
                        <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-white/70">Estimated duration: ~{result.estimatedDuration} minutes</span>
                            {result.totalWords && (
                              <span className="text-white/50 text-xs">{result.totalWords} words</span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <audio 
                        controls 
                        className="w-full mb-4 rounded bg-white/5"
                        preload="metadata"
                        key={result.audioUrl} // Force re-render when URL changes
                      >
                        <source src={result.audioUrl} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                      
                      <div className="flex gap-3 flex-wrap">
                        <a
                          href={result.audioUrl}
                          download={`${result.filename || 'dialogue'}-${mode}-${Date.now()}.mp3`}
                          className="inline-flex items-center px-4 py-2 border border-white/20 rounded-lg text-sm text-white/80 hover:bg-white/5 transition-all"
                        >
                          <FiDownload className="w-4 h-4 mr-2" />
                          <T>Download Audio</T>
                        </a>
                        
                        <button
                          onClick={() => {
                            const audio = document.querySelector('audio');
                            if (audio) {
                              if (audio.paused) {
                                audio.play();
                              } else {
                                audio.pause();
                              }
                            }
                          }}
                          className="inline-flex items-center px-4 py-2 border border-white/20 rounded-lg text-sm text-white/80 hover:bg-white/5 transition-all"
                        >
                          <FiPlay className="w-4 h-4 mr-2" />
                          <T>Play Audio</T>
                        </button>
                        
                        {/* Dialogue Segments Preview */}
                        {result.isDialogue && result.audioUrls && result.audioUrls.length > 1 && (
                          <button
                            onClick={() => {
                              // Toggle showing all audio segments
                              const segmentsDiv = document.getElementById('audio-segments');
                              if (segmentsDiv.style.display === 'none') {
                                segmentsDiv.style.display = 'block';
                              } else {
                                segmentsDiv.style.display = 'none';
                              }
                            }}
                            className="inline-flex items-center px-4 py-2 border border-white/20 rounded-lg text-sm text-white/80 hover:bg-white/5 transition-all"
                          >
                            <FiUsers className="w-4 h-4 mr-2" />
                            <T>Show All Segments</T>
                          </button>
                        )}
                      </div>
                      
                      {/* Individual Audio Segments for Dialogue */}
                      {result.isDialogue && result.audioUrls && result.audioUrls.length > 1 && (
                        <div id="audio-segments" style={{ display: 'none' }} className="mt-4 space-y-2">
                          <h4 className="text-sm font-medium text-white/80 mb-2">
                            <T>Individual Dialogue Segments:</T>
                          </h4>
                          {result.audioUrls.map((segment, index) => (
                            <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded border border-white/10">
                              <span className={`text-lg ${segment.speaker === 'A' ? 'text-pink-400' : 'text-blue-400'}`}>
                                {segment.speaker === 'A' ? '👩' : '👨'}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-white/60 mb-1">
                                  {segment.speakerName || (segment.speaker === 'A' ? 'Woman' : 'Man')}
                                </p>
                                <p className="text-sm text-white/80 truncate">
                                  {segment.text.substring(0, 60)}...
                                </p>
                              </div>
                              <audio controls className="w-48 h-8">
                                <source src={segment.audioUrl} type="audio/mpeg" />
                              </audio>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mb-6 p-4 border border-yellow-500/20 bg-yellow-500/10 rounded-xl">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-yellow-500/20 rounded-full flex items-center justify-center mt-0.5">
                          <span className="text-yellow-400 text-xs">!</span>
                        </div>
                        <div>
                          <p className="text-sm text-yellow-200 font-medium mb-2">
                            <T>Audio temporarily unavailable</T>
                          </p>
                          <p className="text-xs text-yellow-300/80 mb-3">
                            {result.message || <T>Audio generation is currently experiencing issues. You can still use the transcript below.</T>}
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                if ('speechSynthesis' in window) {
                                  const utterance = new SpeechSynthesisUtterance(result.transcript);
                                  speechSynthesis.speak(utterance);
                                } else {
                                  alert('Text-to-speech not supported in your browser');
                                }
                              }}
                              className="inline-flex items-center px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded text-xs text-yellow-200 hover:bg-yellow-500/30 transition-all"
                            >
                              <FiPlay className="w-3 h-3 mr-1" />
                              <T>Read Aloud (Browser TTS)</T>
                            </button>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(result.transcript);
                                // You could add a toast notification here
                              }}
                              className="inline-flex items-center px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded text-xs text-yellow-200 hover:bg-yellow-500/30 transition-all"
                            >
                              <FiCopy className="w-3 h-3 mr-1" />
                              <T>Copy Text</T>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Transcript */}
                  {result.transcript && (
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-medium text-white flex items-center gap-2">
                          <T>Transcript</T>
                          {mode === 'dialogue' && (
                            <span className="text-xs text-white/50 bg-white/10 px-2 py-1 rounded">
                              👩 Woman 👨 Man
                            </span>
                          )}
                        </h3>
                        <button
                          onClick={() => {
                            const element = document.createElement('a');
                            const file = new Blob([result.transcript], { type: 'text/plain' });
                            element.href = URL.createObjectURL(file);
                            element.download = `${result.filename || 'dialogue'}-${mode}-transcript.txt`;
                            document.body.appendChild(element);
                            element.click();
                            document.body.removeChild(element);
                          }}
                          className="inline-flex items-center px-3 py-1.5 border border-white/20 rounded text-xs text-white/60 hover:text-white hover:bg-white/5 transition-all"
                        >
                          <FiDownload className="w-3 h-3 mr-1" />
                          <T>Download Transcript</T>
                        </button>
                      </div>
                      <div className="border border-white/20 rounded-xl p-4 max-h-80 overflow-y-auto bg-white/5">
                        {mode === 'dialogue' ? (
                          // Enhanced dialogue display with speaker indicators
                          <div className="space-y-3">
                            {result.transcript.split('\n').filter(line => line.trim()).map((line, index) => {
                              if (line.includes('Person A:')) {
                                return (
                                  <div key={index} className="flex items-start gap-3">
                                    <span className="text-pink-400 text-lg mt-0.5">👩</span>
                                    <div className="flex-1">
                                      <p className="text-xs text-pink-300 mb-1">Woman</p>
                                      <p className="text-sm text-white/80 leading-relaxed">
                                        {line.replace('Person A:', '').trim()}
                                      </p>
                                    </div>
                                  </div>
                                );
                              } else if (line.includes('Person B:')) {
                                return (
                                  <div key={index} className="flex items-start gap-3">
                                    <span className="text-blue-400 text-lg mt-0.5">👨</span>
                                    <div className="flex-1">
                                      <p className="text-xs text-blue-300 mb-1">Man</p>
                                      <p className="text-sm text-white/80 leading-relaxed">
                                        {line.replace('Person B:', '').trim()}
                                      </p>
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })}
                          </div>
                        ) : (
                          // Standard monologue display
                          <pre className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed font-mono">
                            {result.transcript}
                          </pre>
                        )}
                      </div>
                    </div>
                  )}
                  
                </div>
              </div>
              
            )}
            
          </div>
        </div>
      </div>
    </>
  );
}