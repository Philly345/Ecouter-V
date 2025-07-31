import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FiSend, FiFile, FiMessageSquare, FiChevronDown, FiUser, FiCpu, FiUpload, FiPlay, FiX, FiClock } from 'react-icons/fi';
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
    <Layout>
      <Head>
        <title>Chat with Audio | Kilo</title>
      </Head>
      
      <div className="flex flex-col h-screen bg-black">
        {/* Header */}
        <div className="flex-shrink-0 bg-black border-b border-gray-700">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-white">Chat with Audio Files</h1>
              
              <div className="flex space-x-2">
                {/* Upload Button */}
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors text-white"
                >
                  <FiUpload className="w-4 h-4" />
                  <span className="text-sm">Upload Audio</span>
                </button>
                
                {/* File Selector */}
                <button
                  onClick={() => setShowFileSelector(!showFileSelector)}
                  className="relative file-selector flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors text-white border border-gray-600"
                >
                  <FiFile className="w-4 h-4" />
                  <span className="text-sm">
                    {selectedFile ? files.find(f => f.id === selectedFile)?.name || 'Select Audio File' : 'Select Audio File'}
                  </span>
                  <FiChevronDown className={`w-4 h-4 transition-transform ${showFileSelector ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Dropdown */}
                {showFileSelector && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-gray-800 border border-gray-600 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
                    {isLoading ? (
                      <div className="p-4 text-center">
                        <div className="animate-spin w-6 h-6 border-2 border-gray-500 border-t-transparent rounded-full mx-auto"></div>
                        <p className="mt-2 text-sm text-gray-400">Loading files...</p>
                      </div>
                    ) : files.length === 0 ? (
                      <div className="p-4 text-center">
                        <p className="text-sm text-gray-400">
                          No audio files found. Upload and process audio files to chat with them.
                        </p>
                      </div>
                    ) : (
                      <div className="py-2">
                        {files.map(file => (
                          <button
                            key={file.id}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-700 ${
                              selectedFile === file.id ? "bg-gray-700" : ""
                            }`}
                            onClick={() => handleFileSelect(file.id)}
                          >
                            <div className="flex items-center space-x-3">
                              <FiFile className="w-4 h-4 text-gray-400" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{file.name}</p>
                                <p className="text-xs text-gray-400">
                                  {new Date(file.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {!selectedFile ? (
            /* Welcome Screen */
            <div className="flex-1 flex items-center justify-center bg-black">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiMessageSquare className="w-8 h-8 text-gray-400" />
                </div>
                <h2 className="text-2xl font-semibold text-white mb-2">
                  Chat with Your Audio Files
                </h2>
                <p className="text-gray-400 mb-6">
                  Select an audio file from the dropdown above to start a conversation about its content.
                </p>
                <button
                  onClick={() => setShowFileSelector(true)}
                  className="inline-flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors border border-gray-600"
                >
                  <FiFile className="w-4 h-4 mr-2" />
                  Choose Audio File
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto bg-black">
                <div className="max-w-4xl mx-auto px-4 py-6">
                  <div className="space-y-4">
                    {messages.filter(m => m.role !== 'system').map((message, index) => (
                      <div
                        key={index}
                        className={`flex items-start space-x-4 ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {message.role === 'assistant' && (
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center">
                            <FiCpu className="w-4 h-4 text-white" />
                          </div>
                        )}
                        
                        {/* Message Content */}
                        <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${
                          message.role === 'user' ? 'order-1' : 'order-2'
                        }`}>
                          <div className={`px-4 py-3 rounded-2xl ${
                            message.role === 'user'
                              ? 'bg-gray-700 text-white ml-auto'
                              : 'bg-gray-800 text-white'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                        </div>

                        {message.role === 'user' && (
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center order-2">
                            <FiUser className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {/* Typing Indicator */}
                    {isProcessing && (
                      <div className="flex items-start space-x-4 justify-start">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center">
                          <FiCpu className="w-4 h-4 text-white" />
                        </div>
                        <div className="max-w-xs lg:max-w-md xl:max-w-lg">
                          <div className="bg-gray-800 px-4 py-3 rounded-2xl">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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
              <div className="flex-shrink-0 bg-black px-4 py-6">
                <div className="max-w-3xl mx-auto">
                  <div className="relative">
                    <div className="flex items-center bg-gray-800 rounded-3xl border border-gray-600 shadow-lg">
                      {/* Input field */}
                      <div className="flex-1 relative px-4">
                        <textarea
                          ref={inputRef}
                          rows={1}
                          placeholder="Ask anything"
                          value={inputMessage}
                          onChange={handleInputChange}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          disabled={isProcessing}
                          className="w-full resize-none bg-transparent py-3 text-white placeholder-gray-400 focus:outline-none disabled:opacity-50 text-base"
                          style={{ minHeight: '24px', maxHeight: '200px' }}
                        />
                      </div>
                      
                      {/* Send button */}
                      <div className="pr-4">
                        <button
                          onClick={handleSendMessage}
                          disabled={!inputMessage.trim() || isProcessing}
                          className={`p-2 rounded-full transition-colors ${
                            !inputMessage.trim() || isProcessing
                              ? "text-gray-500 cursor-not-allowed"
                              : "text-white bg-white/10 hover:bg-white/20"
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
