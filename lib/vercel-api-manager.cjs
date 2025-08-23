// Vercel-compatible API Manager (serverless version)
const nodemailer = require('nodemailer');

class VercelAPIManager {
  constructor() {
    this.apis = {
      assemblyai: {
        key: process.env.ASSEMBLYAI_API_KEY,
        usage: 0,
        limit: 1000000,
        priority: 1,
        isActive: true,
        errorCount: 0,
        endpoint: 'https://api.assemblyai.com'
      },
      gladia: {
        key: process.env.GLADIA_API_KEY,
        usage: 0,
        limit: 500000,
        priority: 2,
        isActive: true,
        errorCount: 0,
        endpoint: 'https://api.gladia.io'
      },
      gemini: {
        key: process.env.GEMINI_API_KEY,
        usage: 0,
        limit: 2000000,
        priority: 3,
        isActive: true,
        errorCount: 0,
        endpoint: 'https://generativelanguage.googleapis.com'
      },
      deepseek: {
        key: process.env.DEEPSEEK_API_KEY,
        usage: 0,
        limit: 1500000,
        priority: 4,
        isActive: true,
        errorCount: 0,
        endpoint: 'https://api.deepseek.com'
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

  // Health check method for Vercel cron
  async performHealthCheck() {
    const results = {
      timestamp: new Date().toISOString(),
      apis: {},
      overallStatus: 'healthy',
      issues: []
    };

    // Check each API
    for (const [apiName, apiConfig] of Object.entries(this.apis)) {
      try {
        const health = await this.checkAPIHealth(apiName, apiConfig);
        results.apis[apiName] = health;
        
        if (!health.isHealthy) {
          results.overallStatus = 'warning';
          results.issues.push(`${apiName}: ${health.error}`);
        }
      } catch (error) {
        results.apis[apiName] = {
          isHealthy: false,
          error: error.message,
          responseTime: null
        };
        results.overallStatus = 'error';
        results.issues.push(`${apiName}: ${error.message}`);
      }
    }

    return results;
  }

  // Check individual API health
  async checkAPIHealth(apiName, apiConfig) {
    const startTime = Date.now();
    
    try {
      // Simple health check based on API type
      let response;
      
      switch (apiName) {
        case 'assemblyai':
          response = await fetch(`${apiConfig.endpoint}/v2/transcript`, {
            method: 'GET',
            headers: {
              'Authorization': apiConfig.key
            }
          });
          break;
          
        case 'gladia':
          response = await fetch(`${apiConfig.endpoint}/v2/pre-recorded/`, {
            method: 'POST',
            headers: {
              'X-Gladia-Key': apiConfig.key,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ audio_url: 'test' })
          });
          break;
          
        case 'gemini':
          response = await fetch(`${apiConfig.endpoint}/v1beta/models?key=${apiConfig.key}`);
          break;
          
        case 'deepseek':
          response = await fetch(`${apiConfig.endpoint}/v1/models`, {
            headers: {
              'Authorization': `Bearer ${apiConfig.key}`
            }
          });
          break;
          
        default:
          throw new Error(`Unknown API: ${apiName}`);
      }

      const responseTime = Date.now() - startTime;
      const isHealthy = response.status < 500; // 4xx errors are OK for health checks

      return {
        isHealthy,
        responseTime,
        statusCode: response.status,
        error: isHealthy ? null : `HTTP ${response.status}`
      };

    } catch (error) {
      return {
        isHealthy: false,
        responseTime: Date.now() - startTime,
        statusCode: null,
        error: error.message
      };
    }
  }

  // Send email report
  async sendHealthReport(healthData) {
    try {
      const transporter = nodemailer.createTransport(this.emailConfig);
      
      const currentTime = new Date();
      const timeString = currentTime.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });

      const htmlReport = this.generateHealthReportHTML(healthData, timeString);
      
      const mailOptions = {
        from: process.env.SMTP_SENDER,
        to: 'ecouter.transcribe@gmail.com',
        subject: `🤖 AI Health Report - ${timeString} | ${healthData.overallStatus.toUpperCase()}`,
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

  // Generate HTML report
  generateHealthReportHTML(healthData, timeString) {
    const statusColor = healthData.overallStatus === 'healthy' ? '#22c55e' : 
                       healthData.overallStatus === 'warning' ? '#f59e0b' : '#ef4444';
    
    const statusEmoji = healthData.overallStatus === 'healthy' ? '✅' : 
                       healthData.overallStatus === 'warning' ? '⚠️' : '❌';

    const apiCards = Object.entries(healthData.apis).map(([name, data]) => {
      const statusClass = data.isHealthy ? 'api-healthy' : 'api-error';
      const apiEmoji = data.isHealthy ? '✅' : '❌';
      
      return `
        <div class="api-card ${statusClass}">
          <div class="api-name">${apiEmoji} ${name.toUpperCase()}</div>
          <div class="api-status">Status: ${data.isHealthy ? 'Healthy' : 'Error'}</div>
          <div class="api-response">Response: ${data.responseTime ? data.responseTime + 'ms' : 'N/A'}</div>
          ${data.error ? `<div class="api-error-msg">Error: ${data.error}</div>` : ''}
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
        .status-overview h2 { margin: 0 0 10px 0; color: ${statusColor}; }
        .api-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 25px 0; }
        .api-card { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; }
        .api-healthy { border-left: 4px solid #22c55e; }
        .api-error { border-left: 4px solid #ef4444; }
        .api-name { font-weight: 600; color: #1e293b; margin-bottom: 8px; }
        .api-status { font-size: 12px; color: #64748b; }
        .api-response { font-size: 12px; color: #64748b; }
        .api-error-msg { font-size: 11px; color: #ef4444; margin-top: 5px; }
        .issues { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; border-radius: 0 8px 8px 0; }
        .timestamp { text-align: center; color: #64748b; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
        .vercel-badge { background: #000; color: white; padding: 5px 10px; border-radius: 4px; font-size: 11px; display: inline-block; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${statusEmoji} AI Health Report - Vercel</h1>
            <p><strong>${timeString}</strong> | ${new Date().toDateString()}</p>
        </div>
        
        <div class="content">
            <div class="status-overview">
                <h2>${statusEmoji} System Status: ${healthData.overallStatus.toUpperCase()}</h2>
                <p>Automated health check via Vercel Cron Jobs</p>
                <span class="vercel-badge">⚡ Powered by Vercel</span>
            </div>

            <h3>🔍 API Health Details</h3>
            <div class="api-grid">
                ${apiCards}
            </div>

            ${healthData.issues.length > 0 ? `
            <h3>⚠️ Issues Detected</h3>
            <div class="issues">
                ${healthData.issues.map(issue => `<p>• ${issue}</p>`).join('')}
            </div>
            ` : `
            <div style="background: #d1fae5; border-left: 4px solid #22c55e; padding: 15px; margin: 15px 0; border-radius: 0 8px 8px 0;">
                <p><strong>✅ All Systems Operational</strong></p>
                <p>All APIs are responding normally. Your transcription service is running perfectly!</p>
            </div>
            `}

            <h3>📊 Next Health Checks</h3>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
                <p><strong>🕐 Automated Schedule:</strong></p>
                <p>• 12:00 AM, 12:20 AM, 7:00 AM, 10:00 AM, 12:00 PM, 3:00 PM, 10:00 PM</p>
                <p><strong>⚡ Serverless:</strong> Each check runs independently via Vercel Cron</p>
            </div>
        </div>
        
        <div class="timestamp">
            🤖 Generated via Vercel Cron | ${healthData.timestamp}<br>
            📧 Delivered to: ecouter.transcribe@gmail.com
        </div>
    </div>
</body>
</html>
    `;
  }
}

module.exports = { VercelAPIManager };