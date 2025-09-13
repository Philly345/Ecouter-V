import { connectDB } from '../../../lib/mongodb';
import { sendEmail, generateVerificationEmail } from '../../../utils/email';
import { generateDeviceFingerprint, canUserRegister, trackUserRegistration } from '../../../lib/deviceTracker';

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, password, deviceFingerprint: clientFingerprint } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Generate server-side device fingerprint
    const serverFingerprint = generateDeviceFingerprint(req, req.headers['user-agent'], clientFingerprint || {});
    
    // Check account creation limit
    const registrationCheck = await canUserRegister(req, serverFingerprint, clientFingerprint || {});
    
    if (!registrationCheck.canRegister) {
      console.log('🚫 Account creation limit reached:', {
        email,
        accountCount: registrationCheck.accountCount,
        limit: registrationCheck.accountLimit,
        existingEmails: registrationCheck.existingEmails,
        matchedCriteria: registrationCheck.matchedCriteria
      });
      
      return res.status(403).json({ 
        error: 'Account creation limit reached',
        message: `You have reached the maximum limit of ${registrationCheck.accountLimit} accounts per device. Please sign in to one of your existing accounts.`,
        accountCount: registrationCheck.accountCount,
        accountLimit: registrationCheck.accountLimit,
        existingEmails: registrationCheck.existingEmails.map(email => {
          // Mask email for privacy (show first 2 chars and domain)
          const parts = email.split('@');
          if (parts.length === 2) {
            const masked = parts[0].substring(0, 2) + '*'.repeat(Math.max(0, parts[0].length - 2));
            return `${masked}@${parts[1]}`;
          }
          return email;
        }),
        canSignIn: true
      });
    }

    const { db } = await connectDB();

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Check if there's already a pending registration
    const pendingUser = await db.collection('pending_users').findOne({ email });
    if (pendingUser) {
      // Update pending user data
      await db.collection('pending_users').replaceOne(
        { email },
        {
          name,
          email,
          password, // Store plain password temporarily for pending users
          deviceFingerprint: serverFingerprint,
          clientFingerprint: clientFingerprint || {},
          createdAt: new Date()
        }
      );
    } else {
      // Create new pending user
      await db.collection('pending_users').insertOne({
        name,
        email,
        password, // Store plain password temporarily for pending users
        deviceFingerprint: serverFingerprint,
        clientFingerprint: clientFingerprint || {},
        createdAt: new Date()
      });
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store verification code
    await db.collection('email_verifications').replaceOne(
      { email },
      {
        email,
        code: verificationCode,
        expiresAt,
        createdAt: new Date()
      },
      { upsert: true }
    );

    // Send verification email
    const emailContent = generateVerificationEmail(verificationCode, name);
    const emailResult = await sendEmail({
      to: email,
      ...emailContent
    });

    if (!emailResult.success) {
      throw new Error('Failed to send verification email');
    }

    console.log('✅ Registration initiated for:', {
      email,
      deviceFingerprint: serverFingerprint,
      accountCount: registrationCheck.accountCount + 1,
      limit: registrationCheck.accountLimit
    });

    res.status(200).json({
      success: true,
      message: 'Registration initiated. Please check your email for verification code.',
      email,
      requiresVerification: true,
      accountInfo: {
        accountCount: registrationCheck.accountCount + 1,
        accountLimit: registrationCheck.accountLimit
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
