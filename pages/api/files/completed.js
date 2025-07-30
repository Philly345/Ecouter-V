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
      let files = filesDB.findByUserId(userId);
      
      // Filter for completed files
      files = files.filter(file => file.status === 'completed');
      
      // Sort by creation date (newest first)
      files.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      return res.status(200).json({ 
        files,
        total: files.length 
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
