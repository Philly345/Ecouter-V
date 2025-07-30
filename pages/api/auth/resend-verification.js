import { connectDB } from '../../../lib/mongodb';
import { sendEmail, generateVerificationEmail } from '../../../utils/email';

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const { db } = await connectDB();
    
    // Check if pending user exists
    const pendingUser = await db.collection('pending_users').findOne({ email });

    if (!pendingUser) {
      return res.status(400).json({ error: 'No pending registration found for this email' });
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update or create verification record
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
    const emailContent = generateVerificationEmail(verificationCode, pendingUser.name);
    const emailResult = await sendEmail({
      to: email,
      ...emailContent
    });

    if (!emailResult.success) {
      throw new Error('Failed to send verification email');
    }

    res.status(200).json({ 
      success: true, 
      message: 'New verification code sent successfully' 
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification code' });
  }
}
