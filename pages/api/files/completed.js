import { filesDB } from '../../../utils/database.js';
import { verifyToken, getTokenFromRequest } from '../../../utils/auth.js';
import { connectDB } from '../../../lib/mongodb.js';

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
      // Get only completed files
      const userId = user.id || user._id.toString();
      
      // Use MongoDB directly instead of filesDB utility for consistency
      const files = await db.collection('files')
        .find({ userId, status: 'completed' })
        .sort({ createdAt: -1 })
        .toArray();
      
      // Convert ObjectId to string for frontend
      const formattedFiles = files.map(file => ({
        ...file,
        id: file._id.toString(),
        _id: undefined
      }));
      
      return res.status(200).json({ 
        files: formattedFiles,
        total: formattedFiles.length 
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
