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
    
    // Get all files for this user from MongoDB
    const allFiles = await db.collection('files').find({ userId }).toArray();
    const recentFiles = allFiles
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
    
    const processingFiles = allFiles.filter(file => file.status === 'processing');
    const completedFiles = allFiles.filter(file => file.status === 'completed');
    const errorFiles = allFiles.filter(file => file.status === 'error');
    
    // Calculate storage used
    const storageUsed = allFiles.reduce((total, file) => total + (file.size || 0), 0);
    const storageLimit = 1024 * 1024 * 1024; // 1GB in bytes
    
    // Calculate total minutes transcribed
    const totalMinutes = completedFiles.reduce((total, file) => {
      return total + (file.duration ? Math.ceil(file.duration / 60) : 0);
    }, 0);

    const stats = {
      totalTranscriptions: allFiles.length,
      completedTranscriptions: completedFiles.length,
      processingTranscriptions: processingFiles.length,
      errorTranscriptions: errorFiles.length,
      totalMinutes,
      storageUsed,
      storageLimit,
      storagePercentage: Math.round((storageUsed / storageLimit) * 100),
    };

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      },
      stats,
      recentFiles,
      recentActivity: recentFiles.map(file => ({
        id: file.id,
        name: file.name,
        status: file.status,
        createdAt: file.createdAt,
        type: getActivityType(file.status),
      })),
    });
    
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
