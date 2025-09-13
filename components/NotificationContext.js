import React, { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Mock notifications data - in a real app, this would come from an API
  useEffect(() => {
    const mockNotifications = [
      {
        id: 1,
        type: 'feature',
        title: '🎉 Enhanced Speaker Diarization Now Available!',
        message: 'We\'ve significantly improved our speaker identification technology! Experience better accuracy in distinguishing between different speakers in your audio files. Perfect for meetings, interviews, and multi-speaker content.',
        timestamp: new Date(Date.now() - 60000 * 5), // 5 minutes ago
        read: false,
        icon: 'FiUser',
        action: { text: 'Try It Now', link: '/upload' },
        priority: 'high'
      },
      {
        id: 2,
        type: 'system',
        title: 'Welcome to Ecouter!',
        message: 'Your transcription service is ready to use. Upload your first audio file to get started.',
        timestamp: new Date(Date.now() - 60000 * 30), // 30 minutes ago
        read: false,
        icon: 'FiUser',
        action: { text: 'Get Started', link: '/upload' }
      },
      {
        id: 3,
        type: 'feature',
        title: 'New Analytics Features Available',
        message: 'Check out the new word cloud, speaker analysis, and sentiment tracking in your transcripts.',
        timestamp: new Date(Date.now() - 60000 * 60 * 2), // 2 hours ago
        read: false,
        icon: 'FiBell',
        action: { text: 'Explore', link: '/files' }
      },
      {
        id: 4,
        type: 'security',
        title: 'Security Update',
        message: 'We\'ve enhanced our security measures. Your data is now even more protected.',
        timestamp: new Date(Date.now() - 60000 * 60 * 24), // 1 day ago
        read: true,
        icon: 'FiSettings',
        action: null
      },
      {
        id: 5,
        type: 'tip',
        title: 'Pro Tip: Bulk Operations',
        message: 'Did you know you can select multiple files and export them all at once? Try it out!',
        timestamp: new Date(Date.now() - 60000 * 60 * 24 * 2), // 2 days ago
        read: true,
        icon: 'FiMail',
        action: { text: 'Learn More', link: '/help' }
      }
    ];
    
    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.read).length);
  }, []);

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  const deleteNotification = (notificationId) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      const newNotifications = prev.filter(n => n.id !== notificationId);
      
      if (notification && !notification.read) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      
      return newNotifications;
    });
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    setNotifications,
    setUnreadCount
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;