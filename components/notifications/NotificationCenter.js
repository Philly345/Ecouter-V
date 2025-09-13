import React, { useState, useEffect, useRef } from 'react';
import { FiBell, FiX, FiCheck, FiTrash2, FiMail, FiSettings, FiUser, FiCheckCircle } from 'react-icons/fi';
import { useNotifications } from '../NotificationContext';

const NotificationCenter = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  
  // Use notification context
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications
  } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return timestamp.toLocaleDateString();
  };

  const getNotificationTypeColor = (type) => {
    switch (type) {
      case 'system':
        return 'text-blue-400';
      case 'feature':
        return 'text-green-400';
      case 'security':
        return 'text-yellow-400';
      case 'tip':
        return 'text-purple-400';
      default:
        return 'text-white/60';
    }
  };

  const getNotificationTypeBg = (type) => {
    switch (type) {
      case 'system':
        return 'bg-blue-500/10 border-blue-500/20';
      case 'feature':
        return 'bg-green-500/10 border-green-500/20';
      case 'security':
        return 'bg-yellow-500/10 border-yellow-500/20';
      case 'tip':
        return 'bg-purple-500/10 border-purple-500/20';
      default:
        return 'bg-white/5 border-white/10';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-white/70 hover:text-white transition-colors rounded-lg hover:bg-white/10"
        title="Notifications"
      >
        <FiBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-96 bg-black border border-white/20 rounded-xl shadow-xl z-50 max-h-96 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-white">Notifications</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-white/60 hover:text-white transition-colors rounded"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
            {notifications.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                </span>
                <div className="flex space-x-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <FiBell className="w-12 h-12 text-white/30 mx-auto mb-3" />
                <h4 className="text-white font-medium mb-1">No notifications</h4>
                <p className="text-white/60 text-sm">You're all caught up! New notifications will appear here.</p>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {notifications.map((notification) => {
                  // Map icon string to actual icon component
                  const getIconComponent = (iconName) => {
                    switch (iconName) {
                      case 'FiUser': return FiUser;
                      case 'FiBell': return FiBell;
                      case 'FiSettings': return FiSettings;
                      case 'FiMail': return FiMail;
                      default: return FiBell;
                    }
                  };
                  
                  const IconComponent = getIconComponent(notification.icon);
                  return (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg border transition-all cursor-pointer group ${
                        notification.read 
                          ? 'bg-white/5 border-white/10 opacity-75' 
                          : getNotificationTypeBg(notification.type)
                      } hover:bg-white/10`}
                      onClick={() => !notification.read && markAsRead(notification.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${getNotificationTypeBg(notification.type)}`}>
                          <IconComponent className={`w-4 h-4 ${getNotificationTypeColor(notification.type)}`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h4 className="text-white font-medium text-sm truncate pr-2">
                              {notification.title}
                            </h4>
                            <div className="flex items-center space-x-1">
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 text-white/40 hover:text-red-400 transition-all rounded"
                              >
                                <FiTrash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          
                          <p className="text-white/70 text-sm leading-relaxed mb-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-white/50 text-xs">
                              {formatTimestamp(notification.timestamp)}
                            </span>
                            
                            {notification.action && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Handle action click - in a real app, this would navigate
                                  console.log('Action clicked:', notification.action);
                                }}
                                className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
                              >
                                {notification.action.text}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-white/10">
              <button
                onClick={() => {
                  // In a real app, this would navigate to a full notifications page
                  console.log('View all notifications');
                  setIsOpen(false);
                }}
                className="w-full text-center text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;