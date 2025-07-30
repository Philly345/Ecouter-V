import { connectDB } from '../../../lib/mongodb';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Email and verification code are required' });
  }

  try {
    const { db } = await connectDB();
    
    // Find the verification record
    const verification = await db.collection('email_verifications').findOne({
      email,
      code,
      expiresAt: { $gt: new Date() }
    });

    if (!verification) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    // Get the pending user data
    const pendingUser = await db.collection('pending_users').findOne({ email });

    if (!pendingUser) {
      return res.status(400).json({ error: 'User registration data not found' });
    }

    // Create the user account
    const hashedPassword = await bcrypt.hash(pendingUser.password, 12);
    
    const newUser = {
      name: pendingUser.name,
      email: pendingUser.email,
      password: hashedPassword,
      verified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('users').insertOne(newUser);

    // Clean up verification and pending user data
    await db.collection('email_verifications').deleteMany({ email });
    await db.collection('pending_users').deleteOne({ email });

    res.status(200).json({ 
      success: true, 
      message: 'Email verified successfully. You can now log in.' 
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
