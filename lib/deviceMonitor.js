import { connectDB } from './mongodb.js';
import { sendEmail } from '../utils/email.js';
import { getClientIPs, generateDeviceFingerprint } from './deviceTracker.js';

// Parse User-Agent to extract device information
export function parseUserAgent(userAgent) {
  const ua = userAgent || '';
  
  // Device type detection
  let deviceType = 'Desktop';
  if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    if (/iPad/i.test(ua)) {
      deviceType = 'Tablet';
    } else {
      deviceType = 'Mobile';
    }
  } else if (/Tablet/i.test(ua)) {
    deviceType = 'Tablet';
  }
  
  // Operating System detection
  let os = 'Unknown';
  if (/Windows NT 10.0/i.test(ua)) os = 'Windows 10/11';
  else if (/Windows NT 6.3/i.test(ua)) os = 'Windows 8.1';
  else if (/Windows NT 6.2/i.test(ua)) os = 'Windows 8';
  else if (/Windows NT 6.1/i.test(ua)) os = 'Windows 7';
  else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Mac OS X 10[._]15/i.test(ua)) os = 'macOS Catalina+';
  else if (/Mac OS X 10[._]14/i.test(ua)) os = 'macOS Mojave';
  else if (/Mac OS X 10[._]13/i.test(ua)) os = 'macOS High Sierra';
  else if (/Mac OS X/i.test(ua)) os = 'macOS';
  else if (/iPhone OS/i.test(ua)) os = 'iOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Linux/i.test(ua)) os = 'Linux';
  else if (/Ubuntu/i.test(ua)) os = 'Ubuntu';
  
  // Browser detection
  let browser = 'Unknown';
  if (/Edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) browser = 'Google Chrome';
  else if (/Chromium\//i.test(ua)) browser = 'Chromium';
  else if (/Firefox\//i.test(ua)) browser = 'Mozilla Firefox';
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Opera|OPR\//i.test(ua)) browser = 'Opera';
  
  // Device model detection (basic)
  let deviceModel = 'Unknown';
  if (/iPhone/i.test(ua)) {
    const match = ua.match(/iPhone OS (\d+_\d+)/);
    deviceModel = match ? `iPhone (iOS ${match[1].replace('_', '.')})` : 'iPhone';
  } else if (/iPad/i.test(ua)) {
    deviceModel = 'iPad';
  } else if (/Android/i.test(ua)) {
    const modelMatch = ua.match(/Android[^;]*;\s*([^)]*)\)/);
    deviceModel = modelMatch ? `Android (${modelMatch[1].trim()})` : 'Android Device';
  } else if (/Windows/i.test(ua)) {
    deviceModel = 'Windows PC';
  } else if (/Mac/i.test(ua)) {
    deviceModel = 'Mac Computer';
  } else if (/Linux/i.test(ua)) {
    deviceModel = 'Linux Computer';
  }
  
  return {
    deviceType,
    os,
    browser,
    deviceModel,
    userAgent: ua
  };
}

// Get approximate location from IP (you may want to integrate with a real geolocation service)
export async function getLocationFromIP(ip) {
  try {
    // Using a free IP geolocation service
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,isp,org,query`);
    const data = await response.json();
    
    if (data.status === 'success') {
      return {
        country: data.country || 'Unknown',
        region: data.regionName || 'Unknown',
        city: data.city || 'Unknown',
        isp: data.isp || 'Unknown',
        org: data.org || 'Unknown',
        ip: data.query || ip
      };
    }
  } catch (error) {
    console.error('Geolocation lookup failed:', error);
  }
  
  // Fallback location info
  return {
    country: 'Unknown',
    region: 'Unknown', 
    city: 'Unknown',
    isp: 'Unknown',
    org: 'Unknown',
    ip: ip
  };
}

// Check if this is a new device for the user
export async function isNewDevice(userId, deviceFingerprint, userAgent, clientIP) {
  try {
    const { db } = await connectDB();
    
    // Look for existing device records for this user
    const existingDevice = await db.collection('user_devices').findOne({
      userId: userId,
      $or: [
        { deviceFingerprint: deviceFingerprint },
        { 
          userAgent: userAgent,
          lastIP: clientIP 
        }
      ]
    });
    
    return !existingDevice;
  } catch (error) {
    console.error('Error checking device:', error);
    return true; // Assume new device if error occurs
  }
}

// Track device access
export async function trackDeviceAccess(userId, email, req, deviceFingerprint) {
  try {
    const { db } = await connectDB();
    const ips = getClientIPs(req);
    const primaryIP = ips[0] || 'Unknown';
    const userAgent = req.headers['user-agent'] || '';
    
    // Parse device information
    const deviceInfo = parseUserAgent(userAgent);
    
    // Check if this is a new device
    const isNew = await isNewDevice(userId, deviceFingerprint, userAgent, primaryIP);
    
    // Get location info
    let location = null;
    if (primaryIP && primaryIP !== 'Unknown') {
      location = await getLocationFromIP(primaryIP);
    }
    
    // Create device record
    const deviceRecord = {
      userId: userId,
      email: email,
      deviceFingerprint: deviceFingerprint,
      userAgent: userAgent,
      deviceInfo: deviceInfo,
      lastIP: primaryIP,
      allIPs: ips,
      location: location,
      firstSeen: new Date(),
      lastSeen: new Date(),
      accessCount: 1,
      isNew: isNew
    };
    
    // Update or insert device record
    await db.collection('user_devices').updateOne(
      {
        userId: userId,
        deviceFingerprint: deviceFingerprint
      },
      {
        $set: {
          email: email,
          userAgent: userAgent,
          deviceInfo: deviceInfo,
          lastIP: primaryIP,
          lastSeen: new Date(),
          location: location
        },
        $addToSet: {
          allIPs: { $each: ips }
        },
        $inc: {
          accessCount: 1
        },
        $setOnInsert: {
          firstSeen: new Date(),
          isNew: isNew
        }
      },
      { upsert: true }
    );
    
    // Send security alert if this is a new device
    if (isNew) {
      await sendSecurityAlert(email, deviceRecord);
    }
    
    return {
      isNewDevice: isNew,
      deviceInfo: deviceInfo,
      location: location,
      ip: primaryIP
    };
    
  } catch (error) {
    console.error('Error tracking device access:', error);
    return {
      isNewDevice: false,
      deviceInfo: null,
      location: null,
      ip: null,
      error: error.message
    };
  }
}

// Send security alert email
export async function sendSecurityAlert(email, deviceRecord) {
  try {
    const { deviceInfo, location, lastIP, firstSeen } = deviceRecord;
    
    // Format location string
    let locationStr = 'Unknown location';
    if (location && location.city !== 'Unknown') {
      locationStr = `${location.city}, ${location.region}, ${location.country}`;
      if (location.isp !== 'Unknown') {
        locationStr += ` (${location.isp})`;
      }
    }
    
    // Format device string
    let deviceStr = 'Unknown device';
    if (deviceInfo) {
      deviceStr = `${deviceInfo.deviceModel} using ${deviceInfo.browser} on ${deviceInfo.os}`;
    }
    
    // Format date
    const accessDate = firstSeen.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
    
    const subject = '🔐 New Device Access Alert - Ecouter Account';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              line-height: 1.6; 
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f5f5f5;
            }
            .container { 
              max-width: 600px; 
              margin: 20px auto; 
              background: white;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header { 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
              color: white; 
              padding: 30px 20px; 
              text-align: center;
            }
            .header h1 { 
              margin: 0; 
              font-size: 24px; 
              font-weight: 600;
            }
            .content { 
              padding: 30px 20px; 
            }
            .alert-box {
              background: #fff3cd;
              border: 1px solid #ffeaa7;
              border-radius: 6px;
              padding: 20px;
              margin: 20px 0;
            }
            .device-info {
              background: #f8f9fa;
              border-radius: 6px;
              padding: 20px;
              margin: 20px 0;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 8px 0;
              border-bottom: 1px solid #e9ecef;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .label {
              font-weight: 600;
              color: #495057;
            }
            .value {
              color: #6c757d;
              text-align: right;
              max-width: 60%;
              word-break: break-word;
            }
            .footer { 
              background: #f8f9fa; 
              padding: 20px; 
              text-align: center; 
              color: #6c757d; 
              font-size: 14px;
            }
            .btn {
              display: inline-block;
              padding: 12px 24px;
              background: #667eea;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              margin: 20px 10px 0 0;
            }
            .btn-secondary {
              background: #6c757d;
            }
            .security-tips {
              background: #e3f2fd;
              border-left: 4px solid #2196f3;
              padding: 15px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Security Alert</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">New device access detected</p>
            </div>
            
            <div class="content">
              <div class="alert-box">
                <h3 style="margin: 0 0 10px 0; color: #856404;">New Device Access Detected</h3>
                <p style="margin: 0; color: #856404;">
                  Your Ecouter account was accessed from a new device. If this was you, no action is needed. 
                  If you don't recognize this activity, please secure your account immediately.
                </p>
              </div>
              
              <h3>Access Details:</h3>
              <div class="device-info">
                <div class="info-row">
                  <span class="label">📧 Account:</span>
                  <span class="value">${email}</span>
                </div>
                <div class="info-row">
                  <span class="label">⏰ Time:</span>
                  <span class="value">${accessDate}</span>
                </div>
                <div class="info-row">
                  <span class="label">📱 Device:</span>
                  <span class="value">${deviceStr}</span>
                </div>
                <div class="info-row">
                  <span class="label">🌍 Location:</span>
                  <span class="value">${locationStr}</span>
                </div>
                <div class="info-row">
                  <span class="label">🌐 IP Address:</span>
                  <span class="value">${lastIP}</span>
                </div>
              </div>
              
              <div class="security-tips">
                <h4 style="margin: 0 0 10px 0; color: #1976d2;">🛡️ Security Recommendations:</h4>
                <ul style="margin: 0; padding-left: 20px; color: #1976d2;">
                  <li>Change your password if you don't recognize this access</li>
                  <li>Enable two-factor authentication for added security</li>
                  <li>Review your recent account activity</li>
                  <li>Use strong, unique passwords for all accounts</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://ecoutertranscribe.tech/dashboard" class="btn">View Account Dashboard</a>
                <a href="https://ecoutertranscribe.tech/settings/security" class="btn btn-secondary">Security Settings</a>
              </div>
              
              <p style="font-size: 14px; color: #6c757d; text-align: center; margin: 30px 0 0 0;">
                If you didn't sign in from this device, please 
                <a href="https://ecoutertranscribe.tech/support" style="color: #667eea;">contact support</a> 
                immediately.
              </p>
            </div>
            
            <div class="footer">
              <p style="margin: 0;">
                This is an automated security notification from 
                <strong>Ecouter Transcribe</strong>
              </p>
              <p style="margin: 5px 0 0 0;">
                Please do not reply to this email. This mailbox is not monitored.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    const textContent = `
🔐 SECURITY ALERT - New Device Access Detected

Your Ecouter account was accessed from a new device:

Account: ${email}
Time: ${accessDate}
Device: ${deviceStr}
Location: ${locationStr}
IP Address: ${lastIP}

If this was you, no action is needed. If you don't recognize this activity, please:
1. Change your password immediately
2. Review your account activity
3. Contact support if needed

Visit: https://ecoutertranscribe.tech/dashboard

This is an automated security notification. Please do not reply to this email.
    `;
    
    const emailResult = await sendEmail({
      to: email,
      subject: subject,
      text: textContent,
      html: htmlContent
    });
    
    if (emailResult.success) {
      console.log('✅ Security alert sent successfully to:', email);
    } else {
      console.error('❌ Failed to send security alert to:', email, emailResult.error);
    }
    
    return emailResult;
    
  } catch (error) {
    console.error('Error sending security alert:', error);
    return { success: false, error: error.message };
  }
}

// Get user's device history
export async function getUserDevices(userId) {
  try {
    const { db } = await connectDB();
    
    const devices = await db.collection('user_devices')
      .find({ userId: userId })
      .sort({ lastSeen: -1 })
      .toArray();
    
    return devices.map(device => ({
      id: device._id.toString(),
      deviceInfo: device.deviceInfo,
      location: device.location,
      lastIP: device.lastIP,
      firstSeen: device.firstSeen,
      lastSeen: device.lastSeen,
      accessCount: device.accessCount,
      isCurrentDevice: false // This would need to be determined by comparing current fingerprint
    }));
    
  } catch (error) {
    console.error('Error getting user devices:', error);
    return [];
  }
}

// Clean up old device records (run periodically)
export async function cleanupOldDevices(daysOld = 90) {
  try {
    const { db } = await connectDB();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const result = await db.collection('user_devices').deleteMany({
      lastSeen: { $lt: cutoffDate }
    });
    
    console.log(`Cleaned up ${result.deletedCount} old device records`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning up old devices:', error);
    return 0;
  }
}