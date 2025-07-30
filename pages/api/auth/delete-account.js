import jwt from 'jsonwebtoken';
import { connectToDatabase } from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const { db } = await connectToDatabase();

    // Delete all user's files first - handle both ObjectId and string/numeric IDs
    if (ObjectId.isValid(userId)) {
      await db.collection('files').deleteMany({ userId: new ObjectId(userId) });
    } else {
      await db.collection('files').deleteMany({ userId: userId });
    }

    // Delete the user - handle both ObjectId and string/numeric IDs
    let result;
    if (ObjectId.isValid(userId)) {
      result = await db.collection('users').deleteOne({ _id: new ObjectId(userId) });
    } else {
      result = await db.collection('users').deleteOne({ _id: userId });
    }

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
}
