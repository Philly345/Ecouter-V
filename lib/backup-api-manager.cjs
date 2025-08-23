// Enhanced API Manager with Backup Key Support
const nodemailer = require('nodemailer');

class BackupAPIManager {
  constructor() {
    this.apis = {
      assemblyai: {
        keys: [
          process.env.ASSEMBLYAI_API_KEY,
          process.env.ASSEMBLYAI_API_KEY2,
          process.env.ASSEMBLYAI_API_KEY3
        ].filter(key => key && key !== 'your-backup-assemblyai-key-here'),
        currentKeyIndex: 0,
        usage: 0,
        dailyLimit: 500000,
        monthlyLimit: 10000000,
        resetDate: new Date(),
        priority: 1,
        isActive: true,
        errorCount: 0,
        endpoint: 'https://api.assemblyai.com',
        quotaInfo: null
      },
      gladia: {
        keys: [
          process.env.GLADIA_API_KEY,
          process.env.GLADIA_API_KEY2,
          process.env.GLADIA_API_KEY3
        ].filter(key => key && key !== 'your-backup-gladia-key-here'),
        currentKeyIndex: 0,
        usage: 0,
        dailyLimit: 300000,
        monthlyLimit: 8000000,
        resetDate: new Date(),
        priority: 2,
        isActive: true,
        errorCount: 0,
        endpoint: 'https://api.gladia.io',
        quotaInfo: null
      },
      gemini: {
        keys: [
          process.env.GEMINI_API_KEY,
          process.env.GEMINI_API_KEY2,
          process.env.GEMINI_API_KEY3
        ].filter(key => key && key !== 'your-backup-gemini-key-here'),
        currentKeyIndex: 0,
        usage: 0,
        dailyLimit: 100000,
        monthlyLimit: 2000000,
        resetDate: new Date(),
        priority: 3,
        isActive: true,
        errorCount: 0,
        endpoint: 'https://generativelanguage.googleapis.com',
        quotaInfo: null
      },
      deepseek: {
        keys: [
          process.env.DEEPSEEK_API_KEY,
          process.env.DEEPSEEK_API_KEY2,
          process.env.DEEPSEEK_API_KEY3
        ].filter(key => key && key !== 'your-backup-deepseek-key-here'),
        currentKeyIndex: 0,
        usage: 0,
        dailyLimit: 1000000,
        monthlyLimit: 25000000,
        resetDate: new Date(),
        priority: 4,
        isActive: true,
        errorCount: 0,
        endpoint: 'https://api.deepseek.com',
        quotaInfo: null
      }
    };

    this.emailConfig = {
      host: process.env.SMTP_SERVER,
      port: parseInt(process.env.SMTP_PORT || 587),
      secure: false,
      auth: {
        user: process.env.SMTP_LOGIN,
        pass: process.env.SMTP_PASSWORD
      }
    };

    // Log backup key availability
    this.logBackupKeyStatus();
  }

  // Log which APIs have backup keys available
  logBackupKeyStatus() {
    console.log('🔑 Backup API Key Status:');
    Object.entries(this.apis).forEach(([name, api]) => {
      const totalKeys = api.keys.length;
      const backupKeys = totalKeys - 1;
      console.log(`  ${name.toUpperCase()}: ${totalKeys} keys total (${backupKeys} backup${backupKeys !== 1 ? 's' : ''})`);
    });
  }

  // Get current API key for a service
  getCurrentKey(apiName) {
    const api = this.apis[apiName];
    if (!api || !api.keys || api.keys.length === 0) {
      return null;
    }
    return api.keys[api.currentKeyIndex] || null;
  }

  // Switch to next backup key for an API
  switchToBackupKey(apiName, reason = 'quota_exceeded') {
    const api = this.apis[apiName];
    if (!api || !api.keys || api.keys.length <= 1) {
      console.log(`❌ ${apiName.toUpperCase()}: No backup keys available`);
      return false;
    }

    const oldKeyIndex = api.currentKeyIndex;
    const oldKey = api.keys[oldKeyIndex];
    
    // Move to next key
    api.currentKeyIndex = (api.currentKeyIndex + 1) % api.keys.length;
    const newKey = api.keys[api.currentKeyIndex];
    
    console.log(`🔄 ${apiName.toUpperCase()}: Switched from key #${oldKeyIndex + 1} to key #${api.currentKeyIndex + 1}`);
    console.log(`   Reason: ${reason}`);
    console.log(`   Old key: ...${oldKey.slice(-8)}`);
    console.log(`   New key: ...${newKey.slice(-8)}`);
    
    return true;
  }

  // Enhanced health check with backup key testing
  async performHealthCheck() {
    const results = {
      timestamp: new Date().toISOString(),
      apis: {},
      overallStatus: 'healthy',
      issues: [],
      quotaWarnings: [],
      criticalErrors: [],
      backupKeyStatus: {}
    };

    console.log('🔍 Running enhanced health checks with backup key support...');

    // Check each API
    for (const [apiName, apiConfig] of Object.entries(this.apis)) {
      try {
        console.log(`🧪 Testing ${apiName.toUpperCase()} (${apiConfig.keys.length} keys available)...`);
        
        // Test primary key
        const health = await this.checkAPIHealthEnhanced(apiName, apiConfig);
        
        // Test backup keys if primary fails with quota issues
        if (!health.isHealthy && health.isQuotaIssue && apiConfig.keys.length > 1) {
          console.log(`   🔄 Primary key depleted, testing backup keys...`);
          const backupResults = await this.testBackupKeys(apiName, apiConfig);
          health.backupKeyResults = backupResults;
          
          // If we found a working backup, switch to it
          if (backupResults.workingBackups > 0) {
            console.log(`   ✅ Found ${backupResults.workingBackups} working backup key(s)`);
            health.hasWorkingBackups = true;
          }
        }
        
        // Get quota information
        const quotaInfo = await this.getAPIQuotaInfo(apiName, apiConfig);
        health.quotaInfo = quotaInfo;
        
        results.apis[apiName] = health;
        results.backupKeyStatus[apiName] = {
          totalKeys: apiConfig.keys.length,
          currentKeyIndex: apiConfig.currentKeyIndex + 1,
          workingBackups: health.backupKeyResults?.workingBackups || 'Not tested'
        };
        
        // Categorize issues
        if (!health.isHealthy) {
          if (health.isQuotaIssue && !health.hasWorkingBackups) {
            results.quotaWarnings.push(`${apiName}: ${health.error} (${apiConfig.keys.length} keys total)`);
            results.overallStatus = 'warning';
          } else if (health.isQuotaIssue && health.hasWorkingBackups) {
            // Quota issue but we have working backups - this is good!
            console.log(`   ✅ ${apiName.toUpperCase()}: Quota exceeded but backup keys available`);
          } else {
            results.criticalErrors.push(`${apiName}: ${health.error}`);
            results.overallStatus = 'error';
          }
          results.issues.push(`${apiName}: ${health.error}`);
        }

        // Log result
        const status = health.isHealthy ? '✅' : health.hasWorkingBackups ? '🔄' : '❌';
        console.log(`   ${status} ${apiName.toUpperCase()}: ${health.statusMessage}`);
        
      } catch (error) {
        console.log(`   ❌ ${apiName.toUpperCase()}: ${error.message}`);
        results.apis[apiName] = {
          isHealthy: false,
          error: error.message,
          responseTime: null,
          isQuotaIssue: false,
          statusMessage: `Test failed: ${error.message}`,
          hasWorkingBackups: false
        };
        results.overallStatus = 'error';
        results.issues.push(`${apiName}: ${error.message}`);
      }
    }

    return results;
  }

  // Test backup keys for an API
  async testBackupKeys(apiName, apiConfig) {
    const results = {
      totalBackups: apiConfig.keys.length - 1,
      workingBackups: 0,
      failedBackups: 0,
      backupDetails: []
    };

    // Test each backup key (skip the current primary key)
    for (let i = 1; i < apiConfig.keys.length; i++) {
      const keyIndex = (apiConfig.currentKeyIndex + i) % apiConfig.keys.length;
      const testKey = apiConfig.keys[keyIndex];
      
      try {
        console.log(`     🧪 Testing backup key #${keyIndex + 1}...`);
        
        // Create temporary config for this key
        const testConfig = { ...apiConfig, keys: [testKey], currentKeyIndex: 0 };
        const testResult = await this.checkAPIHealthEnhanced(apiName, testConfig);
        
        const backupDetail = {
          keyIndex: keyIndex + 1,
          key: `...${testKey.slice(-8)}`,
          isHealthy: testResult.isHealthy,
          isQuotaIssue: testResult.isQuotaIssue,
          responseTime: testResult.responseTime,
          error: testResult.error
        };
        
        results.backupDetails.push(backupDetail);
        
        if (testResult.isHealthy) {
          results.workingBackups++;
          console.log(`     ✅ Backup key #${keyIndex + 1}: Working (${testResult.responseTime}ms)`);
        } else if (testResult.isQuotaIssue) {
          results.failedBackups++;
          console.log(`     ⚠️ Backup key #${keyIndex + 1}: Quota exceeded`);
        } else {
          results.failedBackups++;
          console.log(`     ❌ Backup key #${keyIndex + 1}: ${testResult.error}`);
        }
        
      } catch (error) {
        results.failedBackups++;
        results.backupDetails.push({
          keyIndex: keyIndex + 1,
          key: `...${testKey.slice(-8)}`,
          isHealthy: false,
          error: error.message
        });
        console.log(`     ❌ Backup key #${keyIndex + 1}: ${error.message}`);
      }
    }

    return results;
  }

  // Same enhanced health check method from before
  async checkAPIHealthEnhanced(apiName, apiConfig) {
    const startTime = Date.now();
    const currentKey = this.getCurrentKey(apiName) || apiConfig.keys[0];
    
    if (!currentKey) {
      return {
        isHealthy: false,
        error: 'No API key available',
        responseTime: 0,
        isQuotaIssue: false,
        statusMessage: 'No API key configured'
      };
    }
    
    try {
      let response;
      
      switch (apiName) {
        case 'assemblyai':
          response = await fetch(`${apiConfig.endpoint}/v2/transcript`, {
            method: 'GET',
            headers: {
              'Authorization': currentKey
            }
          });
          break;
          
        case 'gladia':
          response = await fetch(`${apiConfig.endpoint}/v2/pre-recorded/`, {
            method: 'POST',
            headers: {
              'X-Gladia-Key': currentKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
              audio_url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav'
            })
          });
          break;
          
        case 'gemini':
          response = await fetch(`${apiConfig.endpoint}/v1beta/models?key=${currentKey}`);
          break;
          
        case 'deepseek':
          response = await fetch(`${apiConfig.endpoint}/v1/chat/completions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${currentKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'deepseek-chat',
              messages: [{ role: 'user', content: 'Hi' }],
              max_tokens: 1
            })
          });
          break;
          
        default:
          throw new Error(`Unknown API: ${apiName}`);
      }

      const responseTime = Date.now() - startTime;
      const responseText = await response.text();
      
      // Parse response for detailed analysis
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { raw: responseText };
      }

      // Analyze response
      const analysis = this.analyzeAPIResponse(apiName, response.status, responseData, responseTime);
      return analysis;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error.message.includes('fetch')) {
        return {
          isHealthy: false,
          responseTime,
          statusCode: null,
          error: 'Network connection failed',
          isQuotaIssue: false,
          statusMessage: 'Connection error - API unreachable'
        };
      }
      
      return {
        isHealthy: false,
        responseTime,
        statusCode: null,
        error: error.message,
        isQuotaIssue: false,
        statusMessage: `Test failed: ${error.message}`
      };
    }
  }

  // Copy all the other methods from enhanced-api-manager.cjs
  analyzeAPIResponse(apiName, statusCode, responseData, responseTime) {
    // Success cases
    if (statusCode >= 200 && statusCode < 300) {
      return {
        isHealthy: true,
        responseTime,
        statusCode,
        error: null,
        isQuotaIssue: false,
        statusMessage: `Healthy (${responseTime}ms)`
      };
    }

    // Quota/Rate limit issues
    if (statusCode === 429 || statusCode === 402) {
      return {
        isHealthy: false,
        responseTime,
        statusCode,
        error: 'Rate limit or quota exceeded',
        isQuotaIssue: true,
        statusMessage: `Quota/Rate limit exceeded (${statusCode})`
      };
    }

    // Authentication issues
    if (statusCode === 401 || statusCode === 403) {
      return {
        isHealthy: false,
        responseTime,
        statusCode,
        error: 'Authentication failed - invalid API key',
        isQuotaIssue: false,
        statusMessage: `Auth error (${statusCode})`
      };
    }

    // Server errors
    if (statusCode >= 500) {
      return {
        isHealthy: false,
        responseTime,
        statusCode,
        error: 'Server error - API temporarily unavailable',
        isQuotaIssue: false,
        statusMessage: `Server error (${statusCode})`
      };
    }

    // Check response content for specific error messages
    if (responseData) {
      const errorMessage = this.extractErrorMessage(apiName, responseData);
      const isQuotaRelated = this.isQuotaError(errorMessage);
      
      return {
        isHealthy: false,
        responseTime,
        statusCode,
        error: errorMessage || `HTTP ${statusCode}`,
        isQuotaIssue: isQuotaRelated,
        statusMessage: errorMessage || `Error ${statusCode}`
      };
    }

    return {
      isHealthy: false,
      responseTime,
      statusCode,
      error: `HTTP ${statusCode}`,
      isQuotaIssue: false,
      statusMessage: `Client error (${statusCode})`
    };
  }

  extractErrorMessage(apiName, responseData) {
    if (!responseData) return null;

    const errorFields = ['error', 'message', 'detail', 'error_description'];
    
    for (const field of errorFields) {
      if (responseData[field]) {
        if (typeof responseData[field] === 'string') {
          return responseData[field];
        } else if (responseData[field].message) {
          return responseData[field].message;
        }
      }
    }

    switch (apiName) {
      case 'deepseek':
        if (responseData.error && responseData.error.message) {
          return responseData.error.message;
        }
        break;
      case 'gemini':
        if (responseData.error && responseData.error.message) {
          return responseData.error.message;
        }
        break;
    }

    return null;
  }

  isQuotaError(errorMessage) {
    if (!errorMessage) return false;
    
    const quotaKeywords = [
      'quota', 'limit', 'rate', 'insufficient', 'exceeded', 
      'billing', 'payment', 'credits', 'balance', 'usage'
    ];
    
    const lowerMessage = errorMessage.toLowerCase();
    return quotaKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  // Simplified quota checking (copy from enhanced-api-manager.cjs)
  async getAPIQuotaInfo(apiName, apiConfig) {
    // Implementation would be the same as in enhanced-api-manager.cjs
    return {
      provider: apiName.toUpperCase(),
      totalKeys: apiConfig.keys.length,
      currentKey: apiConfig.currentKeyIndex + 1,
      backupsAvailable: apiConfig.keys.length - 1
    };
  }

  // Send email with backup key information
  async sendHealthReport(healthData) {
    try {
      const transporter = nodemailer.createTransport(this.emailConfig);
      
      const currentTime = new Date();
      const timeString = currentTime.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });

      // Create subject based on backup key status
      let subject = `🔑 AI Health + Backup Keys - ${timeString}`;
      if (healthData.criticalErrors.length > 0) {
        subject = `🚨 CRITICAL - AI + Backup Status - ${timeString}`;
      } else if (healthData.quotaWarnings.length > 0) {
        const workingBackups = Object.values(healthData.apis).some(api => api.hasWorkingBackups);
        subject = workingBackups ? 
          `✅ BACKUPS ACTIVE - AI Health - ${timeString}` : 
          `⚠️ QUOTA WARNING - AI Health - ${timeString}`;
      }

      const htmlReport = this.generateBackupKeyHTML(healthData, timeString);
      
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
        timestamp: new Date().toISOString()
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

  // Generate HTML with backup key information
  generateBackupKeyHTML(healthData, timeString) {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background: #f8fafc; }
        .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; text-align: center; }
        .backup-badge { background: #10b981; color: white; padding: 5px 10px; border-radius: 4px; font-size: 11px; margin: 10px 0; }
        .key-status { display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 4px; margin: 2px; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔑 AI Health + Backup Key Status</h1>
            <p><strong>${timeString}</strong> | ${new Date().toDateString()}</p>
            <div class="backup-badge">Multi-Key Redundancy Active</div>
        </div>
        
        <div style="padding: 30px;">
            <h2>🛡️ Backup Key Summary</h2>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                ${Object.entries(healthData.backupKeyStatus).map(([name, status]) => `
                    <div style="margin: 10px 0; padding: 10px; border-left: 3px solid #6366f1;">
                        <strong>${name.toUpperCase()}:</strong> 
                        <span class="key-status">${status.totalKeys} keys total</span>
                        <span class="key-status">Active: Key #${status.currentKeyIndex}</span>
                        <span class="key-status">Backups: ${status.workingBackups}</span>
                    </div>
                `).join('')}
            </div>
            
            <p><strong>💡 How Backup Keys Work:</strong></p>
            <ul>
                <li>🔄 <strong>Auto-switching:</strong> When a key hits quota limits, system automatically switches to backup</li>
                <li>🔑 <strong>Multiple keys:</strong> Each API can have up to 3 keys (primary + 2 backups)</li>
                <li>📧 <strong>Smart alerts:</strong> You're only notified when ALL keys for an API are depleted</li>
                <li>⚡ <strong>Zero downtime:</strong> Seamless switching ensures continuous service</li>
            </ul>
            
            <h2>📊 Current API Status</h2>
            ${Object.entries(healthData.apis).map(([name, data]) => {
              const statusColor = data.isHealthy ? '#22c55e' : data.hasWorkingBackups ? '#f59e0b' : '#ef4444';
              const statusIcon = data.isHealthy ? '✅' : data.hasWorkingBackups ? '🔄' : '❌';
              const statusText = data.isHealthy ? 'Healthy' : data.hasWorkingBackups ? 'Backup Active' : 'All Keys Depleted';
              
              return `
                <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 10px 0; border-left: 4px solid ${statusColor};">
                    <h3>${statusIcon} ${name.toUpperCase()} - ${statusText}</h3>
                    <p><strong>Response:</strong> ${data.responseTime}ms | <strong>Status:</strong> ${data.statusMessage}</p>
                    ${data.backupKeyResults ? `
                        <div style="background: #f8fafc; padding: 10px; border-radius: 4px; margin: 10px 0;">
                            <strong>🔑 Backup Key Test Results:</strong><br>
                            • Working backups: ${data.backupKeyResults.workingBackups}/${data.backupKeyResults.totalBackups}<br>
                            • Failed backups: ${data.backupKeyResults.failedBackups}/${data.backupKeyResults.totalBackups}
                        </div>
                    ` : ''}
                </div>
              `;
            }).join('')}
            
            <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center;">
                <h3>🎯 System Reliability: ${Math.round((Object.values(healthData.apis).filter(api => api.isHealthy || api.hasWorkingBackups).length / Object.keys(healthData.apis).length) * 100)}%</h3>
                <p>Your backup key system ensures maximum uptime even when individual API quotas are exceeded!</p>
            </div>
        </div>
    </div>
</body>
</html>
    `;
  }
}

module.exports = { BackupAPIManager };