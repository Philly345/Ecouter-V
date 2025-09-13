import { verifyTokenString, getTokenFromRequest } from '../../../utils/auth.js';
import { connectDB } from '../../../lib/mongodb.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication (in production, you'd want admin role verification)
    const token = getTokenFromRequest(req);
    const decoded = verifyTokenString(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // TODO: Add admin role check here
    // if (!decoded.isAdmin) {
    //   return res.status(403).json({ error: 'Admin access required' });
    // }

    const { db } = await connectDB();
    
    // Get registration statistics
    const registrationStats = await db.collection('user_registrations').aggregate([
      {
        $group: {
          _id: null,
          totalRegistrations: { $sum: 1 },
          uniqueEmails: { $addToSet: '$email' },
          uniqueIPs: { $addToSet: '$ips' },
          uniqueDeviceFingerprints: { $addToSet: '$deviceFingerprint' }
        }
      }
    ]).toArray();

    // Get device access statistics  
    const deviceStats = await db.collection('user_devices').aggregate([
      {
        $group: {
          _id: null,
          totalDevices: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' },
          newDeviceAlerts: { $sum: { $cond: ['$isNew', 1, 0] } },
          totalAccesses: { $sum: '$accessCount' }
        }
      }
    ]).toArray();

    // Get recent registrations (last 24 hours)
    const recentRegistrations = await db.collection('user_registrations')
      .find({
        timestamp: { 
          $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) 
        }
      })
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();

    // Get recent device accesses (last 24 hours)
    const recentDeviceAccesses = await db.collection('user_devices')
      .find({
        lastSeen: { 
          $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) 
        },
        isNew: true
      })
      .sort({ lastSeen: -1 })
      .limit(50)
      .toArray();

    // Get suspicious activity (multiple accounts from same fingerprint)
    const suspiciousActivity = await db.collection('user_registrations').aggregate([
      {
        $group: {
          _id: '$deviceFingerprint',
          emails: { $addToSet: '$email' },
          count: { $sum: 1 },
          timestamps: { $push: '$timestamp' }
        }
      },
      {
        $match: { count: { $gte: 3 } }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 20
      }
    ]).toArray();

    const stats = {
      registration: {
        total: registrationStats[0]?.totalRegistrations || 0,
        uniqueEmails: registrationStats[0]?.uniqueEmails?.length || 0,
        uniqueIPs: registrationStats[0]?.uniqueIPs?.flat().filter(Boolean).length || 0,
        uniqueDevices: registrationStats[0]?.uniqueDeviceFingerprints?.length || 0
      },
      devices: {
        total: deviceStats[0]?.totalDevices || 0,
        uniqueUsers: deviceStats[0]?.uniqueUsers?.length || 0,
        newDeviceAlerts: deviceStats[0]?.newDeviceAlerts || 0,
        totalAccesses: deviceStats[0]?.totalAccesses || 0
      },
      recent: {
        registrations: recentRegistrations.map(reg => ({
          email: reg.email,
          timestamp: reg.timestamp,
          ips: reg.ips,
          deviceInfo: reg.additionalData?.browserFingerprint ? 'Has fingerprint' : 'No fingerprint'
        })),
        deviceAccesses: recentDeviceAccesses.map(device => ({
          email: device.email,
          deviceType: device.deviceInfo?.deviceType || 'Unknown',
          location: device.location ? `${device.location.city}, ${device.location.country}` : 'Unknown',
          ip: device.lastIP,
          timestamp: device.lastSeen
        }))
      },
      suspicious: suspiciousActivity.map(activity => ({
        deviceFingerprint: activity._id.substring(0, 16) + '...', // Truncate for privacy
        accountCount: activity.count,
        emails: activity.emails.map(email => {
          // Mask emails for privacy
          const parts = email.split('@');
          if (parts.length === 2) {
            const masked = parts[0].substring(0, 2) + '*'.repeat(Math.max(0, parts[0].length - 2));
            return `${masked}@${parts[1]}`;
          }
          return email;
        }),
        latestTimestamp: Math.max(...activity.timestamps.map(t => new Date(t).getTime()))
      }))
    };

    res.status(200).json({
      success: true,
      stats: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Security monitoring API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}