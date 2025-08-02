import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../components/AuthContext';
import { SUPPORTED_LANGUAGES } from '../utils/languages';
import Sidebar from '../components/Sidebar';
import { 
  FiVideo, 
  FiUpload, 
  FiDownload, 
  FiPlay, 
  FiPause,
  FiSettings,
  FiCheck,
  FiClock,
  FiGlobe,
  FiType,
  FiAlignLeft
} from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function VideoCaptions() {
  const router = useRouter();
  const { user, logout, authChecked, authLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Video upload and processing states
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [progress, setProgress] = useState(0);
  
  // Caption settings
  const [captionLanguage, setCaptionLanguage] = useState('en');
  const [captionStyle, setCaptionStyle] = useState({
    font: 'Arial',
    fontSize: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    textColor: '#FFFFFF',
    position: 'bottom',
    maxCharsPerLine: 37,
    maxLinesPerCaption: 2,
    minDisplayTime: 2000, // milliseconds
    maxWordsPerMinute: 180
  });
  
  // Generated captions and video
  const [captions, setCaptions] = useState([]);
  const [captionedVideoUrl, setCaptionedVideoUrl] = useState('');
  const [transcript, setTranscript] = useState('');
  const [videoId, setVideoId] = useState('');
  const [captionsVisible, setCaptionsVisible] = useState(true);
  
  // Video preview refs
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (authChecked && !user) {
      router.push('/login');
      return;
    }
  }, [user, router, authChecked]);

  const handleVideoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith('video/')) {
        setVideoFile(file);
        const url = URL.createObjectURL(file);
        setVideoUrl(url);
        setCaptionedVideoUrl(''); // Reset captioned video
        setCaptions([]);
        setTranscript('');
        setVideoId(''); // Reset video ID
      } else {
        toast.error('Please select a valid video file');
      }
    }
  };

  const generateCaptions = async () => {
    if (!videoFile) {
      toast.error('Please upload a video file first');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setProcessingStep('Uploading video...');

    try {
      // Step 1: Upload video
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('language', captionLanguage);
      formData.append('captionSettings', JSON.stringify(captionStyle));

      setProcessingStep('Extracting audio...');
      setProgress(25);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/video-captions/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to process video');
      }

      setProcessingStep('Transcribing audio...');
      setProgress(50);

      const result = await response.json();
      
      setProcessingStep('Generating captions...');
      setProgress(75);

      // Set the transcript, captions, and videoId
      setTranscript(result.transcript);
      setCaptions(result.captions);
      setVideoId(result.videoId);

      setProcessingStep('Rendering captions on video...');
      setProgress(90);

      // Generate captioned video
      const captionResponse = await fetch('/api/video-captions/render', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          videoId: result.videoId,
          captions: result.captions,
          settings: captionStyle
        })
      });

      if (!captionResponse.ok) {
        throw new Error('Failed to render captions');
      }

      const captionResult = await captionResponse.json();
      
      // Set streaming URL for video playback
      const streamingUrl = `/api/video-captions/stream/${result.videoId}?token=${encodeURIComponent(token)}`;
      setCaptionedVideoUrl(streamingUrl);
      
      setProcessingStep('Complete!');
      setProgress(100);
      
      toast.success('Captions generated successfully!');
      
    } catch (error) {
      console.error('Caption generation error:', error);
      toast.error('Failed to generate captions: ' + error.message);
    } finally {
      setIsProcessing(false);
      setProgress(0);
      setProcessingStep('');
    }
  };

  const downloadCaptionedVideo = async () => {
    if (!captions.length) {
      toast.error('No captions available for download');
      return;
    }

    try {
      // Use stored videoId
      if (!videoId) {
        toast.error('Video ID not found');
        return;
      }
      const token = localStorage.getItem('token');
      
      // Create download URL
      const downloadUrl = `/api/video-captions/download/${videoId}?token=${encodeURIComponent(token)}`;
      
      // Trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `captioned_${videoFile?.name || 'video'}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Download started!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download video');
    }
  };

  const toggleCaptions = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const tracks = video.textTracks;
      
      if (tracks.length > 0) {
        const track = tracks[0];
        if (captionsVisible) {
          track.mode = 'hidden';
          setCaptionsVisible(false);
        } else {
          track.mode = 'showing';
          setCaptionsVisible(true);
        }
      }
    }
  };

  const formatCaptionTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Video Captions - Ecouter</title>
        <meta name="description" content="Generate professional video captions with AI" />
      </Head>

      <div className="min-h-screen bg-black text-white flex">
        <Sidebar 
          user={user} 
          currentPage="video-captions" 
          onLogout={logout}
          onSidebarToggle={setSidebarCollapsed}
        />
        
        <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
          {/* Header */}
          <div className="border-b border-white/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-2">Video Captions</h1>
                <p className="text-white/60">Generate professional captions for your videos with AI transcription</p>
              </div>
              <FiVideo className="w-8 h-8 text-white/60" />
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Upload & Settings */}
              <div className="space-y-6">
                {/* Video Upload */}
                <div className="bg-black border border-white/10 rounded-xl p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center">
                    <FiUpload className="w-5 h-5 mr-2" />
                    Upload Video
                  </h2>
                  
                  <div 
                    className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center cursor-pointer hover:border-white/40 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {videoFile ? (
                      <div>
                        <FiVideo className="w-12 h-12 mx-auto mb-4 text-green-400" />
                        <p className="text-sm font-medium">{videoFile.name}</p>
                        <p className="text-xs text-white/60 mt-1">
                          {(videoFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <FiUpload className="w-12 h-12 mx-auto mb-4 text-white/60" />
                        <p className="text-sm font-medium mb-2">Click to upload video</p>
                        <p className="text-xs text-white/60">
                          Supports MP4, MOV, AVI, MKV files
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                </div>

                {/* Caption Settings */}
                <div className="bg-black border border-white/10 rounded-xl p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center">
                    <FiSettings className="w-5 h-5 mr-2" />
                    Caption Settings
                  </h2>
                  
                  <div className="space-y-4">
                    {/* Language Selection */}
                    <div>
                      <label className="block text-sm font-medium mb-2 flex items-center">
                        <FiGlobe className="w-4 h-4 mr-2" />
                        Caption Language
                      </label>
                      <select
                        value={captionLanguage}
                        onChange={(e) => setCaptionLanguage(e.target.value)}
                        className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-sm"
                      >
                        {SUPPORTED_LANGUAGES.slice(0, 20).map((lang) => (
                          <option key={lang.code} value={lang.code}>
                            {lang.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Font Settings */}
                    <div>
                      <label className="block text-sm font-medium mb-2 flex items-center">
                        <FiType className="w-4 h-4 mr-2" />
                        Font & Style
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <select
                          value={captionStyle.font}
                          onChange={(e) => setCaptionStyle({...captionStyle, font: e.target.value})}
                          className="bg-black border border-white/20 rounded-lg px-3 py-2 text-sm"
                        >
                          <option value="Arial">Arial</option>
                          <option value="Helvetica">Helvetica</option>
                          <option value="Open Sans">Open Sans</option>
                        </select>
                        <input
                          type="number"
                          value={captionStyle.fontSize}
                          onChange={(e) => setCaptionStyle({...captionStyle, fontSize: parseInt(e.target.value)})}
                          min="12"
                          max="24"
                          className="bg-black border border-white/20 rounded-lg px-3 py-2 text-sm"
                          placeholder="Font Size"
                        />
                      </div>
                    </div>

                    {/* Caption Rules Info */}
                    <div className="bg-white/5 rounded-lg p-4 text-xs">
                      <h3 className="font-medium mb-2 flex items-center">
                        <FiAlignLeft className="w-4 h-4 mr-2" />
                        Professional Caption Standards
                      </h3>
                      <ul className="space-y-1 text-white/70">
                        <li>• Max 37 characters per line, 2 lines per caption</li>
                        <li>• White sans-serif font on black background</li>
                        <li>• Max 180 words per minute reading speed</li>
                        <li>• Min 2 seconds display time per caption</li>
                        <li>• Speaker names in (parentheses)</li>
                        <li>• Sound effects in [square brackets]</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={generateCaptions}
                  disabled={!videoFile || isProcessing}
                  className="w-full py-3 px-6 bg-white text-black rounded-lg font-medium hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isProcessing ? (
                    <>
                      <FiClock className="w-4 h-4 mr-2 animate-spin" />
                      {processingStep}
                    </>
                  ) : (
                    <>
                      <FiCheck className="w-4 h-4 mr-2" />
                      Generate Captions
                    </>
                  )}
                </button>

                {/* Progress Bar */}
                {isProcessing && (
                  <div className="bg-black border border-white/10 rounded-lg p-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-white h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Preview & Results */}
              <div className="space-y-6">
                {/* Video Preview */}
                {videoUrl && (
                  <div className="bg-black border border-white/10 rounded-xl p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center">
                      <FiPlay className="w-5 h-5 mr-2" />
                      Video Preview
                    </h2>
                    <video
                      ref={videoRef}
                      src={captionedVideoUrl || videoUrl}
                      controls
                      className="w-full rounded-lg"
                      style={{ maxHeight: '300px' }}
                    >
                      Your browser does not support the video tag.
                    </video>
                    
                    {captionedVideoUrl && (
                      <div className="mt-4 flex justify-between items-center">
                        <span className="text-sm text-green-400 flex items-center">
                          <FiCheck className="w-4 h-4 mr-2" />
                          Captions Applied
                        </span>
                        <div className="flex gap-2">
                          <span className="py-2 px-4 bg-green-600 text-white rounded-lg text-sm font-medium flex items-center">
                            <span className="text-xs font-bold mr-2">CC</span>
                            BURNED-IN
                          </span>
                          <button
                            onClick={downloadCaptionedVideo}
                            className="py-2 px-4 bg-white text-black rounded-lg text-sm font-medium hover:bg-white/90 transition-colors flex items-center"
                          >
                            <FiDownload className="w-4 h-4 mr-2" />
                            Download
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Generated Captions */}
                {captions.length > 0 && (
                  <div className="bg-black border border-white/10 rounded-xl p-6">
                    <h2 className="text-lg font-semibold mb-4">Generated Captions</h2>
                    <div className="max-h-96 overflow-y-auto space-y-3">
                      {captions.map((caption, index) => (
                        <div key={index} className="bg-white/5 rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-white/60">
                              {formatCaptionTime(caption.start)} → {formatCaptionTime(caption.end)}
                            </span>
                            <span className="text-xs text-white/60">
                              {caption.duration}s
                            </span>
                          </div>
                          <div className="text-sm">
                            {caption.speaker && (
                              <span className="text-blue-400">({caption.speaker}) </span>
                            )}
                            {caption.text}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Transcript */}
                {transcript && (
                  <div className="bg-black border border-white/10 rounded-xl p-6">
                    <h2 className="text-lg font-semibold mb-4">Full Transcript</h2>
                    <div className="max-h-64 overflow-y-auto bg-white/5 rounded-lg p-4 text-sm whitespace-pre-wrap">
                      {transcript}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
