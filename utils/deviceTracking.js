import crypto from 'crypto';

// Extract client IP address from request
export function getClientIP(req) {
  // Check for forwarded IPs (from proxies, load balancers)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  // Check for real IP (some proxy configurations)
  const realIP = req.headers['x-real-ip'];
  if (realIP) {
    return realIP;
  }
  
  // Check for CF-Connecting-IP (Cloudflare)
  const cfIP = req.headers['cf-connecting-ip'];
  if (cfIP) {
    return cfIP;
  }
  
  // Fall back to connection remote address
  return req.connection?.remoteAddress || 
         req.socket?.remoteAddress || 
         req.connection?.socket?.remoteAddress ||
         '0.0.0.0';
}

// Create device fingerprint from request headers
export function createDeviceFingerprint(req) {
  const userAgent = req.headers['user-agent'] || '';
  const acceptLanguage = req.headers['accept-language'] || '';
  const acceptEncoding = req.headers['accept-encoding'] || '';
  const accept = req.headers['accept'] || '';
  
  // Combine headers to create a unique fingerprint
  const fingerprint = [
    userAgent,
    acceptLanguage,
    acceptEncoding,
    accept
  ].join('|');
  
  // Hash the fingerprint for storage
  return crypto.createHash('sha256').update(fingerprint).digest('hex');
}

// Check if account limit is reached for IP/device
export async function checkAccountLimit(db, ip, deviceFingerprint) {
  const ACCOUNT_LIMIT = 4;
  
  try {
    // Count accounts created from this IP
    const ipCount = await db.collection('account_tracking').countDocuments({
      ip: ip,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    });
    
    // Count accounts created from this device fingerprint
    const deviceCount = await db.collection('account_tracking').countDocuments({
      deviceFingerprint: deviceFingerprint,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
    });
    
    // Use the higher count (more restrictive)
    const maxCount = Math.max(ipCount, deviceCount);
    
    return {
      limitReached: maxCount >= ACCOUNT_LIMIT,
      currentCount: maxCount,
      limit: ACCOUNT_LIMIT,
      ipCount,
      deviceCount
    };
  } catch (error) {
    console.error('Error checking account limit:', error);
    return {
      limitReached: false,
      currentCount: 0,
      limit: ACCOUNT_LIMIT,
      ipCount: 0,
      deviceCount: 0
    };
  }
}

// Track account creation
export async function trackAccountCreation(db, email, ip, deviceFingerprint, userId = null) {
  try {
    await db.collection('account_tracking').insertOne({
      email,
      userId,
      ip,
      deviceFingerprint,
      createdAt: new Date(),
      userAgent: null // Will be set from request if needed
    });
  } catch (error) {
    console.error('Error tracking account creation:', error);
  }
}

// Get existing accounts for IP/device (for display to user)
export async function getExistingAccounts(db, ip, deviceFingerprint) {
  try {
    // Get accounts from this IP/device
    const accounts = await db.collection('account_tracking').aggregate([
      {
        $match: {
          $or: [
            { ip: ip },
            { deviceFingerprint: deviceFingerprint }
          ],
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'email',
          foreignField: 'email',
          as: 'userInfo'
        }
      },
      {
        $project: {
          email: 1,
          createdAt: 1,
          userExists: { $gt: [{ $size: '$userInfo' }, 0] }
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]).toArray();
    
    return accounts.filter(acc => acc.userExists).map(acc => ({
      email: acc.email,
      createdAt: acc.createdAt
    }));
  } catch (error) {
    console.error('Error getting existing accounts:', error);
    return [];
  }
}