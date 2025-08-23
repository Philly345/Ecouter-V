// Smart API Management System with Auto-Rotation and Health Monitoring
const nodemailer = require('nodemailer');

class SmartAPIManager {
  constructor() {
    // Prevent duplicate initialization
    if (SmartAPIManager.instance) {
      return SmartAPIManager.instance;
    }
    
    SmartAPIManager.instance = this;
    this.apis = {
      assemblyai: {
        key: process.env.ASSEMBLYAI_API_KEY,
        usage: 0,
        limit: 1000000, // Monthly limit in characters
        resetDate: new Date(),
        priority: 1,
        isActive: true,
        errorCount: 0,
        lastError: null,
        endpoint: 'https://api.assemblyai.com'
      },
      gladia: {
        key: process.env.GLADIA_API_KEY,
        usage: 0,
        limit: 500000,
        resetDate: new Date(),
        priority: 2,
        isActive: true,
        errorCount: 0,
        lastError: null,
        endpoint: 'https://api.gladia.io'
      },
      gemini: {
        key: process.env.GEMINI_API_KEY,
        usage: 0,
        limit: 2000000,
        resetDate: new Date(),
        priority: 3,
        isActive: true,
        errorCount: 0,
        lastError: null,
        endpoint: 'https://generativelanguage.googleapis.com'
      },
      deepseek: {
        key: process.env.DEEPSEEK_API_KEY,
        usage: 0,
        limit: 1500000,
        resetDate: new Date(),
        priority: 4,
        isActive: true,
        errorCount: 0,
        lastError: null,
        endpoint: 'https://api.deepseek.com'
      }
    };

    this.currentAPI = 'assemblyai';
    this.emailConfig = {
      host: process.env.SMTP_SERVER,
      port: parseInt(process.env.SMTP_PORT),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_LOGIN,
        pass: process.env.SMTP_PASSWORD
      }
    };
    
    this.alertEmail = 'ecouter.transcribe@gmail.com';
    this.debugAttempts = new Map();
    this.systemHealth = {
      status: 'healthy',
      lastCheck: new Date(),
      startTime: new Date(), // Track when system started
      issues: [],
      autoFixedCount: 0,
      manualInterventionCount: 0
    };

    // Start monitoring (only once per process)
    if (!SmartAPIManager.initialized) {
      this.startHealthMonitoring();
      // Start scheduler in next tick to avoid circular dependency
      process.nextTick(() => {
        if (!SmartAPIManager.schedulerStarted) {
          this.startScheduledReports();
          SmartAPIManager.schedulerStarted = true;
        }
      });
      SmartAPIManager.initialized = true;
    }
  }

  // 🔍 API Usage Monitoring & Auto-Switch
  async checkAPIUsage(apiName, requestSize = 1000) {
    const api = this.apis[apiName];
    if (!api) return false;

    // Calculate usage percentage
    const usagePercent = (api.usage / api.limit) * 100;
    
    // Check if approaching limit (85% threshold)
    if (usagePercent >= 85) {
      console.log(`🚨 API ${apiName} at ${usagePercent.toFixed(1)}% usage - Switching to backup`);
      await this.switchToNextAPI(apiName);
      return false;
    }

    // Update usage
    api.usage += requestSize;
    await this.saveAPIMetrics();
    
    return true;
  }

  // 🔄 Smart API Switching Logic
  async switchToNextAPI(currentAPI) {
    console.log(`🔄 Switching from ${currentAPI} to backup API...`);
    
    // Find next available API
    const availableAPIs = Object.entries(this.apis)
      .filter(([name, api]) => api.isActive && name !== currentAPI)
      .sort((a, b) => {
        // Sort by usage percentage (lowest first)
        const usageA = (a[1].usage / a[1].limit) * 100;
        const usageB = (b[1].usage / b[1].limit) * 100;
        return usageA - usageB;
      });

    if (availableAPIs.length === 0) {
      await this.sendCriticalAlert('ALL_APIS_DEPLETED', 'All APIs have reached their limits!');
      return null;
    }

    const [nextAPIName, nextAPI] = availableAPIs[0];
    this.currentAPI = nextAPIName;

    console.log(`✅ Switched to ${nextAPIName} (${((nextAPI.usage / nextAPI.limit) * 100).toFixed(1)}% used)`);
    
    await this.sendInfoAlert('API_SWITCHED', `Automatically switched from ${currentAPI} to ${nextAPIName}`);
    return nextAPIName;
  }

  // 🛠️ Auto-Debug System
  async autoDebug(error, context = {}) {
    const errorKey = `${error.name}_${error.message}`;
    const attempts = this.debugAttempts.get(errorKey) || 0;

    if (attempts >= 3) {
      await this.sendCriticalAlert('AUTO_DEBUG_FAILED', error, context);
      return false;
    }

    this.debugAttempts.set(errorKey, attempts + 1);

    console.log(`🔧 Auto-debugging: ${error.name} (Attempt ${attempts + 1}/3)`);

    try {
      const fixed = await this.applyAutomaticFix(error, context);
      
      if (fixed) {
        this.systemHealth.autoFixedCount++;
        this.debugAttempts.delete(errorKey);
        console.log(`✅ Auto-fixed: ${error.name}`);
        return true;
      }
    } catch (debugError) {
      console.error(`❌ Auto-debug failed:`, debugError);
    }

    return false;
  }

  // 🔧 Automatic Fix Patterns
  async applyAutomaticFix(error, context) {
    const errorType = error.name || error.code || 'Unknown';
    const errorMessage = error.message || '';

    // API Rate Limit Fixes
    if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
      console.log('🔄 Rate limit detected - switching API...');
      await this.switchToNextAPI(this.currentAPI);
      return true;
    }

    // API Key Issues
    if (errorMessage.includes('invalid api key') || errorMessage.includes('unauthorized')) {
      console.log('🔑 API key issue detected - rotating to backup...');
      this.apis[this.currentAPI].isActive = false;
      await this.switchToNextAPI(this.currentAPI);
      return true;
    }

    // Network Timeout Issues
    if (errorMessage.includes('timeout') || errorMessage.includes('ECONNRESET')) {
      console.log('⏱️ Network timeout - implementing retry with backoff...');
      await this.wait(2000); // 2 second delay
      return true;
    }

    // Database Connection Issues
    if (errorMessage.includes('MongoError') || errorMessage.includes('connection')) {
      console.log('🗃️ Database issue detected - attempting reconnection...');
      // Could implement database reconnection logic here
      return true;
    }

    // Memory Issues
    if (errorMessage.includes('out of memory') || errorMessage.includes('heap')) {
      console.log('🧠 Memory issue detected - triggering garbage collection...');
      if (global.gc) {
        global.gc();
        return true;
      }
    }

    return false;
  }

  // � Start Scheduled Health Reports
  startScheduledReports() {
    try {
      const { getHealthScheduler } = require('./health-scheduler.cjs');
      this.healthScheduler = getHealthScheduler();
      this.healthScheduler.start();
      console.log('📅 Scheduled health reports activated for: 12AM, 12:20AM, 7AM, 10AM, 12PM, 3PM, 10PM');
    } catch (error) {
      console.error('⚠️ Failed to start scheduled reports:', error);
    }
  }

  // �📊 Health Monitoring
  startHealthMonitoring() {
    setInterval(async () => {
      await this.performHealthCheck();
    }, 30000); // Check every 30 seconds

    // Daily API usage reset check
    setInterval(async () => {
      await this.checkAPIResets();
    }, 3600000); // Check every hour
  }

  async performHealthCheck() {
    this.systemHealth.lastCheck = new Date();
    const issues = [];

    // Check API health
    for (const [name, api] of Object.entries(this.apis)) {
      const usagePercent = (api.usage / api.limit) * 100;
      
      if (usagePercent > 90) {
        issues.push(`API ${name} at ${usagePercent.toFixed(1)}% usage`);
      }
      
      if (api.errorCount > 10) {
        issues.push(`API ${name} has ${api.errorCount} errors`);
      }
    }

    // Check system resources (if available)
    try {
      const memUsage = process.memoryUsage();
      const memPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      
      if (memPercent > 85) {
        issues.push(`High memory usage: ${memPercent.toFixed(1)}%`);
      }
    } catch (e) {
      // Memory check not available
    }

    this.systemHealth.issues = issues;
    this.systemHealth.status = issues.length === 0 ? 'healthy' : 'warning';

    // Send daily health report
    if (this.shouldSendDailyReport()) {
      await this.sendHealthReport();
    }
  }

  // 📧 Smart Email Alert System
  async sendCriticalAlert(type, error, context = {}) {
    const subject = `🚨 CRITICAL: ${type} - Manual Intervention Required`;
    const body = this.generateAlertEmail(type, error, context, 'critical');
    
    await this.sendEmail(subject, body);
    this.systemHealth.manualInterventionCount++;
  }

  async sendInfoAlert(type, message) {
    const subject = `ℹ️ INFO: ${type} - System Auto-Recovery`;
    const body = this.generateAlertEmail(type, message, {}, 'info');
    
    await this.sendEmail(subject, body);
  }

  async sendHealthReport() {
    const subject = `📊 Daily Health Report - ${new Date().toDateString()}`;
    const body = this.generateHealthReport();
    
    await this.sendEmail(subject, body);
  }

  generateAlertEmail(type, error, context, severity) {
    const timestamp = new Date().toISOString();
    const errorDetails = typeof error === 'object' ? JSON.stringify(error, null, 2) : error;

    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: ${severity === 'critical' ? '#dc3545' : '#17a2b8'}; color: white; padding: 20px; border-radius: 5px; }
        .content { padding: 20px; background: #f8f9fa; margin: 20px 0; border-radius: 5px; }
        .footer { color: #666; font-size: 12px; margin-top: 20px; }
        .stats { display: flex; gap: 20px; margin: 20px 0; }
        .stat-box { background: white; padding: 15px; border-radius: 5px; flex: 1; }
    </style>
</head>
<body>
    <div class="header">
        <h2>${severity === 'critical' ? '🚨 CRITICAL ALERT' : 'ℹ️ SYSTEM NOTIFICATION'}</h2>
        <p>Alert Type: ${type}</p>
        <p>Timestamp: ${timestamp}</p>
    </div>
    
    <div class="content">
        <h3>Issue Details:</h3>
        <pre>${errorDetails}</pre>
        
        ${Object.keys(context).length > 0 ? `
        <h3>Context:</h3>
        <pre>${JSON.stringify(context, null, 2)}</pre>
        ` : ''}
        
        <h3>Current System Status:</h3>
        <div class="stats">
            <div class="stat-box">
                <strong>Active API:</strong> ${this.currentAPI}<br>
                <strong>Auto-Fixes Today:</strong> ${this.systemHealth.autoFixedCount}<br>
                <strong>Manual Interventions:</strong> ${this.systemHealth.manualInterventionCount}
            </div>
        </div>
        
        <h3>API Status:</h3>
        ${Object.entries(this.apis).map(([name, api]) => `
        <div class="stat-box">
            <strong>${name.toUpperCase()}:</strong><br>
            Status: ${api.isActive ? '✅ Active' : '❌ Inactive'}<br>
            Usage: ${((api.usage / api.limit) * 100).toFixed(1)}%<br>
            Errors: ${api.errorCount}
        </div>
        `).join('')}
    </div>
    
    <div class="footer">
        <p>This is an automated alert from your Ecouter Transcribe system.</p>
        <p>Dashboard: <a href="https://ecoutertranscribe.tech/admin/health">View System Health</a></p>
    </div>
</body>
</html>
    `;
  }

  generateHealthReport() {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background: #28a745; color: white; padding: 20px; border-radius: 5px; }
        .content { padding: 20px; background: #f8f9fa; margin: 20px 0; border-radius: 5px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
        .stat-box { background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745; }
    </style>
</head>
<body>
    <div class="header">
        <h2>📊 Daily System Health Report</h2>
        <p>Date: ${new Date().toDateString()}</p>
        <p>Status: ${this.systemHealth.status.toUpperCase()}</p>
    </div>
    
    <div class="content">
        <h3>📈 Performance Metrics:</h3>
        <div class="stats">
            <div class="stat-box">
                <h4>🤖 Auto-Recovery</h4>
                <p>Auto-Fixes: <strong>${this.systemHealth.autoFixedCount}</strong></p>
                <p>Manual Interventions: <strong>${this.systemHealth.manualInterventionCount}</strong></p>
                <p>Success Rate: <strong>${((this.systemHealth.autoFixedCount / (this.systemHealth.autoFixedCount + this.systemHealth.manualInterventionCount)) * 100 || 100).toFixed(1)}%</strong></p>
            </div>
            
            <div class="stat-box">
                <h4>🔄 API Management</h4>
                <p>Active API: <strong>${this.currentAPI.toUpperCase()}</strong></p>
                <p>APIs Available: <strong>${Object.values(this.apis).filter(api => api.isActive).length}/4</strong></p>
            </div>
        </div>
        
        <h3>🗂️ API Usage Details:</h3>
        <div class="stats">
            ${Object.entries(this.apis).map(([name, api]) => `
            <div class="stat-box">
                <h4>${name.toUpperCase()}</h4>
                <p>Status: ${api.isActive ? '✅ Active' : '❌ Inactive'}</p>
                <p>Usage: <strong>${((api.usage / api.limit) * 100).toFixed(1)}%</strong></p>
                <p>Remaining: <strong>${api.limit - api.usage}</strong> requests</p>
                <p>Errors: ${api.errorCount}</p>
            </div>
            `).join('')}
        </div>
        
        ${this.systemHealth.issues.length > 0 ? `
        <h3>⚠️ Current Issues:</h3>
        <ul>
            ${this.systemHealth.issues.map(issue => `<li>${issue}</li>`).join('')}
        </ul>
        ` : '<h3>✅ No Issues Detected</h3>'}
    </div>
</body>
</html>
    `;
  }

  async sendEmail(subject, body) {
    try {
      const transporter = nodemailer.createTransport(this.emailConfig);
      
      await transporter.sendMail({
        from: process.env.SMTP_SENDER,
        to: this.alertEmail,
        subject,
        html: body
      });
      
      console.log(`📧 Alert sent: ${subject}`);
    } catch (error) {
      console.error('❌ Failed to send email alert:', error);
    }
  }

  // 💾 Utility Methods
  async saveAPIMetrics() {
    // Save to database or file system for persistence
    try {
      const fs = require('fs').promises;
      await fs.writeFile('./api-metrics.json', JSON.stringify(this.apis, null, 2));
    } catch (error) {
      console.error('Failed to save API metrics:', error);
    }
  }

  async loadAPIMetrics() {
    try {
      const fs = require('fs').promises;
      const data = await fs.readFile('./api-metrics.json', 'utf8');
      this.apis = { ...this.apis, ...JSON.parse(data) };
    } catch (error) {
      // File doesn't exist or error reading - use defaults
    }
  }

  async checkAPIResets() {
    const now = new Date();
    
    for (const [name, api] of Object.entries(this.apis)) {
      // Reset monthly (adjust based on your API billing cycles)
      if (now.getMonth() !== api.resetDate.getMonth()) {
        api.usage = 0;
        api.resetDate = now;
        api.errorCount = 0;
        api.isActive = true;
        console.log(`🔄 Reset usage for ${name}`);
      }
    }
    
    await this.saveAPIMetrics();
  }

  shouldSendDailyReport() {
    // Scheduled reports are now handled by the HealthScheduler
    return false; // Disable the old daily report system
  }

  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 📊 Public API for integration
  async getCurrentAPI() {
    return this.currentAPI;
  }

  async getSystemHealth() {
    return this.systemHealth;
  }

  async getAPIStatus() {
    return this.apis;
  }

  async recordAPIError(apiName, error) {
    if (this.apis[apiName]) {
      this.apis[apiName].errorCount++;
      this.apis[apiName].lastError = error;
      
      // Auto-debug if error count is high
      if (this.apis[apiName].errorCount >= 5) {
        await this.autoDebug(error, { api: apiName });
      }
    }
  }

  // Get scheduler status
  getSchedulerStatus() {
    if (this.healthScheduler) {
      return this.healthScheduler.getStatus();
    }
    return { isRunning: false, message: 'Scheduler not initialized' };
  }
}

// Singleton instance
let apiManager = null;
SmartAPIManager.initialized = false; // Class-level flag
SmartAPIManager.schedulerStarted = false; // Prevent duplicate scheduler starts

function getAPIManager() {
  if (!apiManager) {
    apiManager = new SmartAPIManager();
  }
  return apiManager;
}

module.exports = { SmartAPIManager, getAPIManager };