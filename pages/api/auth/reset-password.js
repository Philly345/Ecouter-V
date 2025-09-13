import bcrypt from 'bcryptjs';
import { connectToDatabase } from '../../../lib/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    console.log('🔐 Processing password reset...');
    console.log('📊 Environment check:');
    console.log('- JWT_SECRET:', process.env.JWT_SECRET ? 'Set ✅' : 'Missing ❌');

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Token decoded successfully');
      console.log('🔍 Token contents:', { 
        userId: decoded.userId, 
        email: decoded.email, 
        purpose: decoded.purpose,
        exp: new Date(decoded.exp * 1000)
      });
    } catch (jwtError) {
      console.error('❌ JWT verification failed:', jwtError.message);
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Check if token has correct purpose (updated to match forgot password API)
    if (!decoded || decoded.purpose !== 'password-reset') {
      console.error('❌ Invalid token purpose:', decoded?.purpose);
      return res.status(400).json({ error: 'Invalid reset token' });
    }

    // Connect to database
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    // Find user by ID
    const user = await usersCollection.findOne({ _id: new ObjectId(decoded.userId) });
    if (!user) {
      console.error('❌ User not found:', decoded.userId);
      return res.status(400).json({ error: 'User not found' });
    }

    console.log('✅ User found:', user.email);

    // Verify email matches (additional security)
    if (user.email !== decoded.email) {
      console.error('❌ Email mismatch:', user.email, 'vs', decoded.email);
      return res.status(400).json({ error: 'Invalid reset token' });
    }

    console.log('✅ Email verification passed');

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('✅ Password hashed');

    // Update user password
    const updateResult = await usersCollection.updateOne(
      { _id: new ObjectId(decoded.userId) },
      { $set: { password: hashedPassword } }
    );
    
    if (updateResult.modifiedCount === 0) {
      console.error('❌ Failed to update password');
      return res.status(500).json({ error: 'Failed to update password' });
    }

    console.log('✅ Password reset successfully for user:', user.email);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
