import { verifyToken, getTokenFromRequest } from '../../../utils/auth.js';
import { connectDB } from '../../../lib/mongodb.js';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
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

    if (req.method === 'GET') {
      // Get files based on query parameters
      const { status, limit = 10, offset = 0 } = req.query;
      
      // Use the user's string ID for file lookups
      const userId = user.id || user._id.toString();
      
      // Build MongoDB query
      let query = { userId: userId };
      if (status) {
        query.status = status;
      }
      
      // Get files from MongoDB
      const files = await db.collection('files')
        .find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(offset))
        .toArray();
      
      // Get total count for pagination
      const totalFiles = await db.collection('files').countDocuments(query);
      
      // Convert ObjectId to string for frontend
      const formattedFiles = files.map(file => ({
        ...file,
        id: file._id.toString(),
        _id: undefined
      }));
      
      // Calculate storage usage
      const storageUsed = files.reduce((total, file) => total + (file.size || 0), 0);
      const storageLimit = 1024 * 1024 * 1024; // 1GB in bytes
      
      res.status(200).json({
        success: true,
        files: formattedFiles,
        pagination: {
          total: totalFiles,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: totalFiles > parseInt(offset) + parseInt(limit),
        },
        storage: {
          used: storageUsed,
          limit: storageLimit,
          percentage: Math.round((storageUsed / storageLimit) * 100),
        },
      });
      
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Files API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
