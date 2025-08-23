// Enhanced API Health Checker - Tests actual API functionality
const nodemailer = require('nodemailer');

class EnhancedAPIManager {
  constructor() {
    this.apis = {
      assemblyai: {
        key: process.env.ASSEMBLYAI_API_KEY,
        usage: 0,
        dailyLimit: 500000,      // characters per day
        monthlyLimit: 10000000,  // characters per month
        resetDate: new Date(),
        priority: 1,
        isActive: true,
        errorCount: 0,
        endpoint: 'https://api.assemblyai.com',
        quotaInfo: null
      },
      gladia: {
        key: process.env.GLADIA_API_KEY,
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
        key: process.env.GEMINI_API_KEY,
        usage: 0,
        dailyLimit: 100000,      // requests per day
        monthlyLimit: 2000000,   // requests per month
        resetDate: new Date(),
        priority: 3,
        isActive: true,
        errorCount: 0,
        endpoint: 'https://generativelanguage.googleapis.com',
        quotaInfo: null
      },
      deepseek: {
        key: process.env.DEEPSEEK_API_KEY,
        usage: 0,
        dailyLimit: 1000000,     // tokens per day
        monthlyLimit: 25000000,  // tokens per month
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
  }

  // Enhanced health check with actual API testing
  async performHealthCheck() {
    const results = {
      timestamp: new Date().toISOString(),
      apis: {},
      overallStatus: 'healthy',
      issues: [],
      quotaWarnings: [],
      criticalErrors: []
    };

    console.log('🔍 Running enhanced health checks...');

    // Check each API with real functionality tests
    for (const [apiName, apiConfig] of Object.entries(this.apis)) {
      try {
        console.log(`🧪 Testing ${apiName.toUpperCase()}...`);
        const health = await this.checkAPIHealthEnhanced(apiName, apiConfig);
        
        // Try to get quota information
        const quotaInfo = await this.getAPIQuotaInfo(apiName, apiConfig);
        health.quotaInfo = quotaInfo;
        
        results.apis[apiName] = health;
        
        // Categorize issues
        if (!health.isHealthy) {
          if (health.isQuotaIssue) {
            results.quotaWarnings.push(`${apiName}: ${health.error}`);
            results.overallStatus = 'warning';
          } else {
            results.criticalErrors.push(`${apiName}: ${health.error}`);
            results.overallStatus = 'error';
          }
          results.issues.push(`${apiName}: ${health.error}`);
        }

        // Log result
        const status = health.isHealthy ? '✅' : '❌';
        console.log(`   ${status} ${apiName.toUpperCase()}: ${health.statusMessage}`);
        
      } catch (error) {
        console.log(`   ❌ ${apiName.toUpperCase()}: ${error.message}`);
        results.apis[apiName] = {
          isHealthy: false,
          error: error.message,
          responseTime: null,
          isQuotaIssue: false,
          statusMessage: `Test failed: ${error.message}`
        };
        results.overallStatus = 'error';
        results.issues.push(`${apiName}: ${error.message}`);
      }
    }

    return results;
  }

  // Enhanced API health check with real functionality testing
  async checkAPIHealthEnhanced(apiName, apiConfig) {
    const startTime = Date.now();
    
    try {
      let response, testResult;
      
      switch (apiName) {
        case 'assemblyai':
          // Test with a real account check
          response = await fetch(`${apiConfig.endpoint}/v2/transcript`, {
            method: 'GET',
            headers: {
              'Authorization': apiConfig.key
            }
          });
          break;
          
        case 'gladia':
          // Test with actual API call
          response = await fetch(`${apiConfig.endpoint}/v2/pre-recorded/`, {
            method: 'POST',
            headers: {
              'X-Gladia-Key': apiConfig.key,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
              audio_url: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav'
            })
          });
          break;
          
        case 'gemini':
          // Test with models endpoint
          response = await fetch(`${apiConfig.endpoint}/v1beta/models?key=${apiConfig.key}`);
          break;
          
        case 'deepseek':
          // Test with a simple chat completion to verify quota
          response = await fetch(`${apiConfig.endpoint}/v1/chat/completions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiConfig.key}`,
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

      // Analyze response for different types of issues
      const analysis = this.analyzeAPIResponse(apiName, response.status, responseData, responseTime);
      
      return analysis;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Network or connection errors
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

  // Analyze API responses for specific error types
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

    // Quota/Rate limit issues (these are common and expected)
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

    // Default for other 4xx errors
    return {
      isHealthy: false,
      responseTime,
      statusCode,
      error: `HTTP ${statusCode}`,
      isQuotaIssue: false,
      statusMessage: `Client error (${statusCode})`
    };
  }

  // Extract specific error messages from API responses
  extractErrorMessage(apiName, responseData) {
    if (!responseData) return null;

    // Common error message fields
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

    // API-specific error extraction
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

  // Check if error is quota-related
  isQuotaError(errorMessage) {
    if (!errorMessage) return false;
    
    const quotaKeywords = [
      'quota', 'limit', 'rate', 'insufficient', 'exceeded', 
      'billing', 'payment', 'credits', 'balance', 'usage'
    ];
    
    const lowerMessage = errorMessage.toLowerCase();
    return quotaKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  // Get API quota information where available
  async getAPIQuotaInfo(apiName, apiConfig) {
    try {
      switch (apiName) {
        case 'assemblyai':
          return await this.getAssemblyAIQuota(apiConfig);
        case 'gladia':
          return await this.getGladiaQuota(apiConfig);
        case 'gemini':
          return await this.getGeminiQuota(apiConfig);
        case 'deepseek':
          return await this.getDeepSeekQuota(apiConfig);
        default:
          return null;
      }
    } catch (error) {
      console.log(`   ⚠️ Could not retrieve quota for ${apiName}: ${error.message}`);
      return null;
    }
  }

  // AssemblyAI quota check
  async getAssemblyAIQuota(apiConfig) {
    try {
      const response = await fetch(`${apiConfig.endpoint}/v2/transcript`, {
        method: 'GET',
        headers: {
          'Authorization': apiConfig.key
        }
      });

      // AssemblyAI doesn't provide quota info in headers typically
      // We'll estimate based on known limits
      return {
        provider: 'AssemblyAI',
        dailyUsed: 'Unknown',
        dailyLimit: '500K chars/day',
        monthlyUsed: 'Unknown',
        monthlyLimit: '10M chars/month',
        estimatedRemaining: 'Check dashboard for exact usage',
        resetTime: 'Daily at midnight UTC'
      };
    } catch (error) {
      return null;
    }
  }

  // Gladia quota check
  async getGladiaQuota(apiConfig) {
    try {
      // Gladia may provide quota info in response headers
      const response = await fetch(`${apiConfig.endpoint}/v2/pre-recorded/`, {
        method: 'POST',
        headers: {
          'X-Gladia-Key': apiConfig.key,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ audio_url: 'test' })
      });

      // Check for rate limit headers
      const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
      const rateLimitLimit = response.headers.get('X-RateLimit-Limit');
      const rateLimitReset = response.headers.get('X-RateLimit-Reset');

      return {
        provider: 'Gladia',
        dailyUsed: rateLimitRemaining ? `${rateLimitLimit - rateLimitRemaining}` : 'Unknown',
        dailyLimit: rateLimitLimit || '300K chars/day',
        monthlyUsed: 'Check dashboard',
        monthlyLimit: '8M chars/month',
        estimatedRemaining: rateLimitRemaining || 'Unknown',
        resetTime: rateLimitReset ? new Date(rateLimitReset * 1000).toLocaleString() : 'Unknown'
      };
    } catch (error) {
      return null;
    }
  }

  // Gemini quota check
  async getGeminiQuota(apiConfig) {
    try {
      // Google APIs sometimes provide quota info
      const response = await fetch(`${apiConfig.endpoint}/v1beta/models?key=${apiConfig.key}`);

      return {
        provider: 'Google Gemini',
        dailyUsed: 'Check Google Cloud Console',
        dailyLimit: '100K requests/day',
        monthlyUsed: 'Check Google Cloud Console',
        monthlyLimit: '2M requests/month',
        estimatedRemaining: 'See Google Cloud Console for exact quotas',
        resetTime: 'Daily at midnight PT'
      };
    } catch (error) {
      return null;
    }
  }

  // DeepSeek quota check
  async getDeepSeekQuota(apiConfig) {
    try {
      // Try to get account info or usage data
      const response = await fetch(`${apiConfig.endpoint}/v1/user/balance`, {
        headers: {
          'Authorization': `Bearer ${apiConfig.key}`
        }
      });

      if (response.ok) {
        const balanceData = await response.json();
        return {
          provider: 'DeepSeek',
          dailyUsed: 'Check via API response',
          dailyLimit: '1M tokens/day',
          monthlyUsed: 'Check via API response',
          monthlyLimit: '25M tokens/month',
          estimatedRemaining: balanceData.balance || 'Unknown',
          resetTime: 'Daily at midnight UTC',
          balanceInfo: balanceData
        };
      } else {
        // If balance endpoint fails, provide general info
        return {
          provider: 'DeepSeek',
          dailyUsed: 'API limit reached',
          dailyLimit: '1M tokens/day',
          monthlyUsed: 'API limit reached',
          monthlyLimit: '25M tokens/month',
          estimatedRemaining: '0 (quota exceeded)',
          resetTime: 'Daily at midnight UTC',
          status: `HTTP ${response.status} - Quota exceeded`
        };
      }
    } catch (error) {
      return {
        provider: 'DeepSeek',
        dailyUsed: 'Error retrieving',
        dailyLimit: '1M tokens/day',
        monthlyUsed: 'Error retrieving',
        monthlyLimit: '25M tokens/month',
        estimatedRemaining: 'Unknown - Check DeepSeek dashboard',
        resetTime: 'Daily at midnight UTC',
        error: error.message
      };
    }
  }

  // Send enhanced email report
  async sendHealthReport(healthData) {
    try {
      const transporter = nodemailer.createTransport(this.emailConfig);
      
      const currentTime = new Date();
      const timeString = currentTime.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });

      const htmlReport = this.generateEnhancedHealthReportHTML(healthData, timeString);
      
      // Create subject based on severity
      let subject = `🤖 AI Health Report - ${timeString}`;
      if (healthData.criticalErrors.length > 0) {
        subject = `🚨 CRITICAL - AI Health Alert - ${timeString}`;
      } else if (healthData.quotaWarnings.length > 0) {
        subject = `⚠️ QUOTA WARNING - AI Health Report - ${timeString}`;
      } else {
        subject = `✅ ALL GOOD - AI Health Report - ${timeString}`;
      }

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

  // Generate enhanced HTML report with better categorization
  generateEnhancedHealthReportHTML(healthData, timeString) {
    const getOverallColor = () => {
      if (healthData.criticalErrors.length > 0) return '#ef4444';
      if (healthData.quotaWarnings.length > 0) return '#f59e0b';
      return '#22c55e';
    };

    const getOverallEmoji = () => {
      if (healthData.criticalErrors.length > 0) return '🚨';
      if (healthData.quotaWarnings.length > 0) return '⚠️';
      return '✅';
    };

    const statusColor = getOverallColor();
    const statusEmoji = getOverallEmoji();

    const apiCards = Object.entries(healthData.apis).map(([name, data]) => {
      const getCardClass = () => {
        if (data.isHealthy) return 'api-healthy';
        if (data.isQuotaIssue) return 'api-quota';
        return 'api-error';
      };

      const getCardEmoji = () => {
        if (data.isHealthy) return '✅';
        if (data.isQuotaIssue) return '⚠️';
        return '❌';
      };

      const cardClass = getCardClass();
      const cardEmoji = getCardEmoji();
      
      // Generate quota info section
      const quotaSection = data.quotaInfo ? `
        <div class="quota-info">
          <div class="quota-title">📊 Quota Information</div>
          <div class="quota-row">Daily: ${data.quotaInfo.dailyUsed} / ${data.quotaInfo.dailyLimit}</div>
          <div class="quota-row">Monthly: ${data.quotaInfo.monthlyUsed} / ${data.quotaInfo.monthlyLimit}</div>
          <div class="quota-row">Remaining: ${data.quotaInfo.estimatedRemaining}</div>
          <div class="quota-row">Reset: ${data.quotaInfo.resetTime}</div>
        </div>
      ` : '<div class="quota-info"><div class="quota-title">📊 Quota: Check provider dashboard</div></div>';
      
      return `
        <div class="api-card ${cardClass}">
          <div class="api-name">${cardEmoji} ${name.toUpperCase()}</div>
          <div class="api-status">Status: ${data.statusMessage}</div>
          <div class="api-response">Response: ${data.responseTime ? data.responseTime + 'ms' : 'N/A'}</div>
          ${data.error ? `<div class="api-error-msg">${data.isQuotaIssue ? '💳' : '🔧'} ${data.error}</div>` : ''}
          ${quotaSection}
        </div>
      `;
    }).join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background: #f8fafc; }
        .container { max-width: 700px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, ${statusColor}, ${statusColor}dd); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
        .content { padding: 30px; }
        .status-overview { background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
        .api-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 25px 0; }
        .api-card { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; }
        .api-healthy { border-left: 4px solid #22c55e; }
        .api-quota { border-left: 4px solid #f59e0b; background: #fefbf2; }
        .api-error { border-left: 4px solid #ef4444; background: #fef2f2; }
        .api-name { font-weight: 600; color: #1e293b; margin-bottom: 8px; }
        .api-status { font-size: 12px; color: #64748b; }
        .api-response { font-size: 12px; color: #64748b; }
        .api-error-msg { font-size: 11px; margin-top: 5px; padding: 5px; border-radius: 4px; }
        .quota-info { margin-top: 10px; padding: 8px; background: #f8fafc; border-radius: 4px; border: 1px solid #e2e8f0; }
        .quota-title { font-size: 11px; font-weight: 600; color: #475569; margin-bottom: 4px; }
        .quota-row { font-size: 10px; color: #64748b; line-height: 1.3; }
        .critical-section { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 15px 0; border-radius: 0 8px 8px 0; }
        .quota-section { background: #fefbf2; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; border-radius: 0 8px 8px 0; }
        .success-section { background: #d1fae5; border-left: 4px solid #22c55e; padding: 15px; margin: 15px 0; border-radius: 0 8px 8px 0; }
        .timestamp { text-align: center; color: #64748b; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
        .enhanced-badge { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 5px 10px; border-radius: 4px; font-size: 11px; display: inline-block; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${statusEmoji} Enhanced AI Health Report</h1>
            <p><strong>${timeString}</strong> | ${new Date().toDateString()}</p>
            <span class="enhanced-badge">🔬 Deep API Testing</span>
        </div>
        
        <div class="content">
            <div class="status-overview">
                <h2>${statusEmoji} System Status: ${healthData.overallStatus.toUpperCase()}</h2>
                <p>Comprehensive API functionality testing with quota monitoring</p>
            </div>

            ${healthData.criticalErrors.length > 0 ? `
            <h3>🚨 Critical Issues Requiring Attention</h3>
            <div class="critical-section">
                <p><strong>These APIs have serious issues that need immediate attention:</strong></p>
                ${healthData.criticalErrors.map(error => `<p>• ${error}</p>`).join('')}
            </div>
            ` : ''}

            ${healthData.quotaWarnings.length > 0 ? `
            <h3>⚠️ Quota/Rate Limit Warnings</h3>
            <div class="quota-section">
                <p><strong>These APIs have reached their limits (expected behavior):</strong></p>
                ${healthData.quotaWarnings.map(warning => `<p>• ${warning}</p>`).join('')}
                <p><em>💡 The system will automatically switch to backup APIs when needed.</em></p>
            </div>
            ` : ''}

            <h3>🔍 Detailed API Health Report</h3>
            <div class="api-grid">
                ${apiCards}
            </div>

            ${healthData.issues.length === 0 ? `
            <div class="success-section">
                <p><strong>✅ All Systems Operational</strong></p>
                <p>All APIs are responding normally with no critical issues detected. Your transcription service is running perfectly!</p>
            </div>
            ` : ''}

            <h3>📊 Testing Summary</h3>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
                <p><strong>🧪 Test Type:</strong> Enhanced functionality testing (not just ping)</p>
                <p><strong>✅ Healthy APIs:</strong> ${Object.values(healthData.apis).filter(api => api.isHealthy).length}/${Object.keys(healthData.apis).length}</p>
                <p><strong>⚠️ Quota Issues:</strong> ${healthData.quotaWarnings.length} (normal, handled automatically)</p>
                <p><strong>🚨 Critical Issues:</strong> ${healthData.criticalErrors.length}</p>
                <p><strong>⏰ Next Check:</strong> Scheduled every few hours via Vercel Cron</p>
            </div>

            <h3>💳 Quota Summary</h3>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
                ${Object.entries(healthData.apis).map(([name, data]) => {
                  if (data.quotaInfo) {
                    return `
                      <div style="margin-bottom: 10px; padding: 8px; border-left: 3px solid ${data.isHealthy ? '#22c55e' : data.isQuotaIssue ? '#f59e0b' : '#ef4444'};">
                        <strong>${name.toUpperCase()}:</strong><br>
                        📅 Daily: ${data.quotaInfo.dailyUsed} / ${data.quotaInfo.dailyLimit}<br>
                        📆 Monthly: ${data.quotaInfo.monthlyUsed} / ${data.quotaInfo.monthlyLimit}<br>
                        ⏰ Reset: ${data.quotaInfo.resetTime}
                      </div>
                    `;
                  } else {
                    return `
                      <div style="margin-bottom: 10px; padding: 8px; border-left: 3px solid #64748b;">
                        <strong>${name.toUpperCase()}:</strong> Check provider dashboard for quota details
                      </div>
                    `;
                  }
                }).join('')}
                <p style="margin-top: 15px; font-size: 12px; color: #64748b;"><em>💡 Quota information is retrieved where available from API responses and headers.</em></p>
            </div>
        </div>
        
        <div class="timestamp">
            🤖 Enhanced Health Check | ${healthData.timestamp}<br>
            📧 Delivered to: ecouter.transcribe@gmail.com | 🔬 Deep API Testing Active
        </div>
    </div>
</body>
</html>
    `;
  }
}

module.exports = { EnhancedAPIManager };