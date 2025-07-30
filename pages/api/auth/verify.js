import { verifyToken, getTokenFromRequest } from '../../../utils/auth.js';
import { connectDB } from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  console.log('🛡️ Verify API called');
  
  if (req.method !== 'GET') {
    console.log('❌ Wrong method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get token from request (cookie or header)
    const token = getTokenFromRequest(req);
    console.log('🎫 Token received:', !!token);
    
    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token
    console.log('🔍 Verifying token...');
    const decoded = verifyToken(token);
    console.log('📋 Decoded token:', decoded);
    
    if (!decoded) {
      console.log('❌ Invalid token');
      return res.status(401).json({ error: 'Invalid token' });
    }

    console.log('🔗 Connecting to MongoDB...');
    const { db } = await connectDB();

    // Get user data from MongoDB using email (more reliable than ObjectId conversion)
    console.log('👤 Looking for user with email:', decoded.email);
    const user = await db.collection('users').findOne({ 
      email: decoded.email 
    });
    
    console.log('🔍 User found:', !!user);
    
    if (!user) {
      console.log('❌ User not found in database');
      return res.status(401).json({ error: 'User not found' });
    }

    // Return user without password and convert ObjectId to string
    const { password, _id, ...userWithoutPassword } = user;
    
    console.log('✅ Verify successful, returning user');
    res.status(200).json({
      success: true,
      user: {
        id: _id.toString(),
        ...userWithoutPassword
      },
    });
  } catch (error) {
    console.error('💥 Auth verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
