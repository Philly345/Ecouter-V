# 🤖 AI API Management & Auto-Debug System

## 🎯 Overview

This intelligent system automatically manages your APIs, detects issues, and sends email alerts when manual intervention is needed. It's designed for busy developers who manage multiple systems and need automated reliability.

## ✨ Features

### 🔄 **Smart API Rotation**
- Monitors API usage in real-time
- Automatically switches to backup APIs when limits are reached
- Cycles through: AssemblyAI → Gladia → Gemini → DeepSeek → AssemblyAI
- Prevents service interruptions

### 🛠️ **Auto-Debug System**
- Detects common errors automatically
- Fixes rate limits, API key issues, network timeouts
- Attempts up to 3 automatic fixes before alerting you
- Learns from error patterns

### 📧 **Smart Email Alerts**
- Sends alerts to `ecouter.transcribe@gmail.com`
- Beautiful HTML reports with system status
- Only alerts when auto-fix fails
- Daily health reports

### 📊 **Real-Time Monitoring**
- Live dashboard at `/admin/health`
- API usage tracking
- Error monitoring
- Performance metrics

## 🚀 Quick Setup

### 1. Run Setup Script
```bash
# Windows
./setup-ai-system.bat

# Linux/Mac
chmod +x setup-ai-system.sh
./setup-ai-system.sh
```

### 2. Configure API Keys
Edit `.env.local`:
```env
# API Keys
ASSEMBLYAI_API_KEY=your_key_here
GLADIA_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
DEEPSEEK_API_KEY=your_key_here

# Email Alerts
SMTP_SENDER=your_gmail@gmail.com
SMTP_PASSWORD=your_app_password
ALERT_EMAIL=ecouter.transcribe@gmail.com
```

### 3. Test the System
```bash
npm run ai:test
```

### 4. Start Development
```bash
npm run dev
# Visit: http://localhost:3000/admin/health
```

## 📋 How It Works

### 🔍 **API Usage Monitoring**
The system tracks:
- API requests per month
- Usage percentages
- Error rates
- Response times

When an API reaches 85% usage, it automatically switches to the next available API.

### 🤖 **Auto-Debug Patterns**

#### Rate Limit Errors
```
Error: rate limit exceeded
Fix: Switch to backup API
```

#### API Key Issues
```
Error: invalid api key
Fix: Rotate to working API
```

#### Network Timeouts
```
Error: timeout
Fix: Retry with exponential backoff
```

#### Database Issues
```
Error: MongoError
Fix: Reconnection attempt
```

### 📧 **Email Alert Types**

#### Critical Alerts (Manual Intervention Needed)
- All APIs depleted
- Auto-debug failed 3 times
- System-wide failures

#### Info Alerts (FYI)
- API auto-switched
- System recovered
- Performance warnings

#### Daily Reports
- Usage statistics
- Auto-fix summary
- Health overview

## 🛠️ Usage Examples

### Basic Transcription (Auto-Managed)
```javascript
import { getTranscriptionService } from './lib/smart-transcription';

const service = getTranscriptionService();
const result = await service.transcribeAudio('audio.mp3', {
  speakerDetection: true,
  quality: 'enhanced'
});

// System automatically:
// 1. Checks API usage
// 2. Switches APIs if needed
// 3. Handles errors
// 4. Sends alerts if issues
```

### Translation with Auto-Management
```javascript
const translation = await service.translateText(
  'Hello world', 
  'es', 
  'en'
);
// Auto-switches between Gemini/DeepSeek based on usage
```

### Manual API Management
```javascript
import { getAPIManager } from './lib/api-manager';

const manager = getAPIManager();

// Check current status
const health = await manager.getSystemHealth();
const apis = await manager.getAPIStatus();

// Force API switch
const newAPI = await manager.switchToNextAPI('assemblyai');

// Record custom error
await manager.recordAPIError('gemini', new Error('Custom error'));
```

## 📊 Dashboard Features

### System Overview
- Real-time health status
- Auto-fix statistics
- Success rates
- Current active API

### API Management
- Usage bars for each API
- Error counts
- Active/inactive status
- Last error details

### Performance Metrics
- Response times
- Uptime statistics
- Error rates
- Auto-recovery rates

### Quick Actions
- Force API switch
- Send test alerts
- Clear debug cache
- Refresh data

## 🎛️ Configuration Options

### API Limits (in `.env.local`)
```env
ASSEMBLYAI_MONTHLY_LIMIT=1000000
GLADIA_MONTHLY_LIMIT=500000
GEMINI_MONTHLY_LIMIT=2000000
DEEPSEEK_MONTHLY_LIMIT=1500000
```

### Alert Thresholds
```env
CRITICAL_ALERT_THRESHOLD=90  # Send alert at 90% usage
AUTO_SWITCH_THRESHOLD=85     # Auto-switch at 85% usage
```

### Monitoring Intervals
```env
HEALTH_CHECK_INTERVAL=30000     # Check every 30 seconds
API_RESET_CHECK_INTERVAL=3600000 # Check resets hourly
```

## 📧 Email Setup (Gmail)

### 1. Enable 2-Factor Authentication
Go to your Google Account settings and enable 2FA.

### 2. Generate App Password
1. Go to Google Account Settings
2. Security → 2-Step Verification
3. App Passwords
4. Generate password for "Mail"
5. Use this password in `SMTP_PASSWORD`

### 3. Configure in `.env.local`
```env
SMTP_SENDER=your_gmail@gmail.com
SMTP_PASSWORD=16_character_app_password
ALERT_EMAIL=ecouter.transcribe@gmail.com
```

## 🔧 CLI Commands

```bash
# Test the AI system
npm run ai:test

# Check system health
npm run ai:health

# View API status
npm run ai:status

# Force API switch (optional: specify current API)
npm run ai:switch
npm run ai:switch assemblyai

# Start dev server with AI info
npm run dev:ai
```

## 🚨 Troubleshooting

### APIs Not Switching
- Check API key validity
- Verify usage limits in config
- Check network connectivity

### Email Alerts Not Working
- Verify Gmail app password
- Check SMTP configuration
- Test with simpler email service

### Dashboard Not Loading
- Ensure all dependencies installed
- Check for JavaScript errors
- Verify API endpoints accessible

### Auto-Debug Not Working
- Check error patterns in logs
- Verify API keys are valid
- Ensure network connectivity

## 📈 Monitoring Best Practices

### 1. Daily Checks
- Review health dashboard
- Check email alerts
- Monitor API usage

### 2. Weekly Reviews
- Analyze auto-fix patterns
- Review API performance
- Update usage limits if needed

### 3. Monthly Maintenance
- Review API quotas
- Update API keys if needed
- Clean up old logs

## 🔐 Security Considerations

### API Key Management
- Store keys in environment variables
- Rotate keys regularly
- Monitor for unauthorized usage

### Email Security
- Use app-specific passwords
- Enable 2FA on email account
- Monitor alert frequency

### Dashboard Access
- Secure admin routes
- Use authentication if needed
- Monitor access logs

## 🚀 Advanced Features

### Custom Error Patterns
```javascript
// Add custom auto-fix patterns
apiManager.addAutoFixPattern(/custom error/, async (error, context) => {
  // Your custom fix logic
  return true; // Return true if fixed
});
```

### Webhook Integration
```javascript
// Add webhook notifications
apiManager.addWebhook('slack', process.env.SLACK_WEBHOOK_URL);
apiManager.addWebhook('discord', process.env.DISCORD_WEBHOOK_URL);
```

### Custom Metrics
```javascript
// Track custom metrics
apiManager.recordCustomMetric('transcription_time', duration);
apiManager.recordCustomMetric('file_size', fileSize);
```

## 📞 Support

### Getting Help
1. Check the dashboard for system status
2. Review email alerts for specific errors
3. Run `npm run ai:test` for diagnostics
4. Check logs in the `logs/` directory

### Common Issues
- **API Quota Exceeded**: System auto-switches APIs
- **Network Issues**: Auto-retry with backoff
- **Database Errors**: Auto-reconnection attempts
- **Email Delivery**: Check SMTP configuration

### Emergency Procedures
If all systems fail:
1. Check the dashboard at `/admin/health`
2. Manually switch APIs via CLI
3. Check email for critical alerts
4. Review system logs

## 🎉 Benefits

### For Busy Developers
- **Set and Forget**: System manages itself
- **Email Notifications**: Only when you need to act
- **Auto-Recovery**: 90%+ issues fixed automatically
- **Multiple Systems**: Manage many projects easily

### For Business Reliability
- **Zero Downtime**: Automatic API switching
- **Cost Optimization**: Smart usage management
- **Error Prevention**: Proactive monitoring
- **Detailed Reporting**: Complete visibility

### For Peace of Mind
- **24/7 Monitoring**: Never miss an issue
- **Intelligent Alerts**: Only critical issues
- **Auto-Documentation**: All events logged
- **Easy Recovery**: Simple troubleshooting

---

## 🚀 Get Started Now!

1. Run the setup script: `./setup-ai-system.bat`
2. Configure your API keys in `.env.local`
3. Test the system: `npm run ai:test`
4. Start the server: `npm run dev`
5. Visit the dashboard: `http://localhost:3000/admin/health`

**Your intelligent AI system is ready! 🤖✨**