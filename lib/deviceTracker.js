import { connectDB } from './mongodb.js';
import crypto from 'crypto';

// Generate a device fingerprint based on multiple factors
export function generateDeviceFingerprint(req, userAgent, additionalData = {}) {
  const factors = [
    req.headers['user-agent'] || '',
    req.headers['accept-language'] || '',
    req.headers['accept-encoding'] || '',
    req.headers['accept'] || '',
    additionalData.screen || '',
    additionalData.timezone || '',
    additionalData.platform || '',
    additionalData.webgl || '',
    additionalData.canvas || '',
    additionalData.fonts || '',
  ];
  
  const fingerprint = factors.join('|');
  return crypto.createHash('sha256').update(fingerprint).digest('hex');
}

// Get multiple IP addresses (real IP, forwarded, etc.)
export function getClientIPs(req) {
  const ips = [];
  
  // Real IP
  if (req.connection?.remoteAddress) {
    ips.push(req.connection.remoteAddress);
  }
  
  // Forwarded IPs (common with proxies/load balancers)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    ips.push(...forwarded.split(',').map(ip => ip.trim()));
  }
  
  // Real IP headers
  if (req.headers['x-real-ip']) {
    ips.push(req.headers['x-real-ip']);
  }
  
  // Client IP
  if (req.headers['x-client-ip']) {
    ips.push(req.headers['x-client-ip']);
  }
  
  // Cluster client IP
  if (req.headers['x-cluster-client-ip']) {
    ips.push(req.headers['x-cluster-client-ip']);
  }
  
  // Remove duplicates and localhost
  return [...new Set(ips)].filter(ip => 
    ip && 
    ip !== '127.0.0.1' && 
    ip !== '::1' && 
    ip !== 'localhost'
  );
}

// Track user registration
export async function trackUserRegistration(email, req, deviceFingerprint, additionalData = {}) {
  try {
    const { db } = await connectDB();
    const ips = getClientIPs(req);
    
    const registrationRecord = {
      email,
      ips,
      deviceFingerprint,
      userAgent: req.headers['user-agent'] || '',
      timestamp: new Date(),
      additionalData,
      browserFingerprint: additionalData.browserFingerprint || null,
    };
    
    // Store in user_registrations collection
    await db.collection('user_registrations').insertOne(registrationRecord);
    
    return registrationRecord;
  } catch (error) {
    console.error('Error tracking user registration:', error);
    throw error;
  }
}

// Check if user can register (under the limit)
export async function canUserRegister(req, deviceFingerprint, additionalData = {}) {
  try {
    const { db } = await connectDB();
    const ips = getClientIPs(req);
    const ACCOUNT_LIMIT = 4;
    
    // Check multiple criteria
    const checks = [];
    
    // 1. Check by IP addresses
    if (ips.length > 0) {
      checks.push({
        ips: { $in: ips }
      });
    }
    
    // 2. Check by device fingerprint
    checks.push({
      deviceFingerprint: deviceFingerprint
    });
    
    // 3. Check by browser fingerprint if available
    if (additionalData.browserFingerprint) {
      checks.push({
        'additionalData.browserFingerprint': additionalData.browserFingerprint
      });
    }
    
    // 4. Check by user agent + screen combination
    if (additionalData.screen) {
      checks.push({
        userAgent: req.headers['user-agent'] || '',
        'additionalData.screen': additionalData.screen
      });
    }
    
    // Find existing registrations matching any criteria
    const existingRegistrations = await db.collection('user_registrations')
      .find({
        $or: checks
      })
      .toArray();
    
    // Get unique emails
    const uniqueEmails = [...new Set(existingRegistrations.map(reg => reg.email))];
    
    // Check if limit exceeded
    const accountCount = uniqueEmails.length;
    const canRegister = accountCount < ACCOUNT_LIMIT;
    
    return {
      canRegister,
      accountCount,
      accountLimit: ACCOUNT_LIMIT,
      existingEmails: canRegister ? [] : uniqueEmails, // Only return emails if limit exceeded
      matchedCriteria: existingRegistrations.map(reg => ({
        email: reg.email,
        timestamp: reg.timestamp,
        matchType: getMatchType(reg, ips, deviceFingerprint, additionalData)
      }))
    };
    
  } catch (error) {
    console.error('Error checking registration eligibility:', error);
    // In case of error, allow registration to prevent blocking legitimate users
    return {
      canRegister: true,
      accountCount: 0,
      accountLimit: 4,
      existingEmails: [],
      matchedCriteria: [],
      error: error.message
    };
  }
}

function getMatchType(registration, currentIPs, currentFingerprint, currentAdditionalData) {
  const matches = [];
  
  if (registration.ips?.some(ip => currentIPs.includes(ip))) {
    matches.push('IP');
  }
  
  if (registration.deviceFingerprint === currentFingerprint) {
    matches.push('Device');
  }
  
  if (registration.additionalData?.browserFingerprint === currentAdditionalData.browserFingerprint) {
    matches.push('Browser');
  }
  
  if (registration.additionalData?.screen === currentAdditionalData.screen) {
    matches.push('Screen');
  }
  
  return matches.join(', ');
}

// Clean up old registration records (optional - run periodically)
export async function cleanupOldRegistrations(daysOld = 90) {
  try {
    const { db } = await connectDB();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const result = await db.collection('user_registrations').deleteMany({
      timestamp: { $lt: cutoffDate }
    });
    
    console.log(`Cleaned up ${result.deletedCount} old registration records`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning up old registrations:', error);
    return 0;
  }
}