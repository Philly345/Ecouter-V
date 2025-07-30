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
    
    console.log('🔍 Decoded userId:', userId, 'Type:', typeof userId, 'Length:', userId?.length);

    const { db } = await connectToDatabase();
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

    updateData.updatedAt = new Date();

    // Update user profile - handle both ObjectId and string/numeric IDs
    let result;
    if (ObjectId.isValid(userId)) {
      // MongoDB ObjectId format
      result = await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { 
          $set: updateData
        }
      );
    } else {
      // String or numeric ID format (from file system or migrated data)
      result = await db.collection('users').updateOne(
        { _id: userId },
        { 
          $set: updateData
        }
      );
    }

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get updated user - handle both ObjectId and string/numeric IDs
    let updatedUser;
    if (ObjectId.isValid(userId)) {
      // MongoDB ObjectId format
      updatedUser = await db.collection('users').findOne(
        { _id: new ObjectId(userId) },
        { projection: { password: 0 } }
      );
    } else {
      // String or numeric ID format
      updatedUser = await db.collection('users').findOne(
        { _id: userId },
        { projection: { password: 0 } }
      );
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
}
