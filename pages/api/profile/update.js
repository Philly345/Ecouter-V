import jwt from 'jsonwebtoken';
import { connectToDatabase } from '../../../lib/mongodb';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const { db } = await connectToDatabase();
    const { name, currentPassword, newPassword } = req.body;

    // Find the user
    const user = await db.collection('users').findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updateData = {};

    // Update name if provided
    if (name && name.trim() !== '') {
      updateData.name = name.trim();
    }

    // Update password if provided
    if (newPassword && newPassword.trim() !== '') {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to change password' });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      // Hash new password
      const saltRounds = 10;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
      updateData.password = hashedNewPassword;
    }

    // Update user in database
    if (Object.keys(updateData).length > 0) {
      updateData.updatedAt = new Date();
      await db.collection('users').updateOne(
        { _id: userId },
        { $set: updateData }
      );
    }

    // Return updated user info (excluding password)
    const updatedUser = await db.collection('users').findOne(
      { _id: userId },
      { projection: { password: 0 } }
    );

    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Profile update error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
}
