// Real-time update utilities for dashboard
export class DashboardEventManager {
  constructor() {
    this.listeners = new Map();
    this.lastUpdate = null;
  }

  // Subscribe to dashboard events
  subscribe(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(eventType);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  // Emit dashboard events
  emit(eventType, data) {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in dashboard event callback:', error);
        }
      });
    }
  }

  // Update last activity timestamp
  updateLastActivity() {
    this.lastUpdate = new Date();
    this.emit('activity-update', { timestamp: this.lastUpdate });
  }

  // Check for new activity (polling helper)
  async checkForUpdates(lastKnownUpdate = null) {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;

      const response = await fetch('/api/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'If-Modified-Since': lastKnownUpdate || ''
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Check if data is newer than last known update
        if (!lastKnownUpdate || new Date(data.timestamp) > new Date(lastKnownUpdate)) {
          this.emit('data-update', data);
          return data;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error checking for updates:', error);
      return null;
    }
  }

  // Start polling for updates
  startPolling(interval = 30000) {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    this.pollingInterval = setInterval(() => {
      this.checkForUpdates(this.lastUpdate?.toISOString());
    }, interval);

    return () => this.stopPolling();
  }

  // Stop polling
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  // Cleanup
  destroy() {
    this.stopPolling();
    this.listeners.clear();
  }
}

// Singleton instance
let dashboardEventManager = null;

export function getDashboardEventManager() {
  if (!dashboardEventManager) {
    dashboardEventManager = new DashboardEventManager();
  }
  return dashboardEventManager;
}

// Event types
export const DASHBOARD_EVENTS = {
  FILE_UPLOADED: 'file-uploaded',
  FILE_COMPLETED: 'file-completed',
  FILE_PROCESSING: 'file-processing',
  FILE_ERROR: 'file-error',
  DATA_UPDATE: 'data-update',
  ACTIVITY_UPDATE: 'activity-update'
};

// Helper function to format time ago
export function timeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);

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
}

// Helper function to determine if activity is recent (within 5 minutes)
export function isRecentActivity(timestamp) {
  const now = new Date();
  const activityTime = new Date(timestamp);
  return (now - activityTime) < 300000; // 5 minutes in milliseconds
}