import { verifyTokenString, getTokenFromRequest } from '../../../utils/auth.js';
import { connectDB } from '../../../lib/mongodb.js';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  try {
    // Verify authentication
    const token = getTokenFromRequest(req);
    const decoded = verifyTokenString(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user ID from token
    const userId = decoded.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Invalid token - missing user ID' });
    }

    if (req.method === 'GET') {
      // Get files based on query parameters
      const { status, limit = 10, offset = 0 } = req.query;
      
      const { db } = await connectDB();
      
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
      
      // Calculate storage usage using aggregation for accuracy
      const storageAggregation = await db.collection('files').aggregate([
        { $match: { userId: userId } },
        { $group: { _id: null, totalSize: { $sum: '$size' } } }
      ]).toArray();

      const storageUsed = storageAggregation.length > 0 ? storageAggregation[0].totalSize : 0;
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
