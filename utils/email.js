import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_SERVER,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_LOGIN,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendEmail({ to, subject, html, text }) {
  try {
    const mailOptions = {
      from: process.env.SMTP_SENDER,
      to,
      subject,
      html,
      text,
    };

    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

export function generatePasswordResetEmail(resetLink, userName) {
  return {
    subject: 'Reset Your Ecouter Transcribe Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
          .logo { text-align: center; margin-bottom: 30px; }
          .button { display: inline-block; padding: 12px 30px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <h1 style="color: #333;">🎵 Ecouter Transcribe</h1>
          </div>
          <h2>Password Reset Request</h2>
          <p>Hello ${userName},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center;">
            <a href="${resetLink}" class="button">Reset Password</a>
          </div>
          <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
          <p>This link will expire in 1 hour for security reasons.</p>
          <div class="footer">
            <p>Best regards,<br>The Ecouter Transcribe Team</p>
            <p>This email was sent to ${to}. If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Password Reset Request
    
Hello ${userName},

We received a request to reset your password. Please visit the following link to create a new password:

${resetLink}

If you didn't request this password reset, please ignore this email. Your password will remain unchanged.

This link will expire in 1 hour for security reasons.

Best regards,
The Ecouter Transcribe Team`
  };
}

export function generateVerificationEmail(verificationCode, userName) {
  return {
    subject: 'Verify Your Ecouter Transcribe Account',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #0a0a0a; color: #ffffff; }
          .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%); padding: 40px; border-radius: 16px; border: 1px solid #333; }
          .logo { text-align: center; margin-bottom: 30px; }
          .logo h1 { background: linear-gradient(135deg, #ffffff 0%, #cccccc 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin: 0; font-size: 28px; }
          .code-container { text-align: center; margin: 30px 0; }
          .verification-code { display: inline-block; padding: 20px 40px; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; border-radius: 12px; margin: 20px 0; font-family: 'Courier New', monospace; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #333; color: #888; font-size: 12px; text-align: center; }
          .warning { background: #1a1a1a; border: 1px solid #444; padding: 15px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <h1>🎵 Ecouter Transcribe</h1>
          </div>
          <h2 style="color: #ffffff; text-align: center;">Email Verification</h2>
          <p>Hello ${userName},</p>
          <p>Welcome to Ecouter Transcribe! Please use the verification code below to complete your account setup:</p>
          <div class="code-container">
            <div class="verification-code">${verificationCode}</div>
          </div>
          <p style="text-align: center; color: #cccccc;">Enter this code on the verification page to activate your account.</p>
          <div class="warning">
            <p style="margin: 0; color: #fbbf24;"><strong>⚠️ Security Notice:</strong></p>
            <p style="margin: 5px 0 0 0; color: #cccccc;">This code will expire in 10 minutes. If you didn't create an account, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>Best regards,<br>The Ecouter Transcribe Team</p>
            <p>This email was sent to verify your account. If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Email Verification - Ecouter Transcribe
    
Hello ${userName},

Welcome to Ecouter Transcribe! Please use the verification code below to complete your account setup:

Verification Code: ${verificationCode}

Enter this code on the verification page to activate your account.

⚠️ Security Notice: This code will expire in 10 minutes. If you didn't create an account, please ignore this email.

Best regards,
The Ecouter Transcribe Team`
  };
}
