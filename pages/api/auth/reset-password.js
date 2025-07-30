import bcrypt from 'bcryptjs';
import { usersDB } from '../../../utils/database.js';
import { verifyToken } from '../../../utils/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    // Verify reset token
    const decoded = verifyToken(token);
    if (!decoded || decoded.type !== 'password_reset') {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Find user
    const user = usersDB.findById(decoded.userId);
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password
    usersDB.update(user.id, { password: hashedPassword });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
