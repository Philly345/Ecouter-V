import bcrypt from 'bcryptjs';
import { connectDB } from '../../../lib/mongodb';
import { generateToken, setTokenCookie } from '../../../utils/auth.js';
import { usersDB } from '../../../utils/database.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { db } = await connectDB();

    // First try to find user in MongoDB
    let user = await db.collection('users').findOne({ email });
    
    // If not found in MongoDB, check old file system and migrate
    if (!user) {
      console.log('User not found in MongoDB, checking file system...');
      const fileUser = usersDB.findByEmail(email);
      
      if (fileUser) {
        console.log('Found user in file system, migrating to MongoDB...');
        
        // Migrate user to MongoDB
        const mongoUser = {
          name: fileUser.name,
          email: fileUser.email,
          ...(fileUser.password && { password: fileUser.password }),
          ...(fileUser.provider && { provider: fileUser.provider }),
          ...(fileUser.googleId && { googleId: fileUser.googleId }),
          ...(fileUser.avatar && { avatar: fileUser.avatar }),
          verified: fileUser.verified || fileUser.provider === 'google' || false,
          storageUsed: fileUser.storageUsed || 0,
          transcriptionsCount: fileUser.transcriptionsCount || 0,
          minutesUsed: fileUser.minutesUsed || 0,
          createdAt: fileUser.createdAt || new Date().toISOString(),
          updatedAt: fileUser.updatedAt || new Date().toISOString()
        };
        
        const result = await db.collection('users').insertOne(mongoUser);
        user = { ...mongoUser, _id: result.insertedId };
        console.log('User migrated successfully');
      }
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user is verified
    if (!user.verified) {
      return res.status(401).json({ error: 'Please verify your email before logging in' });
    }

    // Check password (only for email provider)
    if (user.provider === 'email' || user.password) {
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }

    // Generate token
    const token = generateToken({ 
      userId: user._id.toString(), 
      email: user.email, 
      name: user.name 
    });

    // Set cookie
    setTokenCookie(res, token);

    // Return user data (without password) and convert ObjectId to string
    const { password: _, _id, ...userWithoutPassword } = user;
    
    res.status(200).json({
      success: true,
      user: {
        id: _id.toString(),
        ...userWithoutPassword
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
