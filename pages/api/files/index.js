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
      // Get files based on query parameters - optimized defaults
      const { status, limit = 50, offset = 0 } = req.query;
      
      try {
        const connection = await connectDB();
        if (!connection || !connection.db) {
          throw new Error('Failed to establish database connection');
        }
        const { db } = connection;
      
      // Build MongoDB query
      let query = { userId: userId };
      if (status && status !== 'all') {
        // Handle multiple status values separated by comma
        if (status.includes(',')) {
          const statusList = status.split(',').map(s => s.trim());
          query.status = { $in: statusList };
        } else {
          query.status = status;
        }
      }
      
      // Get files from MongoDB with optimized projection
      const files = await db.collection('files')
        .find(query, {
          projection: {
            // Only include the fields we need (inclusion projection)
            name: 1,
            status: 1,
            createdAt: 1,
            size: 1,
            duration: 1,
            transcript: 1,
            summary: 1,
            language: 1,
            format: 1,
            userId: 1,
            fileUrl: 1,
            _id: 1
            // Exclude large binary fields by not including them
            // MongoDB will automatically exclude fields not listed in inclusion projection
          }
        })
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
        _id: file._id.toString() // Keep both for compatibility
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
        
      } catch (dbError) {
        console.error('Database error in files API:', dbError);
        return res.status(500).json({ 
          error: 'Database connection failed', 
          message: dbError.message 
        });
      }
      
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Files API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
