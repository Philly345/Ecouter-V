import { connectToDatabase } from '../../../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  try {
    const { id } = req.query;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const dbConnection = await connectToDatabase();
    if (!dbConnection || !dbConnection.db) {
      return res.status(500).json({ message: 'Database connection failed' });
    }
    
    const { db } = dbConnection;

    // Verify user has access to view comments
    const file = await db.collection('files').findOne({
      _id: new ObjectId(id),
      $or: [
        { userId: decoded.userId },
        { 'collaborators.email': decoded.email, 'collaborators.status': 'active' }
      ]
    });

    if (!file) {
      return res.status(404).json({ message: 'File not found or access denied' });
    }

    const comments = file.comments || [];

    res.status(200).json({
      comments: comments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    });

  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Failed to get comments' });
  }
}