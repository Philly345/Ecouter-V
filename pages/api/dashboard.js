import { verifyTokenString, getTokenFromRequest } from '../../utils/auth.js';
import { connectDB } from '../../lib/mongodb.js';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  console.log('🚀 Dashboard API: Request received');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const token = getTokenFromRequest(req);
    console.log('🔑 Dashboard API: Token found:', !!token);
    
    if (!token) {
      console.log('❌ Dashboard API: No token provided');
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = verifyTokenString(token);
    console.log('🔍 Dashboard API: Token decoded successfully:', !!decoded);
    console.log('👤 Dashboard API: Decoded user info:', {
      userId: decoded?.userId,
      email: decoded?.email,
      name: decoded?.name
    });
    
    if (!decoded) {
      console.log('❌ Dashboard API: Invalid token');
      return res.status(401).json({ error: 'Invalid token' });
    }

    console.log('🔍 Dashboard API: Decoded token contains:', {
      userId: decoded.userId,
      email: decoded.email,
      name: decoded.name
    });

    // Find user in MongoDB using the userId from token
    const { db } = await connectDB();
    console.log('📡 Dashboard API: Connected to MongoDB');
    
    const user = await db.collection('users').findOne({ 
      _id: new ObjectId(decoded.userId) 
    });
    
    console.log('👤 Dashboard API: User lookup result:', !!user);
    if (user) {
      console.log('👤 Dashboard API: Found user:', {
        id: user._id.toString(),
        email: user.email,
        name: user.name
      });
    }
    
    if (!user) {
      console.log('❌ Dashboard API: User not found in database');
      return res.status(401).json({ error: 'User not found' });
    }

    // Use the userId from the token directly - this is what's stored in files
    const userId = decoded.userId;
    console.log('🔍 Dashboard API: Using userId for file lookup:', userId);
    
    try {
      console.log('🔍 Dashboard API: Starting data fetch for userId:', userId);
      
      // First, let's check if any files exist for this userId
      const fileCheck = await db.collection('files').countDocuments({ userId });
      console.log(`📊 Dashboard API: Found ${fileCheck} files for userId: ${userId}`);
      
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
      
      // Convert ObjectId to string for frontend compatibility
      const formattedRecentFiles = recentFiles.map(file => ({
        ...file,
        id: file._id.toString(),
        _id: undefined
      }));
      
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

      // Create enhanced recent activity with more details
      const recentActivity = formattedRecentFiles.slice(0, 5).map(file => {
        const now = new Date();
        const fileTime = new Date(file.updatedAt || file.createdAt);
        const timeDiff = now - fileTime;
        const isRecent = timeDiff < 300000; // 5 minutes
        
        let activityDescription = '';
        let activityType = '';
        
        switch (file.status) {
          case 'completed':
            activityDescription = `Successfully transcribed "${file.filename || file.name}"`;
            activityType = 'Transcription Complete';
            break;
          case 'processing':
            activityDescription = `Processing "${file.filename || file.name}"`;
            activityType = 'Transcription in Progress';
            break;
          case 'error':
            activityDescription = `Failed to transcribe "${file.filename || file.name}"`;
            activityType = 'Transcription Error';
            break;
          default:
            activityDescription = `Uploaded "${file.filename || file.name}"`;
            activityType = 'File Upload';
        }
        
        return {
          id: file.id,
          type: activityType,
          description: activityDescription,
          timestamp: file.updatedAt || file.createdAt,
          isRecent,
          fileId: file.id,
          fileName: file.filename || file.name,
          status: file.status,
          duration: file.duration,
          size: file.size
        };
      });

      console.log('✅ Dashboard API: Sending successful response');
      res.status(200).json({
        success: true,
        timestamp: new Date().toISOString(),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
        },
        stats: dashboardStats,
        recentFiles: formattedRecentFiles,
        recentActivity
      });
    } catch (dbError) {
      console.error('❌ Dashboard API: Database error:', dbError);
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
    console.error('❌ Dashboard API: General error:', error);
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
