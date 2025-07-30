import { usersDB } from '../../../utils/database.js';
import { sendEmail, generatePasswordResetEmail } from '../../../utils/email.js';
import { generateToken } from '../../../utils/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user
    const user = usersDB.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists
      return res.status(200).json({
        success: true,
        message: 'If the email exists, a reset link has been sent',
      });
    }

    // Generate reset token (expires in 1 hour)
    const resetToken = generateToken({ userId: user.id, type: 'password_reset' });
    
    // Create reset link
    const resetLink = `${req.headers.origin}/reset-password?token=${resetToken}`;
    
    // Generate and send email
    const emailContent = generatePasswordResetEmail(resetLink, user.name);
    const emailResult = await sendEmail({
      to: email,
      ...emailContent,
    });

    if (!emailResult.success) {
      console.error('Failed to send reset email:', emailResult.error);
      return res.status(500).json({ error: 'Failed to send reset email' });
    }

    res.status(200).json({
      success: true,
      message: 'If the email exists, a reset link has been sent',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
