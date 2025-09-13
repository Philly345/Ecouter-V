// Updated forgot password API with improved email template
// This will guarantee email delivery using the working Brevo SMTP

import { connectToDatabase } from '../../../lib/mongodb';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    console.log('🔐 Processing forgot password request for:', email);

    // Connect to database
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    // Find user
    const user = await usersCollection.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log('❌ User not found:', email);
      // Return success for security (don't reveal if email exists)
      return res.status(200).json({
        success: true,
        message: 'If the email exists, a reset link has been sent'
      });
    }

    console.log('✅ User found:', user._id);

    // Generate JWT token
    const resetToken = jwt.sign(
      { 
        userId: user._id.toString(),
        email: user.email,
        purpose: 'password-reset'
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('✅ Reset token generated');

    // Setup email transporter (using working Brevo SMTP)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_SERVER,
      port: parseInt(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_LOGIN,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Improved email template for better delivery
    const resetUrl = `${req.headers.origin}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `"Ecouter Support" <${process.env.SMTP_SENDER}>`,
      to: email,
      subject: 'Password Reset - Ecouter Account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px 20px;">
            
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="color: #333; margin: 0; font-size: 28px;">Ecouter</h1>
              <p style="color: #666; margin: 10px 0 0 0;">Audio Transcription Service</p>
            </div>
            
            <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
            
            <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
              Hello,
            </p>
            
            <p style="color: #555; line-height: 1.6; margin-bottom: 30px;">
              We received a request to reset the password for your Ecouter account. 
              Click the button below to create a new password:
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${resetUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        display: inline-block; 
                        font-weight: bold;
                        font-size: 16px;">
                Reset My Password
              </a>
            </div>
            
            <p style="color: #777; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
              This link will expire in 1 hour for security purposes.
            </p>
            
            <p style="color: #777; font-size: 14px; line-height: 1.6; margin-bottom: 30px;">
              If you didn't request this password reset, please ignore this email. 
              Your password will remain unchanged.
            </p>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 40px;">
              <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                Ecouter Support Team<br>
                This is an automated message, please do not reply.
              </p>
            </div>
            
          </div>
        </body>
        </html>
      `,
      text: `
Password Reset Request

Hello,

We received a request to reset the password for your Ecouter account.

Reset your password here: ${resetUrl}

This link will expire in 1 hour for security purposes.

If you didn't request this, please ignore this email.

Ecouter Support Team
      `
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent successfully');
    console.log('Message ID:', info.messageId);

    return res.status(200).json({
      success: true,
      message: 'If the email exists, a reset link has been sent'
    });

  } catch (error) {
    console.error('❌ Forgot password error:', error);
    return res.status(500).json({ 
      error: 'Internal server error. Please try again later.' 
    });
  }
}