import bcrypt from 'bcryptjs';
import { connectDB } from '../../../lib/mongodb';
import { generateToken, setTokenCookie, verifyTokenString, getTokenFromRequest } from '../../../utils/auth.js';
import { usersDB } from '../../../utils/database.js';
import { trackDeviceAccess } from '../../../lib/deviceMonitor.js';
import { generateDeviceFingerprint } from '../../../lib/deviceTracker.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, deviceFingerprint: clientFingerprint } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user is already logged in with a valid session
    const existingToken = getTokenFromRequest(req);
    if (existingToken) {
      const decoded = verifyTokenString(existingToken);
      if (decoded && decoded.email) {
        if (decoded.email === email) {
          // Same user trying to login again - allow it but don't create new token
          console.log('🔄 Same user already logged in, returning existing session');
          return res.status(200).json({
            success: true,
            user: {
              id: decoded.userId,
              email: decoded.email,
              name: decoded.name
            },
            token: existingToken,
            message: 'Already logged in'
          });
        } else {
          // Different user trying to login
          console.log('🚫 Different user trying to login while another user is active');
          return res.status(403).json({ 
            error: `You are already signed in as ${decoded.email}. Please sign out first to use a different account.`
          });
        }
      }
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

    // Track device access for security monitoring
    try {
      const serverFingerprint = generateDeviceFingerprint(req, req.headers['user-agent'], clientFingerprint || {});
      const deviceAccessInfo = await trackDeviceAccess(
        user._id.toString(), 
        user.email, 
        req, 
        serverFingerprint
      );
      
      console.log('🔍 Device access tracked for user:', {
        email: user.email,
        isNewDevice: deviceAccessInfo.isNewDevice,
        deviceType: deviceAccessInfo.deviceInfo?.deviceType,
        location: deviceAccessInfo.location?.city || 'Unknown'
      });
    } catch (trackingError) {
      console.error('⚠️ Device tracking failed (login still successful):', trackingError);
    }

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
