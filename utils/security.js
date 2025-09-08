// Security middleware for user data access
import { verifyTokenString, getTokenFromRequest } from './auth.js';
import { connectDB } from '../lib/mongodb.js';
import { ObjectId } from 'mongodb';

export async function authenticateUser(req) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return { error: 'No token provided', status: 401 };
    }
    
    const decoded = verifyTokenString(token);
    if (!decoded || !decoded.userId) {
      return { error: 'Invalid token', status: 401 };
    }
    
    // Find user in MongoDB
    const { db } = await connectDB();
    const user = await db.collection('users').findOne({ 
      _id: new ObjectId(decoded.userId) 
    });
    
    if (!user) {
      return { error: 'User not found', status: 401 };
    }
    
    return { 
      user, 
      userId: decoded.userId,
      db 
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return { error: 'Authentication failed', status: 500 };
  }
}

export function validateFileOwnership(file, userId) {
  if (!file) {
    return { valid: false, error: 'File not found' };
  }
  
  if (file.userId !== userId) {
    console.error(`Access denied: File ${file._id} userId ${file.userId} doesn't match requesting user ${userId}`);
    return { valid: false, error: 'Access denied' };
  }
  
  return { valid: true };
}

export function createSecureQuery(userId, additionalFilters = {}) {
  return {
    userId,
    ...additionalFilters
  };
}