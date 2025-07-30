import jwt from 'jsonwebtoken';
import { findUserById, updateUser } from '../../../lib/fileDatabase';

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
    
    console.log('🔍 Using file-based storage for userId:', userId);

    const { name, country, dateOfBirth } = req.body;

    const updateData = {};
    
    if (name && name.trim()) {
      updateData.name = name.trim();
    }
    
    if (country !== undefined) {
      updateData.country = country.trim();
    }
    
    if (dateOfBirth !== undefined) {
      updateData.dateOfBirth = dateOfBirth;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    // Update user in file
    const updatedUser = updateUser(userId, updateData);

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Remove sensitive data
    const { password, ...userWithoutPassword } = updatedUser;

    res.status(200).json({
      message: 'Profile updated successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Update profile error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
}
