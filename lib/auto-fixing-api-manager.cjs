// Intelligent Auto-Fixing API Manager
const nodemailer = require('nodemailer');
const { BackupAPIManager } = require('./backup-api-manager.cjs');

class AutoFixingAPIManager extends BackupAPIManager {
  constructor() {
    super();
    this.autoFixAttempts = new Map();
    this.maxAutoFixAttempts = 3;
    this.autoFixHistory = [];
    this.criticalIssues = [];
  }

  // Enhanced health check with auto-fixing capabilities
  async performHealthCheckWithAutoFix() {
    console.log('🔧 Running health check with auto-fixing capabilities...');
    
    const results = {
      timestamp: new Date().toISOString(),
      apis: {},
      overallStatus: 'healthy',
      autoFixesPerformed: [],
      criticalIssuesRequiringAttention: [],
      systemsFixed: 0,
      systemsRequiringManualIntervention: 0,
      backupKeyStatus: {}
    };

    // Check each API and attempt auto-fixes
    for (const [apiName, apiConfig] of Object.entries(this.apis)) {
      try {
        console.log(`🔍 Checking ${apiName.toUpperCase()}...`);
        
        // Initial health check
        let health = await this.checkAPIHealthEnhanced(apiName, apiConfig);
        
        // If unhealthy, attempt auto-fixes
        if (!health.isHealthy) {
          console.log(`⚠️ ${apiName.toUpperCase()} has issues: ${health.error}`);
          
          const autoFixResult = await this.attemptAutoFix(apiName, apiConfig, health);
          
          if (autoFixResult.fixed) {
            console.log(`✅ AUTO-FIXED: ${apiName.toUpperCase()} - ${autoFixResult.method}`);
            results.autoFixesPerformed.push({
              api: apiName,
              issue: health.error,
              fixMethod: autoFixResult.method,
              timestamp: new Date().toISOString()
            });
            results.systemsFixed++;
            
            // Re-check after fix
            health = await this.checkAPIHealthEnhanced(apiName, apiConfig);
            health.autoFixed = true;
            health.fixMethod = autoFixResult.method;
          } else {
            console.log(`❌ REQUIRES MANUAL INTERVENTION: ${apiName.toUpperCase()}`);
            results.criticalIssuesRequiringAttention.push({
              api: apiName,
              issue: health.error,
              attemptedFixes: autoFixResult.attemptedFixes,
              requiresManualAction: true
            });
            results.systemsRequiringManualIntervention++;
          }
        } else {
          console.log(`✅ ${apiName.toUpperCase()}: Healthy`);
        }
        
        // Test backup keys if needed
        if (!health.isHealthy && apiConfig.keys.length > 1) {
          const backupResults = await this.testBackupKeys(apiName, apiConfig);
          health.backupKeyResults = backupResults;
          
          if (backupResults.workingBackups > 0) {
            health.hasWorkingBackups = true;
          }
        }
        
        results.apis[apiName] = health;
        results.backupKeyStatus[apiName] = {
          totalKeys: apiConfig.keys.length,
          currentKeyIndex: apiConfig.currentKeyIndex + 1,
          workingBackups: health.backupKeyResults?.workingBackups || 'Not tested'
        };
        
      } catch (error) {
        console.error(`💥 Critical error checking ${apiName}:`, error);
        results.apis[apiName] = {
          isHealthy: false,
          error: `Critical system error: ${error.message}`,
          requiresImmediateAttention: true
        };
        results.criticalIssuesRequiringAttention.push({
          api: apiName,
          issue: `System error: ${error.message}`,
          requiresManualAction: true
        });
        results.systemsRequiringManualIntervention++;
      }
    }

    // Determine overall status
    if (results.criticalIssuesRequiringAttention.length > 0) {
      results.overallStatus = 'requires_attention';
    } else if (results.autoFixesPerformed.length > 0) {
      results.overallStatus = 'auto_fixed';
    } else {
      results.overallStatus = 'healthy';
    }

    console.log(`🎯 Auto-Fix Summary: ${results.systemsFixed} systems fixed, ${results.systemsRequiringManualIntervention} need attention`);
    
    return results;
  }

  // Attempt to automatically fix API issues
  async attemptAutoFix(apiName, apiConfig, healthResult) {
    const fixAttempts = [];
    let fixed = false;
    
    console.log(`🔧 Attempting auto-fix for ${apiName.toUpperCase()}...`);
    
    // Fix Method 1: Switch to backup key if quota exceeded
    if (healthResult.isQuotaIssue && apiConfig.keys.length > 1) {
      fixAttempts.push('backup_key_switch');
      console.log(`   🔄 Trying backup key switch...`);
      
      const switched = this.switchToBackupKey(apiName, 'auto_fix_quota_exceeded');
      if (switched) {
        // Test the new key
        const testResult = await this.checkAPIHealthEnhanced(apiName, apiConfig);
        if (testResult.isHealthy) {
          fixed = true;
          return {
            fixed: true,
            method: 'Switched to backup API key',
            attemptedFixes: fixAttempts
          };
        }
      }
    }

    // Fix Method 2: Reset API configuration
    if (healthResult.statusCode === 401 || healthResult.statusCode === 403) {
      fixAttempts.push('api_config_reset');
      console.log(`   🔄 Trying API configuration reset...`);
      
      // Reset error count and try again
      apiConfig.errorCount = 0;
      const testResult = await this.checkAPIHealthEnhanced(apiName, apiConfig);
      if (testResult.isHealthy) {
        fixed = true;
        return {
          fixed: true,
          method: 'Reset API configuration',
          attemptedFixes: fixAttempts
        };
      }
    }

    // Fix Method 3: Wait and retry for temporary issues
    if (healthResult.statusCode >= 500) {
      fixAttempts.push('retry_after_delay');
      console.log(`   🔄 Trying retry after delay for server error...`);
      
      await this.sleep(5000); // Wait 5 seconds
      const testResult = await this.checkAPIHealthEnhanced(apiName, apiConfig);
      if (testResult.isHealthy) {
        fixed = true;
        return {
          fixed: true,
          method: 'Retry after delay resolved server error',
          attemptedFixes: fixAttempts
        };
      }
    }

    // Fix Method 4: Network connectivity retry
    if (healthResult.error?.includes('fetch') || healthResult.error?.includes('network')) {
      fixAttempts.push('network_retry');
      console.log(`   🔄 Trying network connectivity retry...`);
      
      for (let i = 0; i < 3; i++) {
        await this.sleep(2000); // Wait 2 seconds between retries
        const testResult = await this.checkAPIHealthEnhanced(apiName, apiConfig);
        if (testResult.isHealthy) {
          fixed = true;
          return {
            fixed: true,
            method: `Network retry #${i + 1} successful`,
            attemptedFixes: fixAttempts
          };
        }
      }
    }

    return {
      fixed: false,
      method: null,
      attemptedFixes: fixAttempts
    };
  }

  // Utility function for delays
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Send intelligent email reports
  async sendIntelligentHealthReport(healthData) {
    try {
      const transporter = nodemailer.createTransporter(this.emailConfig);
      
      const currentTime = new Date();
      const timeString = currentTime.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });

      // Determine email type and subject
      let subject, emailType;
      
      if (healthData.criticalIssuesRequiringAttention.length > 0) {
        subject = `🚨 MANUAL INTERVENTION REQUIRED - AI System Alert - ${timeString}`;
        emailType = 'critical';
      } else if (healthData.autoFixesPerformed.length > 0) {
        subject = `🔧 AUTO-FIXES APPLIED - AI System Report - ${timeString}`;
        emailType = 'auto_fixed';
      } else {
        subject = `✅ ALL SYSTEMS HEALTHY - AI Monitor - ${timeString}`;
        emailType = 'healthy';
      }

      const htmlReport = this.generateIntelligentEmailHTML(healthData, timeString, emailType);
      
      const mailOptions = {
        from: process.env.SMTP_SENDER,
        to: 'ecouter.transcribe@gmail.com',
        subject,
        html: htmlReport
      };

      const result = await transporter.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: result.messageId,
        timestamp: new Date().toISOString(),
        emailType
      };

    } catch (error) {
      console.error('Email send failed:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Generate intelligent email HTML
  generateIntelligentEmailHTML(healthData, timeString, emailType) {
    const bgColor = emailType === 'critical' ? '#fee2e2' : 
                   emailType === 'auto_fixed' ? '#fef3c7' : '#f0f9ff';
    const headerColor = emailType === 'critical' ? '#dc2626' : 
                       emailType === 'auto_fixed' ? '#d97706' : '#2563eb';

    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background: ${bgColor}; }
        .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, ${headerColor}, #6366f1); color: white; padding: 30px; text-align: center; }
        .status-badge { background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; display: inline-block; margin: 10px 0; }
        .auto-fix { background: #10b981; color: white; padding: 15px; border-radius: 8px; margin: 10px 0; }
        .critical { background: #ef4444; color: white; padding: 15px; border-radius: 8px; margin: 10px 0; }
        .healthy { background: #22c55e; color: white; padding: 15px; border-radius: 8px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${emailType === 'critical' ? '🚨 MANUAL INTERVENTION REQUIRED' : 
                  emailType === 'auto_fixed' ? '🔧 AUTO-FIXES APPLIED' : 
                  '✅ ALL SYSTEMS HEALTHY'}</h1>
            <p><strong>${timeString}</strong> | ${new Date().toDateString()}</p>
            <div class="status-badge">AI Auto-Monitoring Active</div>
        </div>
        
        <div style="padding: 30px;">
            ${emailType === 'critical' ? `
                <div class="critical">
                    <h2>🚨 URGENT: Manual Intervention Required</h2>
                    <p><strong>${healthData.systemsRequiringManualIntervention}</strong> system(s) need your attention:</p>
                    ${healthData.criticalIssuesRequiringAttention.map(issue => `
                        <div style="background: rgba(255,255,255,0.2); padding: 10px; border-radius: 5px; margin: 5px 0;">
                            <strong>${issue.api.toUpperCase()}:</strong> ${issue.issue}<br>
                            <small>Attempted fixes: ${issue.attemptedFixes?.join(', ') || 'None'}</small>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            ${emailType === 'auto_fixed' ? `
                <div class="auto-fix">
                    <h2>🔧 Auto-Fixes Successfully Applied</h2>
                    <p><strong>${healthData.systemsFixed}</strong> system(s) automatically fixed:</p>
                    ${healthData.autoFixesPerformed.map(fix => `
                        <div style="background: rgba(255,255,255,0.2); padding: 10px; border-radius: 5px; margin: 5px 0;">
                            <strong>${fix.api.toUpperCase()}:</strong> ${fix.issue}<br>
                            <strong>Fix Applied:</strong> ${fix.fixMethod}
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            ${emailType === 'healthy' ? `
                <div class="healthy">
                    <h2>✅ Perfect System Health</h2>
                    <p>All ${Object.keys(healthData.apis).length} API systems are running optimally. No issues detected, no fixes needed.</p>
                </div>
            ` : ''}
            
            <h2>📊 System Status Overview</h2>
            ${Object.entries(healthData.apis).map(([name, data]) => {
              const statusIcon = data.isHealthy ? '✅' : data.autoFixed ? '🔧' : '❌';
              const statusText = data.isHealthy ? 'Healthy' : data.autoFixed ? `Auto-Fixed (${data.fixMethod})` : 'Needs Attention';
              
              return `
                <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 10px 0;">
                    <h3>${statusIcon} ${name.toUpperCase()} - ${statusText}</h3>
                    <p><strong>Response:</strong> ${data.responseTime}ms | <strong>Status:</strong> ${data.statusMessage}</p>
                    ${data.autoFixed ? `<p style="color: #10b981;"><strong>✅ Auto-Fix Applied:</strong> ${data.fixMethod}</p>` : ''}
                </div>
              `;
            }).join('')}
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <h3>🤖 AI Auto-Monitoring Summary</h3>
                <p><strong>Systems Monitored:</strong> ${Object.keys(healthData.apis).length}</p>
                <p><strong>Auto-Fixes Applied:</strong> ${healthData.systemsFixed}</p>
                <p><strong>Manual Intervention Needed:</strong> ${healthData.systemsRequiringManualIntervention}</p>
                <p><strong>Overall System Health:</strong> ${healthData.overallStatus.replace('_', ' ').toUpperCase()}</p>
            </div>
            
            ${emailType === 'critical' ? `
                <div style="background: #fef2f2; border: 2px solid #fca5a5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3>⚠️ Action Required</h3>
                    <p>The AI system has attempted automatic fixes but manual intervention is required for optimal operation.</p>
                    <p><strong>Next Steps:</strong> Please review the issues above and take appropriate action.</p>
                </div>
            ` : `
                <div style="background: #f0f9ff; border: 2px solid #93c5fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <h3>🎯 System Status: Excellent</h3>
                    <p>Your AI monitoring system is working perfectly. All APIs are healthy and the backup key system is ready.</p>
                    <p><strong>Next Check:</strong> The system will continue monitoring and will only email you if issues require attention.</p>
                </div>
            `}
        </div>
    </div>
</body>
</html>
    `;
  }
}

module.exports = { AutoFixingAPIManager };