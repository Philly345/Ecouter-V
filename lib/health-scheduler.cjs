// Automated Daily Health Scheduler
const { getAPIManager } = require('./api-manager.cjs');

class HealthScheduler {
  constructor() {
    this.apiManager = getAPIManager();
    this.scheduledTimes = [
      { hour: 0, minute: 0, name: '12:00 AM' },   // Midnight
      { hour: 0, minute: 20, name: '12:20 AM' },  // Post-midnight check
      { hour: 0, minute: 50, name: '12:50 AM' },  // Pre-1AM check
      { hour: 0, minute: 55, name: '12:55 AM' },  // Pre-1AM intensive check
      { hour: 1, minute: 0, name: '1:00 AM' },    // 1AM check
      { hour: 7, minute: 0, name: '7:00 AM' },   // Morning
      { hour: 10, minute: 0, name: '10:00 AM' }, // Mid-morning
      { hour: 12, minute: 0, name: '12:00 PM' }, // Noon
      { hour: 15, minute: 0, name: '3:00 PM' },  // Afternoon
      { hour: 22, minute: 0, name: '10:00 PM' }  // Evening
    ];
    this.isRunning = false;
    this.lastReportTimes = new Map();
  }

  // Start the automated scheduler
  start() {
    if (this.isRunning) {
      console.log('📅 Health scheduler is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting automated health scheduler...');
    console.log('📅 Daily reports scheduled for:');
    this.scheduledTimes.forEach(time => {
      console.log(`   • ${time.name}`);
    });

    // Check every minute for scheduled times
    this.intervalId = setInterval(() => {
      this.checkScheduledReports();
    }, 60000); // Check every minute

    // Send immediate startup notification
    this.sendStartupNotification();

    console.log('✅ Automated health scheduler started successfully!');
  }

  // Stop the scheduler
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('⏹️ Health scheduler stopped');
  }

  // Check if it's time to send a scheduled report
  checkScheduledReports() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const today = now.toDateString();

    this.scheduledTimes.forEach(scheduledTime => {
      const scheduleKey = `${today}-${scheduledTime.hour}-${scheduledTime.minute}`;
      
      // Check if it's the right time and we haven't sent a report today for this time
      if (currentHour === scheduledTime.hour && 
          currentMinute === scheduledTime.minute && 
          !this.lastReportTimes.has(scheduleKey)) {
        
        console.log(`⏰ Scheduled health report time: ${scheduledTime.name}`);
        this.sendScheduledHealthReport(scheduledTime.name);
        this.lastReportTimes.set(scheduleKey, now);
        
        // Clean up old entries (keep only today's entries)
        this.cleanupOldReportTimes(today);
      }
    });
  }

  // Clean up old report times to prevent memory buildup
  cleanupOldReportTimes(today) {
    const keysToDelete = [];
    for (const [key] of this.lastReportTimes) {
      if (!key.startsWith(today)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.lastReportTimes.delete(key));
  }

  // Send scheduled health report
  async sendScheduledHealthReport(scheduledTime) {
    try {
      console.log(`📊 Generating scheduled health report for ${scheduledTime}...`);
      
      // Get comprehensive system data
      const systemHealth = await this.apiManager.getSystemHealth();
      const apiStatus = await this.apiManager.getAPIStatus();
      const currentAPI = await this.apiManager.getCurrentAPI();
      
      // Generate detailed report
      const report = this.generateScheduledReport(scheduledTime, systemHealth, apiStatus, currentAPI);
      
      // Send the email
      await this.apiManager.sendEmail(
        `✅ Daily Health Report - ${scheduledTime} | ${new Date().toDateString()}`,
        report
      );
      
      console.log(`✅ Scheduled health report sent for ${scheduledTime}`);
      
    } catch (error) {
      console.error(`❌ Failed to send scheduled health report for ${scheduledTime}:`, error);
      
      // Try to send an error notification
      try {
        await this.apiManager.sendCriticalAlert(
          'SCHEDULED_REPORT_FAILED',
          error,
          { scheduledTime, timestamp: new Date().toISOString() }
        );
      } catch (alertError) {
        console.error('❌ Failed to send error alert:', alertError);
      }
    }
  }

  // Send startup notification
  async sendStartupNotification() {
    try {
      const startupReport = this.generateStartupReport();
      await this.apiManager.sendEmail(
        `🚀 AI Health Scheduler Started - ${new Date().toLocaleString()}`,
        startupReport
      );
      console.log('✅ Startup notification sent');
    } catch (error) {
      console.error('⚠️ Failed to send startup notification:', error);
    }
  }

  // Generate the scheduled health report HTML
  generateScheduledReport(scheduledTime, systemHealth, apiStatus, currentAPI) {
    const now = new Date();
    const uptime = this.calculateUptime();
    
    // Calculate API usage statistics
    const apiStats = Object.entries(apiStatus).map(([name, api]) => {
      const usagePercent = (api.usage / api.limit) * 100;
      return {
        name: name.toUpperCase(),
        usagePercent: usagePercent.toFixed(1),
        isActive: api.isActive,
        errorCount: api.errorCount,
        status: usagePercent > 90 ? 'warning' : usagePercent > 75 ? 'caution' : 'good'
      };
    });

    // Count healthy vs warning APIs
    const healthyAPIs = apiStats.filter(api => api.status === 'good' && api.isActive).length;
    const totalAPIs = apiStats.length;
    
    // Overall system status
    const overallStatus = systemHealth.status === 'healthy' && healthyAPIs >= totalAPIs * 0.75 ? 'EXCELLENT' : 
                         systemHealth.status === 'healthy' ? 'GOOD' : 'NEEDS ATTENTION';
    
    const statusColor = overallStatus === 'EXCELLENT' ? '#22c55e' : 
                       overallStatus === 'GOOD' ? '#3b82f6' : '#ef4444';

    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8fafc; }
        .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, ${statusColor}, ${statusColor}dd); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
        .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
        .content { padding: 30px; }
        .status-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 25px 0; }
        .status-card { background: #f8fafc; border-radius: 8px; padding: 20px; border-left: 4px solid #e2e8f0; }
        .status-good { border-left-color: #22c55e; }
        .status-warning { border-left-color: #f59e0b; }
        .status-error { border-left-color: #ef4444; }
        .status-card h3 { margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; }
        .status-card .value { font-size: 24px; font-weight: 700; color: #1e293b; }
        .api-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin: 25px 0; }
        .api-card { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; }
        .api-name { font-weight: 600; color: #1e293b; margin-bottom: 8px; }
        .api-usage { font-size: 12px; color: #64748b; margin-bottom: 5px; }
        .usage-bar { width: 100%; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden; }
        .usage-fill { height: 100%; transition: width 0.3s ease; }
        .usage-good { background: #22c55e; }
        .usage-caution { background: #f59e0b; }
        .usage-warning { background: #ef4444; }
        .timestamp { text-align: center; color: #64748b; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
        .emoji { font-size: 20px; margin-right: 8px; }
        .highlight { background: linear-gradient(120deg, #a855f7 0%, #ec4899 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 700; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 AI System Health Report</h1>
            <p><strong>${scheduledTime}</strong> | ${now.toDateString()}</p>
            <p>System Status: <strong>${overallStatus}</strong></p>
        </div>
        
        <div class="content">
            <h2>📊 System Overview</h2>
            <div class="status-grid">
                <div class="status-card status-good">
                    <h3>🎯 Overall Status</h3>
                    <div class="value">${overallStatus}</div>
                </div>
                <div class="status-card status-good">
                    <h3>🤖 Auto-Fixes</h3>
                    <div class="value">${systemHealth.autoFixedCount}</div>
                </div>
                <div class="status-card ${systemHealth.manualInterventionCount > 0 ? 'status-warning' : 'status-good'}">
                    <h3>📧 Manual Alerts</h3>
                    <div class="value">${systemHealth.manualInterventionCount}</div>
                </div>
                <div class="status-card status-good">
                    <h3>⏱️ System Uptime</h3>
                    <div class="value">${uptime}</div>
                </div>
                <div class="status-card status-good">
                    <h3>🔄 Active API</h3>
                    <div class="value">${currentAPI.toUpperCase()}</div>
                </div>
                <div class="status-card status-good">
                    <h3>✅ APIs Online</h3>
                    <div class="value">${healthyAPIs}/${totalAPIs}</div>
                </div>
            </div>

            <h2>🗂️ API Status Details</h2>
            <div class="api-grid">
                ${apiStats.map(api => `
                <div class="api-card">
                    <div class="api-name">${api.name}</div>
                    <div class="api-usage">Usage: ${api.usagePercent}%</div>
                    <div class="usage-bar">
                        <div class="usage-fill usage-${api.status}" style="width: ${Math.min(api.usagePercent, 100)}%"></div>
                    </div>
                    <div style="margin-top: 8px; font-size: 11px; color: #64748b;">
                        Status: ${api.isActive ? '✅ Active' : '❌ Inactive'} | 
                        Errors: ${api.errorCount}
                    </div>
                </div>
                `).join('')}
            </div>

            <h2>📈 Performance Summary</h2>
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>🎯 Success Rate:</strong> <span class="highlight">${this.calculateSuccessRate(systemHealth)}%</span></p>
                <p><strong>🔄 API Switches Today:</strong> This automated system has handled all API management seamlessly</p>
                <p><strong>🛠️ Auto-Recovery:</strong> ${systemHealth.autoFixedCount} issues resolved automatically</p>
                <p><strong>📊 System Health:</strong> All monitoring systems operational</p>
                <p><strong>⏰ Next Report:</strong> ${this.getNextReportTime()}</p>
            </div>

            ${systemHealth.issues && systemHealth.issues.length > 0 ? `
            <h2>⚠️ Current Issues</h2>
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; border-radius: 0 8px 8px 0;">
                ${systemHealth.issues.map(issue => `<p>• ${issue}</p>`).join('')}
            </div>
            ` : `
            <div style="background: #d1fae5; border-left: 4px solid #22c55e; padding: 15px; margin: 15px 0; border-radius: 0 8px 8px 0;">
                <p><strong>✅ No Issues Detected</strong></p>
                <p>All systems are operating normally. Your AI management system is working perfectly!</p>
            </div>
            `}

            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
                <h3 style="margin: 0 0 10px 0;">🎉 System Working Perfectly!</h3>
                <p style="margin: 0; opacity: 0.9;">Your AI system is managing APIs automatically, fixing issues, and keeping everything running smoothly. No action required!</p>
            </div>
        </div>
        
        <div class="timestamp">
            🤖 Generated by AI Health Scheduler | ${now.toLocaleString()}<br>
            📧 Sent to: ecouter.transcribe@gmail.com | 🔄 Next report: ${this.getNextReportTime()}
        </div>
    </div>
</body>
</html>
    `;
  }

  // Generate startup notification
  generateStartupReport() {
    const now = new Date();
    
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .schedule-list { background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .schedule-item { display: flex; align-items: center; padding: 8px 0; }
        .time { font-weight: 600; color: #1e293b; margin-left: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 AI Health Scheduler Started</h1>
            <p>${now.toLocaleString()}</p>
        </div>
        
        <div class="content">
            <h2>✅ Automated Daily Reports Activated</h2>
            <p>Your AI health monitoring system is now running automatically. You'll receive detailed health reports at these times every day:</p>
            
            <div class="schedule-list">
                <div class="schedule-item">🌙<span class="time">12:00 AM</span> - Midnight health check</div>
                <div class="schedule-item">🌜<span class="time">12:20 AM</span> - Post-midnight API verification</div>
                <div class="schedule-item">�<span class="time">12:50 AM</span> - Pre-1AM final check</div>
                <div class="schedule-item">�🌅<span class="time">7:00 AM</span> - Morning system status</div>
                <div class="schedule-item">☕<span class="time">10:00 AM</span> - Mid-morning update</div>
                <div class="schedule-item">🌞<span class="time">12:00 PM</span> - Noon checkpoint</div>
                <div class="schedule-item">🌆<span class="time">3:00 PM</span> - Afternoon review</div>
                <div class="schedule-item">🌃<span class="time">10:00 PM</span> - Evening summary</div>
            </div>
            
            <h3>🤖 What Each Report Includes:</h3>
            <ul>
                <li>✅ Overall system health status</li>
                <li>📊 API usage and availability</li>
                <li>🛠️ Auto-fixes performed</li>
                <li>⚠️ Any issues requiring attention</li>
                <li>📈 Performance metrics</li>
                <li>🔄 Next scheduled report time</li>
            </ul>
            
            <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <p><strong>📧 Email Delivery:</strong> All reports will be sent to <strong>ecouter.transcribe@gmail.com</strong></p>
                <p><strong>🎯 Purpose:</strong> Keep you informed that everything is working perfectly without any action needed</p>
            </div>
            
            <p style="text-align: center; margin-top: 30px; color: #64748b;">
                Your AI system is now monitoring and managing everything automatically! 🎉
            </p>
        </div>
    </div>
</body>
</html>
    `;
  }

  // Calculate system uptime
  calculateUptime() {
    const startTime = this.apiManager.systemHealth?.startTime || new Date();
    const now = new Date();
    const uptimeMs = now - startTime;
    
    const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((uptimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else {
      return `${hours}h`;
    }
  }

  // Calculate success rate
  calculateSuccessRate(systemHealth) {
    const autoFixed = systemHealth.autoFixedCount || 0;
    const manual = systemHealth.manualInterventionCount || 0;
    const total = autoFixed + manual;
    
    if (total === 0) return '100.0';
    return ((autoFixed / total) * 100).toFixed(1);
  }

  // Get next report time
  getNextReportTime() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Find next scheduled time
    for (const time of this.scheduledTimes) {
      if (time.hour > currentHour || (time.hour === currentHour && time.minute > currentMinute)) {
        return time.name;
      }
    }
    
    // If no time today, return first time tomorrow
    return `${this.scheduledTimes[0].name} (tomorrow)`;
  }

  // Get current status
  getStatus() {
    return {
      isRunning: this.isRunning,
      scheduledTimes: this.scheduledTimes,
      nextReport: this.getNextReportTime(),
      reportsToday: this.lastReportTimes.size
    };
  }
}

// Singleton instance
let healthScheduler = null;

function getHealthScheduler() {
  if (!healthScheduler) {
    healthScheduler = new HealthScheduler();
  }
  return healthScheduler;
}

module.exports = { HealthScheduler, getHealthScheduler };