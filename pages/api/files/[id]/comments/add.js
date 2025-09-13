import { connectToDatabase } from '../../../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const { content, position, mentions, isTask, assignedTo, priority } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { db } = await connectToDatabase();

    // Verify user has access to comment
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

    // Get user info
    const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.userId) });

    // Create comment
    const comment = {
      id: new ObjectId().toString(),
      content,
      position: position || null,
      mentions: mentions || [],
      isTask: isTask || false,
      assignedTo: assignedTo || null,
      priority: priority || 'medium',
      status: isTask ? 'open' : null,
      author: {
        id: decoded.userId,
        email: user?.email || decoded.email,
        name: user?.name || user?.email?.split('@')[0] || 'Anonymous'
      },
      timestamp: new Date(),
      updatedAt: new Date(),
      resolved: false,
      replies: []
    };

    // Add comment to file
    await db.collection('files').updateOne(
      { _id: new ObjectId(id) },
      { 
        $push: { comments: comment },
        $set: { updatedAt: new Date() }
      }
    );

    // If it's a task, notify assigned user
    if (isTask && assignedTo) {
      // TODO: Send notification to assigned user
      console.log(`Task assigned to ${assignedTo}:`, content);
    }

    // If there are mentions, notify mentioned users
    if (mentions && mentions.length > 0) {
      // TODO: Send notifications to mentioned users
      console.log('Users mentioned:', mentions);
    }

    res.status(200).json({
      message: 'Comment added successfully',
      comment
    });

  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Failed to add comment' });
  }
}