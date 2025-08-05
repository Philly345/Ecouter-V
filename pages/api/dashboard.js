import { verifyToken, getTokenFromRequest } from '../../utils/auth.js';
import { connectDB } from '../../lib/mongodb.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const token = getTokenFromRequest(req);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find user in MongoDB
    const { db } = await connectDB();
    const user = await db.collection('users').findOne({ email: decoded.email });
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Get dashboard statistics using the user's string ID for file lookups
    const userId = user.id || user._id.toString();
    
    try {
      console.log('🔍 Dashboard API: Starting data fetch for userId:', userId);
      
      // Use aggregation pipeline for better performance
      const [statsResult, recentFiles] = await Promise.all([
        // Get aggregated stats in one query
        db.collection('files').aggregate([
          { $match: { userId } },
          {
            $group: {
              _id: null,
              totalFiles: { $sum: 1 },
              totalSize: { $sum: { $ifNull: ['$size', 0] } },
              totalDuration: { $sum: { $ifNull: ['$duration', 0] } },
              processingCount: {
                $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] }
              },
              completedCount: {
                $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
              },
              errorCount: {
                $sum: { $cond: [{ $eq: ['$status', 'error'] }, 1, 0] }
              }
            }
          }
        ]).toArray(),
        
        // Get recent files in separate optimized query
        db.collection('files')
          .find({ userId })
          .sort({ createdAt: -1 })
          .limit(5)
          .toArray()
      ]);
      
      const stats = statsResult[0] || {
        totalFiles: 0,
        totalSize: 0,
        totalDuration: 0,
        processingCount: 0,
        completedCount: 0,
        errorCount: 0
      };
      
      console.log('📊 Dashboard API: Raw stats from DB:', stats);
      console.log('📁 Dashboard API: Recent files count:', recentFiles.length);
      
      const storageUsed = stats.totalSize;
      const storageLimit = 1024 * 1024 * 1024; // 1GB in bytes
      const totalMinutes = Math.ceil(stats.totalDuration / 60);

      const dashboardStats = {
        totalTranscriptions: stats.totalFiles,
        completedTranscriptions: stats.completedCount,
        processingTranscriptions: stats.processingCount,
        errorTranscriptions: stats.errorCount,
        totalMinutes,
        storageUsed,
        storageLimit,
        storagePercentage: Math.round((storageUsed / storageLimit) * 100),
      };
      
      console.log('🎆 Dashboard API: Final stats being returned:', dashboardStats);

      // Create recent activity from recent files
      const recentActivity = recentFiles.slice(0, 3).map(file => ({
        id: file._id,
        type: getActivityType(file.status),
        description: `${file.status === 'completed' ? 'Completed' : file.status === 'processing' ? 'Processing' : 'Error in'} transcription of ${file.filename}`,
        timestamp: file.createdAt || file.updatedAt
      }));

      res.status(200).json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
        },
        stats: dashboardStats,
        recentFiles,
        recentActivity
      });
    } catch (dbError) {
      console.error('Database error in dashboard:', dbError);
      // Return empty data instead of error to prevent infinite loading
      res.status(200).json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
        },
        stats: {
          totalTranscriptions: 0,
          completedTranscriptions: 0,
          processingTranscriptions: 0,
          errorTranscriptions: 0,
          totalMinutes: 0,
          storageUsed: 0,
          storageLimit: 1024 * 1024 * 1024,
          storagePercentage: 0
        },
        recentFiles: [],
        recentActivity: []
      });
    }
  } catch (error) {
    console.error('Dashboard API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

function getActivityType(status) {
  switch (status) {
    case 'completed':
      return 'Transcription completed';
    case 'processing':
      return 'Transcription in progress';
    case 'error':
      return 'Transcription failed';
    default:
      return 'File uploaded';
  }
}
