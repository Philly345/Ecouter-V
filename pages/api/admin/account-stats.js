import { connectDB } from '../../../lib/mongodb.js';
import { verifyTokenString, getTokenFromRequest } from '../../../utils/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify admin access (you can customize this based on your admin system)
    const token = getTokenFromRequest(req);
    const decoded = verifyTokenString(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Add admin check here if needed
    // For now, only allow specific admin emails
    const adminEmails = ['philbertwanjiku@gmail.com']; // Add your admin emails
    if (!adminEmails.includes(decoded.email)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { db } = await connectDB();
    
    // Get account creation statistics
    const stats = await db.collection('user_registrations').aggregate([
      {
        $group: {
          _id: null,
          totalRegistrations: { $sum: 1 },
          uniqueEmails: { $addToSet: '$email' },
          uniqueIPs: { $addToSet: '$ips' },
          uniqueFingerprints: { $addToSet: '$deviceFingerprint' }
        }
      }
    ]).toArray();

    // Get registration activity over time
    const activityStats = await db.collection('user_registrations').aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$timestamp' },
            month: { $month: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' }
          },
          count: { $sum: 1 },
          emails: { $addToSet: '$email' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
      { $limit: 30 } // Last 30 days
    ]).toArray();

    // Get potential account limit violations
    const potentialViolations = await db.collection('user_registrations').aggregate([
      {
        $group: {
          _id: '$deviceFingerprint',
          emails: { $addToSet: '$email' },
          count: { $sum: 1 },
          ips: { $addToSet: '$ips' },
          firstRegistration: { $min: '$timestamp' },
          lastRegistration: { $max: '$timestamp' }
        }
      },
      { $match: { count: { $gte: 3 } } }, // 3 or more accounts from same device
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]).toArray();

    const totalStats = stats[0] || {
      totalRegistrations: 0,
      uniqueEmails: [],
      uniqueIPs: [],
      uniqueFingerprints: []
    };

    res.status(200).json({
      success: true,
      summary: {
        totalRegistrations: totalStats.totalRegistrations,
        uniqueAccounts: totalStats.uniqueEmails.length,
        uniqueIPs: totalStats.uniqueIPs.flat().length,
        uniqueDevices: totalStats.uniqueFingerprints.length,
        accountsPerDevice: totalStats.totalRegistrations / Math.max(1, totalStats.uniqueFingerprints.length),
      },
      dailyActivity: activityStats,
      potentialViolations: potentialViolations.map(violation => ({
        deviceFingerprint: violation._id.substring(0, 12) + '...', // Truncate for privacy
        accountCount: violation.count,
        emailCount: violation.emails.length,
        ipCount: violation.ips.flat().length,
        firstRegistration: violation.firstRegistration,
        lastRegistration: violation.lastRegistration,
        daysBetween: Math.ceil((violation.lastRegistration - violation.firstRegistration) / (1000 * 60 * 60 * 24))
      }))
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}