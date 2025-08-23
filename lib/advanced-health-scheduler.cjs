// Advanced Health Scheduler with Backup Key Support
const { BackupAPIManager } = require('./backup-api-manager.cjs');

class AdvancedHealthScheduler {
  constructor() {
    this.apiManager = new BackupAPIManager();
    this.isRunning = false;
    this.intervalId = null;
    this.lastRunTime = null;
    this.nextRunTime = null;
    this.runCount = 0;
    
    // Enhanced scheduling - 8 times per day including 12:50 AM
    this.scheduledTimes = [
      { hour: 0, minute: 0 },   // 12:00 AM
      { hour: 0, minute: 20 },  // 12:20 AM  
      { hour: 0, minute: 50 },  // 12:50 AM
      { hour: 7, minute: 0 },   // 7:00 AM
      { hour: 10, minute: 0 },  // 10:00 AM
      { hour: 12, minute: 0 },  // 12:00 PM
      { hour: 15, minute: 0 },  // 3:00 PM
      { hour: 22, minute: 0 }   // 10:00 PM
    ];

    console.log('🚀 Advanced Health Scheduler initialized with backup key support');
    console.log(`📅 Monitoring schedule: ${this.scheduledTimes.length} times daily`);
    this.scheduledTimes.forEach((time, index) => {
      const timeStr = `${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}`;
      console.log(`   ${index + 1}. ${timeStr}`);
    });
  }

  // Check if it's time to run
  shouldRunNow() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Check against all scheduled times
    for (const scheduledTime of this.scheduledTimes) {
      if (currentHour === scheduledTime.hour && currentMinute === scheduledTime.minute) {
        return true;
      }
    }
    
    return false;
  }

  // Get next scheduled run time
  getNextRunTime() {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    // Convert scheduled times to minutes
    const scheduledMinutes = this.scheduledTimes.map(time => time.hour * 60 + time.minute);
    
    // Find next scheduled time
    for (const minutes of scheduledMinutes) {
      if (minutes > currentMinutes) {
        const nextTime = new Date(now);
        nextTime.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
        return nextTime;
      }
    }
    
    // If no time today, return first time tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(this.scheduledTimes[0].hour, this.scheduledTimes[0].minute, 0, 0);
    return tomorrow;
  }

  // Start the scheduler
  start() {
    if (this.isRunning) {
      console.log('⚠️ Scheduler already running');
      return;
    }

    this.isRunning = true;
    console.log('🟢 Advanced Health Scheduler started with backup key monitoring');
    
    // Update next run time
    this.nextRunTime = this.getNextRunTime();
    console.log(`⏰ Next scheduled health check: ${this.nextRunTime.toLocaleString()}`);
    
    // Check every minute if it's time to run
    this.intervalId = setInterval(async () => {
      if (this.shouldRunNow() && !this.isCurrentlyChecking) {
        await this.runHealthCheck();
      }
    }, 60000); // Check every minute
    
    console.log('✅ Scheduler monitoring started - will check every minute for scheduled times');
  }

  // Stop the scheduler
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('🔴 Advanced Health Scheduler stopped');
  }

  // Run a health check with backup key support
  async runHealthCheck() {
    if (this.isCurrentlyChecking) {
      console.log('⏭️ Health check already in progress, skipping...');
      return;
    }

    this.isCurrentlyChecking = true;
    this.runCount++;
    this.lastRunTime = new Date();
    
    console.log(`\n🔍 === HEALTH CHECK #${this.runCount} - ${this.lastRunTime.toLocaleString()} ===`);
    console.log('🔑 Running with advanced backup key support...\n');

    try {
      // Perform enhanced health check with backup key testing
      const healthResults = await this.apiManager.performHealthCheck();
      
      // Send email report with backup key information
      console.log('\n📧 Sending enhanced health report with backup key status...');
      const emailResult = await this.apiManager.sendHealthReport(healthResults);
      
      if (emailResult.success) {
        console.log(`✅ Enhanced health report sent successfully (ID: ${emailResult.messageId})`);
      } else {
        console.log(`❌ Failed to send health report: ${emailResult.error}`);
      }

      // Update next run time
      this.nextRunTime = this.getNextRunTime();
      console.log(`⏰ Next scheduled check: ${this.nextRunTime.toLocaleString()}`);
      
      // Log summary with backup key status
      this.logHealthSummary(healthResults);
      
    } catch (error) {
      console.error('💥 Health check failed:', error);
    } finally {
      this.isCurrentlyChecking = false;
      console.log(`\n🏁 === HEALTH CHECK #${this.runCount} COMPLETE ===\n`);
    }
  }

  // Log enhanced summary with backup key information
  logHealthSummary(healthResults) {
    console.log('\n📊 === HEALTH SUMMARY ===');
    console.log(`Overall Status: ${healthResults.overallStatus.toUpperCase()}`);
    
    // Count backup keys
    const totalAPIs = Object.keys(healthResults.apis).length;
    const healthyAPIs = Object.values(healthResults.apis).filter(api => api.isHealthy).length;
    const apisWithBackups = Object.values(healthResults.apis).filter(api => api.hasWorkingBackups).length;
    const totalBackupKeys = Object.values(healthResults.backupKeyStatus).reduce((sum, status) => sum + (status.totalKeys - 1), 0);
    
    console.log(`Healthy APIs: ${healthyAPIs}/${totalAPIs}`);
    console.log(`APIs with working backups: ${apisWithBackups}/${totalAPIs}`);
    console.log(`Total backup keys available: ${totalBackupKeys}`);
    
    if (healthResults.quotaWarnings.length > 0) {
      console.log('\n⚠️ Quota Warnings:');
      healthResults.quotaWarnings.forEach(warning => console.log(`   ${warning}`));
    }
    
    if (healthResults.criticalErrors.length > 0) {
      console.log('\n🚨 Critical Errors:');
      healthResults.criticalErrors.forEach(error => console.log(`   ${error}`));
    }
    
    // Show backup key effectiveness
    const effectiveUptime = ((healthyAPIs + apisWithBackups) / totalAPIs * 100).toFixed(1);
    console.log(`\n🎯 Effective Uptime: ${effectiveUptime}% (including backup keys)`);
    console.log('=========================\n');
  }

  // Force run a health check now (for testing)
  async forceHealthCheck() {
    console.log('🔥 Forcing immediate health check with backup key testing...');
    await this.runHealthCheck();
  }

  // Get scheduler status
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRunTime: this.lastRunTime,
      nextRunTime: this.nextRunTime,
      runCount: this.runCount,
      scheduledTimes: this.scheduledTimes,
      backupKeySupport: true,
      totalScheduledChecks: this.scheduledTimes.length
    };
  }
}

// Create singleton instance
let schedulerInstance = null;

function getScheduler() {
  if (!schedulerInstance) {
    schedulerInstance = new AdvancedHealthScheduler();
  }
  return schedulerInstance;
}

// Auto-start if this is the main module or being imported
if (require.main === module) {
  console.log('🚀 Starting Advanced Health Scheduler with backup key support...');
  const scheduler = getScheduler();
  scheduler.start();
  
  // Keep the process alive
  process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, stopping scheduler...');
    scheduler.stop();
    process.exit(0);
  });
} else {
  // If imported, just log that it's available
  console.log('📦 Advanced Health Scheduler with backup key support loaded and ready');
}

module.exports = { AdvancedHealthScheduler, getScheduler };