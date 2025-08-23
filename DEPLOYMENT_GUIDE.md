# AI Health Monitoring System - Production Deployment Guide

## 🚀 Quick Deployment to Your Main Website

### Step 1: Upload Files
Upload these files to your web server:
```
/lib/api-manager.cjs
/lib/health-scheduler.cjs
/lib/smart-transcription.cjs
/start-production.js
/package.json
/.env.local (with your environment variables)
```

### Step 2: Install Dependencies
```bash
npm install nodemailer dotenv
```

### Step 3: Set Environment Variables
Ensure your `.env.local` file on the server contains:
```env
# Email Configuration (already working)
SMTP_SERVER=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_LOGIN=91659a001@smtp-brevo.com
SMTP_PASSWORD=BTyhDskPG5jwCZdx
SMTP_SENDER=no-reply@ecouter.systems

# API Keys (already configured)
ASSEMBLYAI_API_KEY=c5156190d2c140dda9742eaad3f91e84
GLADIA_API_KEY=2382fea8-0215-4ab8-88c2-5779ed5a44fd
GEMINI_API_KEY=AIzaSyAL60bsNiihrVWW8vH3XClKRSXH3ExrWN0
DEEPSEEK_API_KEY=sk-a70e5d818b2d4ab89fe7f05093bb2da8
```

### Step 4: Start the System
```bash
# Option A: Run directly
node start-production.js

# Option B: Run with PM2 (recommended for always-on)
npm install -g pm2
pm2 start start-production.js --name "ai-health-monitor"
pm2 save
pm2 startup
```

### Step 5: Verify It's Working
- Check the console output for "System is now running in production mode!"
- You should receive a startup notification email
- Health reports will be sent automatically at scheduled times

## 🔧 Alternative: Integrate with Your Next.js App

If you want to run it alongside your existing Next.js application:

### Add to your main Next.js app:
1. Copy the `/lib/` folder to your existing project
2. Add this to your main app startup (e.g., in `pages/api/health/start.js`):

```javascript
// pages/api/health/start.js
import { getAPIManager } from '../../../lib/api-manager.cjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const apiManager = getAPIManager();
    res.status(200).json({ 
      message: 'AI Health Monitoring started',
      status: 'running'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

Then call this endpoint once when your app starts to initialize the monitoring.

## 🌐 Hosting Recommendations

### Your Current Website (Best Option)
- **Cost**: $0 (uses existing hosting)
- **Setup**: Upload files and run the script
- **Reliability**: Depends on your current hosting uptime

### Railway (Alternative)
- **Cost**: ~$5/month
- **Setup**: Connect GitHub repo, deploy automatically
- **Reliability**: 99.9% uptime guaranteed
- **Benefits**: Automatic restarts, logs, monitoring

### DigitalOcean Droplet (Advanced)
- **Cost**: $4-12/month
- **Setup**: Manual server configuration
- **Reliability**: 99.99% uptime
- **Benefits**: Full control, can run multiple services

## ✅ Recommended Approach

**For immediate deployment**: Use your existing website hosting and run `node start-production.js` as a background process.

**For long-term reliability**: Consider Railway or DigitalOcean for dedicated hosting with automatic restarts and monitoring.

## 🔍 Monitoring & Logs

Once deployed, you can:
- Check logs to see system status
- Receive email reports 7 times daily
- Use the `/admin/health` dashboard for real-time monitoring
- Get instant alerts for any critical issues

The system is designed to be self-healing and will automatically handle most issues without intervention!