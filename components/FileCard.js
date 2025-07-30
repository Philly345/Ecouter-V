import { FiFile, FiDownload, FiTrash2, FiClock, FiUser, FiFileText, FiExternalLink } from 'react-icons/fi';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
const FileCard = ({ 
  file, 
  onDelete, 
  onDownload,
  onExport,
  showActions = true 
}) => {
  const router = useRouter();
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  
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
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'processing':
        return 'text-yellow-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'processing':
        return <div className="spinner w-4 h-4"></div>;
      default:
        return <FiFile className="w-4 h-4" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  return (
    <div className="file-card p-4 rounded-lg">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className={`${getStatusColor(file.status)}`}>
            <FiFile className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-white truncate">
              {file.name}
            </h3>
            <p className="text-xs text-white/60">
              {formatTimeAgo(file.createdAt)}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {showActions && file.status === 'completed' && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => router.push(`/files/${file.id}`)}
              className="p-1 text-white/60 hover:text-white transition-colors"
              title="View full transcript"
            >
              <FiExternalLink className="w-4 h-4" />
            </button>
            
            {/* Export Dropdown */}
            {(onDownload || onExport) && (
              <div className="relative export-dropdown">
                <button
                  onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                  className="p-1 text-white/60 hover:text-white transition-colors"
                  title="Export transcript"
                >
                  <FiDownload className="w-4 h-4" />
                </button>
                
                {exportDropdownOpen && (
                  <div className="absolute right-0 mt-1 w-44 bg-black border border-white/20 rounded-lg shadow-lg z-50">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setExportDropdownOpen(false);
                          if (onDownload) onDownload(file);
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-white/10 flex items-center"
                      >
                        <FiFileText className="w-3 h-3 mr-2" />
                        Export as TXT
                      </button>
                      {onExport && (
                        <>
                          <button
                            onClick={() => {
                              setExportDropdownOpen(false);
                              onExport(file, 'pdf');
                            }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-white/10 flex items-center"
                          >
                            <FiFileText className="w-3 h-3 mr-2" />
                            Export as PDF
                          </button>
                          <button
                            onClick={() => {
                              setExportDropdownOpen(false);
                              onExport(file, 'docx');
                            }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-white/10 flex items-center"
                          >
                            <FiFileText className="w-3 h-3 mr-2" />
                            Export as DOCX
                          </button>
                          <hr className="border-white/10 my-1" />
                          <button
                            onClick={() => {
                              setExportDropdownOpen(false);
                              onExport(file, 'notion');
                            }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-white/10 flex items-center"
                          >
                            <FiExternalLink className="w-3 h-3 mr-2" />
                            Export to Notion
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {onDelete && (
              <button
                onClick={() => onDelete(file.id)}
                className="p-1 text-white/60 hover:text-red-400 transition-colors"
                title="Delete file"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* File Details */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-white/60">
          <span className="flex items-center space-x-1">
            <FiFile className="w-3 h-3" />
            <span>{formatFileSize(file.size)}</span>
          </span>
          {file.duration && (
            <span className="flex items-center space-x-1">
              <FiClock className="w-3 h-3" />
              <span>{formatDuration(file.duration)}</span>
            </span>
          )}
        </div>

        <div className="text-xs text-white/60">
          {formatDate(file.createdAt)}
        </div>

        {/* Transcript Preview */}
        {file.transcript && (
          <div className="mt-3 p-2 bg-white/5 rounded border border-white/10">
            <div className="flex items-center space-x-2 mb-1">
              <FiFileText className="w-3 h-3 text-white/60" />
              <span className="text-xs text-white/60">Transcript Preview</span>
            </div>
            <p className="text-xs text-white/80 line-clamp-3">
              {file.transcript}
            </p>
          </div>
        )}

        {/* Summary */}
        {file.status === 'completed' && (
          <div className="mt-2 p-2 bg-blue-500/10 rounded border border-blue-500/20">
            <div className="flex items-center space-x-2 mb-1">
              <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
              <span className="text-xs text-blue-300">AI Summary</span>
            </div>
            <p className="text-xs text-white/80">
              {file.summary && file.summary !== 'Summary not available' && file.summary !== 'Summary generation failed'
                ? file.summary
                : "This transcript contains audio content that has been transcribed. View the full transcript for more details."}
            </p>
            {/* Topics */}
            <div className="mt-1 flex flex-wrap gap-1">
              {file.topics && Array.isArray(file.topics) ? (
                file.topics.map((topic, index) => (
                  <span key={index} className="inline-block px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                    {topic}
                  </span>
                ))
              ) : file.topic && file.topic !== 'General' ? (
                <span className="inline-block px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                  {file.topic}
                </span>
              ) : null}
            </div>
            
            {/* Insights */}
            {file.insights && file.insights !== 'No insights available' && (
              <div className="mt-2 text-xs text-white/70">
                <span className="text-blue-300">Key Insight:</span> {file.insights}
              </div>
            )}
          </div>
        )}

        {/* Speakers */}
        {file.speakers && file.speakers.length > 0 && (
          <div className="mt-2">
            <div className="flex items-center space-x-2 mb-1">
              <FiUser className="w-3 h-3 text-white/60" />
              <span className="text-xs text-white/60">Speakers ({file.speakers.length})</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {file.speakers.map((speaker, index) => (
                <span
                  key={index}
                  className="inline-block px-2 py-0.5 bg-white/10 text-white/80 text-xs rounded-full"
                >
                  {speaker}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {file.status === 'error' && file.error && (
          <div className="mt-2 p-2 bg-red-500/10 rounded border border-red-500/20">
            <p className="text-xs text-red-300">{file.error}</p>
          </div>
        )}
        
        {/* View Full Button */}
        {file.status === 'completed' && (
          <div className="mt-3">
            <button
              onClick={() => router.push(`/files/${file.id}`)}
              className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs flex items-center justify-center space-x-2 transition-all"
            >
              <FiExternalLink className="w-3 h-3" />
              <span>View Full Transcript</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileCard;
