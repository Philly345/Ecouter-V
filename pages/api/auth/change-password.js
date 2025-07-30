import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { connectToDatabase } from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
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
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    // Get current user - handle both ObjectId and string/numeric IDs
    let user;
    if (ObjectId.isValid(userId)) {
      user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    } else {
      user = await db.collection('users').findOne({ _id: userId });
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // Update password - handle both ObjectId and string/numeric IDs
    let result;
    if (ObjectId.isValid(userId)) {
      result = await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { 
          $set: { 
            password: hashedNewPassword,
            updatedAt: new Date()
          }
        }
      );
    } else {
      result = await db.collection('users').updateOne(
        { _id: userId },
        { 
          $set: { 
            password: hashedNewPassword,
            updatedAt: new Date()
          }
        }
      );
    }    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
}
