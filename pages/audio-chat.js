import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FiSend, FiFile, FiMessageSquare, FiChevronDown, FiUser, FiCpu, FiUpload, FiPlay, FiX, FiClock, FiMic, FiVolume2, FiCheck } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import { getAuthHeader } from '../utils/auth';
import { useDropzone } from 'react-dropzone';

export default function AudioChat() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showFileSelector, setShowFileSelector] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  // New states for file upload
  const [selectedUploadFiles, setSelectedUploadFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [processingEstimate, setProcessingEstimate] = useState('~1 min');
  
  // Fetch user's audio files on page load
  useEffect(() => {
    fetchUserFiles();
  }, []);

  // Scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when file is selected
  useEffect(() => {
    if (selectedFile && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedFile]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFileSelector && !event.target.closest('.file-selector')) {
        setShowFileSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFileSelector]);

  // Auto-resize textarea
  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    
    // Reset height and set to scrollHeight
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchUserFiles = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/files/completed', {
        headers: getAuthHeader()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Only show files with transcripts
      const filesWithTranscripts = data.files.filter(file => 
        file.transcript && file.transcript.length > 0
      );
      
      setFiles(filesWithTranscripts);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching files:', error);
      setIsLoading(false);
      toast.error('Failed to load your audio files');
    }
  };

  const handleFileSelect = async (fileId) => {
    if (fileId === selectedFile) return;
    
    setSelectedFile(fileId);
    setMessages([]);
    setShowFileSelector(false);
    
    const selectedFileObj = files.find(f => f.id === fileId);
    if (selectedFileObj) {
      // Add welcome message
      setMessages([
        {
          role: 'assistant',
          content: `Hi! I'm ready to discuss "${selectedFileObj.name}" with you. What would you like to know about this audio file?`
        }
      ]);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedFile) return;
    
    const newUserMessage = {
      role: 'user',
      content: inputMessage
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    setInputMessage('');
    setIsProcessing(true);
    
    try {
      const selectedFileObj = files.find(f => f.id === selectedFile);
      
      const response = await fetch('/api/chat/audio-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          fileId: selectedFile,
          message: inputMessage,
          conversation: messages.filter(m => m.role !== 'system'),
          transcript: selectedFileObj.transcript
        })
      });
      
      if (!response.ok) {
        const errorResponse = await response.json().catch(() => null);
        const error = new Error(`HTTP error! status: ${response.status}`);
        error.response = response;
        error.responseData = errorResponse;
        throw error;
      }
      
      const data = await response.json();
      
      const assistantMessage = {
        role: 'assistant',
        content: data.reply || "I'm sorry, I couldn't process that request."
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      
      let errorMessage = "I'm sorry, I encountered an error processing your message. Please try again.";
      
      // Try to extract more detailed error information if available
      try {
        if (error.message.includes('HTTP error')) {
          const responseText = await error.response?.text();
          if (responseText) {
            const errorData = JSON.parse(responseText);
            if (errorData.error && typeof errorData.error === 'string') {
              errorMessage = `Error: ${errorData.error}`;
            }
            if (errorData.details) {
              console.error('Error details:', errorData.details);
            }
          }
        }
      } catch (parseError) {
        console.error('Error parsing error response:', parseError);
      }
      
      toast.error('Failed to process your message');
      
      // Add error message to the chat
      const errorResponseMessage = {
        role: 'assistant',
        content: errorMessage
      };
      setMessages(prev => [...prev, errorResponseMessage]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle file drop for upload
  const onDrop = useCallback(acceptedFiles => {
    // Validate file size (max 500MB)
    const validFiles = acceptedFiles.filter(file => file.size <= 500 * 1024 * 1024);
    
    if (validFiles.length < acceptedFiles.length) {
      toast.error('Some files exceeded the 500MB limit and were removed');
    }
    
    setSelectedUploadFiles(validFiles);
    
    // Set processing estimate based on file size
    if (validFiles.length > 0) {
      const totalSize = validFiles.reduce((sum, file) => sum + file.size, 0);
      const minutes = Math.max(1, Math.ceil(totalSize / (1024 * 1024) / 2));
      setProcessingEstimate(minutes === 1 ? '~1 min' : `~${minutes} mins`);
    }
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'audio/*': [],
      'video/*': []
    }
  });
  
  // Format file size (KB, MB, GB)
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };
  
  // Calculate estimated audio length based on file size
  const calculateAudioLength = (bytes) => {
    // Rough estimate: ~1MB per minute for medium quality audio
    const minutes = Math.max(1, Math.round(bytes / (1024 * 1024)));
    if (minutes < 60) {
      return `~${minutes} min${minutes !== 1 ? 's' : ''}`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMins = minutes % 60;
      return `~${hours} hr${hours !== 1 ? 's' : ''}${remainingMins > 0 ? ` ${remainingMins} min${remainingMins !== 1 ? 's' : ''}` : ''}`;
    }
  };
  
  // Get upload method based on file size
  const getUploadMethod = (bytes) => {
    return bytes < 4 * 1024 * 1024 ? 'Standard Upload' : 'Direct Upload';
  };
  
  // Get color for upload method display
  const getUploadMethodColor = (bytes) => {
    return bytes < 4 * 1024 * 1024 ? 'text-green-400' : 'text-blue-400';
  };
  
  // Handle file upload
  const handleUpload = async () => {
    if (selectedUploadFiles.length === 0 || uploading) return;
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Process each file
      for (let i = 0; i < selectedUploadFiles.length; i++) {
        const file = selectedUploadFiles[i];
        const progressStart = (i / selectedUploadFiles.length) * 100;
        const progressEnd = ((i + 1) / selectedUploadFiles.length) * 100;
        
        // Determine upload method based on file size
        if (file.size > 4 * 1024 * 1024) {
          // Large file upload (>4MB): Use presigned URL method
          await handleLargeFileUpload(file, progressStart, progressEnd);
        } else {
          // Small file upload (<4MB): Use direct upload to API
          await handleSmallFileUpload(file, progressStart, progressEnd);
        }
      }
      
      // Success
      toast.success('Files uploaded successfully!');
      setShowUploadModal(false);
      setSelectedUploadFiles([]);
      setUploadProgress(0);
      
      // Refresh file list
      fetchUserFiles();
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed: ' + (error.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };
  
  // Handle large file upload (>4MB) using presigned URL
  const handleLargeFileUpload = async (file, progressStart, progressEnd) => {
    // Step 1: Get presigned URL from server
    const authHeader = getAuthHeader();
    const presignedUrlResponse = await fetch('/api/upload/presigned-url', {
      method: 'POST',
      headers: {
        ...authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      })
    });
    
    if (!presignedUrlResponse.ok) {
      const error = await presignedUrlResponse.text();
      throw new Error(`Failed to get presigned URL: ${error}`);
    }
    
    const { url, fields, key } = await presignedUrlResponse.json();
    
    // Step 2: Upload file directly to R2 using presigned URL
    const formData = new FormData();
    Object.entries(fields).forEach(([fieldName, fieldValue]) => {
      formData.append(fieldName, fieldValue);
    });
    formData.append('file', file);
    
    // Track upload progress
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percentComplete = ((event.loaded / event.total) * (progressEnd - progressStart - 10)) + progressStart;
        setUploadProgress(Math.min(percentComplete, progressEnd - 10));
      }
    });
    
    // Upload to R2
    await new Promise((resolve, reject) => {
      xhr.open('POST', url, true);
      xhr.onload = () => {
        if (xhr.status === 204) {
          resolve();
        } else {
          reject(new Error(`R2 upload failed with status ${xhr.status}`));
        }
      };
      xhr.onerror = () => reject(new Error('Network error during R2 upload'));
      xhr.send(formData);
    });
    
    // Step 3: Confirm upload to server
    setUploadProgress(progressEnd - 5);
    const confirmResponse = await fetch('/api/upload/confirm', {
      method: 'POST',
      headers: {
        ...authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        key: key,
        // Add transcription settings
        settings: {
          language: 'en',
          quality: 'high',
          speaker_detection: true,
          timestamps: true,
          profanity_filter: false,
          auto_punctuation: true
        }
      })
    });
    
    if (!confirmResponse.ok) {
      const error = await confirmResponse.text();
      throw new Error(`Failed to confirm upload: ${error}`);
    }
    
    setUploadProgress(progressEnd);
  };
  
  // Handle small file upload (<4MB) directly to API
  const handleSmallFileUpload = async (file, progressStart, progressEnd) => {
    const authHeader = getAuthHeader();
    const formData = new FormData();
    formData.append('file', file);
    
    // Add transcription settings
    formData.append('language', 'en');
    formData.append('quality', 'high');
    formData.append('speaker_detection', 'true');
    formData.append('timestamps', 'true');
    formData.append('profanity_filter', 'false');
    formData.append('auto_punctuation', 'true');
    
    // Track upload progress
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percentComplete = ((event.loaded / event.total) * (progressEnd - progressStart - 10)) + progressStart;
        setUploadProgress(Math.min(percentComplete, progressEnd - 10));
      }
    });
    
    // Upload to API
    await new Promise((resolve, reject) => {
      xhr.open('POST', '/api/transcribe', true);
      Object.entries(authHeader).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`));
        }
      };
      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.send(formData);
    });
    
    setUploadProgress(progressEnd);
  };

  return (
    <Layout currentPage="audio-chat">
      <Head>
        <title>Chat with Audio | Ecouter</title>
        <meta name="description" content="Chat with your audio files using AI" />
      </Head>
      
      <div className="min-h-screen bg-black">
        {/* Main Content */}
        <div className="flex-1 flex flex-col h-screen">
          {!selectedFile ? (
            /* Welcome Screen - Dashboard Style */
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-2xl">
                {/* Header Section */}
                <div className="mb-12">
                  <div className="w-16 h-16 bg-gray-800 border border-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <FiMessageSquare className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold text-white mb-4">
                    Chat with Your Audio Files
                  </h1>
                  <p className="text-sm text-white/60 leading-relaxed">
                    Select an audio file to start an intelligent conversation about its content.
                    Ask questions, get summaries, or explore insights from your transcriptions.
                  </p>
                </div>

                {/* File Selection Card */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-white">Your Audio Files</h2>
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="flex items-center space-x-1 px-2 py-1 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-600 transition-all duration-200"
                    >
                      <FiUpload className="w-3 h-3" />
                      <span className="text-xs font-medium">Upload</span>
                    </button>
                  </div>
                  
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
                      <span className="ml-3 text-white/60">Loading your files...</span>
                    </div>
                  ) : files.length === 0 ? (
                    <div className="text-center py-12">
                      <FiFile className="w-12 h-12 text-white/20 mx-auto mb-4" />
                      <p className="text-white/60 mb-6">
                        No audio files found. Upload and process audio files to start chatting.
                      </p>
                      <button
                        onClick={() => setShowUploadModal(true)}
                        className="inline-flex items-center space-x-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-600 transition-all duration-200 shadow-lg"
                      >
                        <FiUpload className="w-3 h-3" />
                        <span className="text-sm">Upload Your First File</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid gap-3 max-h-64 overflow-y-auto">
                      {files.map((file) => (
                        <button
                          key={file.id}
                          onClick={() => handleFileSelect(file.id)}
                          className="group flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-gray-500/30 rounded-xl transition-all duration-200"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gray-800 border border-gray-600 rounded-xl flex items-center justify-center">
                              <FiVolume2 className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-left">
                              <p className="text-white text-sm font-medium group-hover:text-gray-300 transition-colors truncate max-w-xs">
                                {file.name}
                              </p>
                              <p className="text-xs text-white/50">
                                {formatFileSize(file.size)} • {calculateAudioLength(file.size)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-full border border-gray-600">
                              Ready
                            </span>
                            <FiPlay className="w-4 h-4 text-white/40 group-hover:text-gray-300 transition-colors" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                    <div className="w-8 h-8 bg-gray-800 border border-gray-600 rounded-lg flex items-center justify-center mb-4">
                      <FiMessageSquare className="w-4 h-4 text-gray-300" />
                    </div>
                    <h3 className="text-white text-sm font-semibold mb-2">Ask Questions</h3>
                    <p className="text-xs text-white/60">Get instant answers about your audio content</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                    <div className="w-8 h-8 bg-gray-800 border border-gray-600 rounded-lg flex items-center justify-center mb-4">
                      <FiCpu className="w-4 h-4 text-gray-300" />
                    </div>
                    <h3 className="text-white text-sm font-semibold mb-2">AI Insights</h3>
                    <p className="text-xs text-white/60">Discover key themes and insights automatically</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                    <div className="w-8 h-8 bg-gray-800 border border-gray-600 rounded-lg flex items-center justify-center mb-4">
                      <FiCheck className="w-4 h-4 text-gray-300" />
                    </div>
                    <h3 className="text-white text-sm font-semibold mb-2">Smart Summaries</h3>
                    <p className="text-xs text-white/60">Get concise summaries of long recordings</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="bg-black/50 backdrop-blur-sm border-b border-white/10 px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-gray-800 border border-gray-600 rounded-xl flex items-center justify-center">
                      <FiVolume2 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h1 className="text-sm font-semibold text-white">
                        {files.find(f => f.id === selectedFile)?.name || 'Audio File'}
                      </h1>
                      <p className="text-xs text-white/60">AI Chat Session • Beta</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="flex items-center space-x-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white rounded-lg border border-white/10 transition-all duration-200"
                    >
                      <FiUpload className="w-3 h-3" />
                      <span className="text-xs">Upload</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setSelectedFile('');
                        setMessages([]);
                      }}
                      className="flex items-center space-x-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white rounded-lg border border-white/10 transition-all duration-200"
                    >
                      <FiX className="w-3 h-3" />
                      <span className="text-xs">Close Chat</span>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Chat Messages */}
              <div className="flex-1 overflow-hidden bg-gradient-to-b from-black to-gray-900">
                <div className="h-full overflow-y-auto px-6 py-8">
                  <div className="max-w-4xl mx-auto space-y-6">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex items-start space-x-4 ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {message.role === 'assistant' && (
                          <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gray-800 border border-gray-600 flex items-center justify-center shadow-lg">
                            <FiCpu className="w-4 h-4 text-white" />
                          </div>
                        )}
                        
                        <div className={`max-w-lg lg:max-w-xl ${
                          message.role === 'user' ? 'order-1' : ''
                        }`}>
                          <div className={`px-4 py-3 rounded-2xl shadow-lg backdrop-blur-sm ${
                            message.role === 'user'
                              ? 'bg-gray-800 border border-gray-600 text-white'
                              : 'bg-white/10 border border-white/20 text-white'
                          }`}>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {message.content}
                            </p>
                          </div>
                        </div>

                        {message.role === 'user' && (
                          <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gray-800 border border-gray-600 flex items-center justify-center order-2 shadow-lg">
                            <FiUser className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {/* Typing Indicator */}
                    {isProcessing && (
                      <div className="flex items-start space-x-4 justify-start">
                        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gray-800 border border-gray-600 flex items-center justify-center shadow-lg">
                          <FiCpu className="w-4 h-4 text-white" />
                        </div>
                        <div className="max-w-lg lg:max-w-xl">
                          <div className="bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-3 rounded-2xl shadow-lg">
                            <div className="flex items-center space-x-2">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              </div>
                              <span className="text-xs text-white/60 ml-2">AI is thinking...</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef}></div>
                  </div>
                </div>
              </div>
              
              {/* Input Area */}
              <div className="flex-shrink-0 bg-black/50 backdrop-blur-sm border-t border-white/10 px-6 py-6">
                <div className="max-w-4xl mx-auto">
                  <div className="relative">
                    <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl">
                      {/* Input field */}
                      <div className="flex-1 relative px-6">
                        <textarea
                          ref={inputRef}
                          rows={1}
                          placeholder="Ask anything about this audio file..."
                          value={inputMessage}
                          onChange={handleInputChange}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          disabled={isProcessing}
                          className="w-full resize-none bg-transparent py-3 text-white placeholder-white/50 focus:outline-none disabled:opacity-50 text-sm"
                          style={{ minHeight: '24px', maxHeight: '200px' }}
                        />
                      </div>
                      
                      {/* Send button */}
                      <div className="pr-4">
                        <button
                          onClick={handleSendMessage}
                          disabled={!inputMessage.trim() || isProcessing}
                          className={`p-2 rounded-xl transition-all duration-200 ${
                            !inputMessage.trim() || isProcessing
                              ? "text-white/30 cursor-not-allowed"
                              : "text-white bg-gray-800 hover:bg-gray-700 border border-gray-600 shadow-lg"
                          }`}
                          aria-label="Send message"
                        >
                          <FiSend className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
