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
    subject: '🔐 Reset Your Ecouter Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">🎵 Ecouter</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">Password Reset Request</p>
        </div>

        <!-- Main Content -->
        <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
          <h2 style="color: #1f2937; margin-top: 0;">Hello ${userName || 'User'},</h2>
          
          <p style="color: #374151;">We received a request to reset your password for your Ecouter account. Click the button below to create a new password:</p>

          <!-- Reset Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              🔐 Reset My Password
            </a>
          </div>

          <!-- Security Information -->
          <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <h3 style="color: #92400e; margin-top: 0; font-size: 16px;">🔒 Security Information</h3>
            <ul style="color: #92400e; margin: 0; padding-left: 20px;">
              <li>This link will expire in <strong>1 hour</strong> for security</li>
              <li>The link can only be used once</li>
              <li>If you didn't request this, please ignore this email</li>
            </ul>
          </div>

          <!-- Alternative Link -->
          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 25px 0;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              <strong>Can't click the button?</strong> Copy and paste this link into your browser:
            </p>
            <p style="margin: 10px 0 0 0; word-break: break-all; color: #4f46e5; font-size: 12px;">
              ${resetLink}
            </p>
          </div>

          <!-- Support Info -->
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Need help? Contact our support team at 
              <a href="mailto:ecouter.transcribe@gmail.com" style="color: #4f46e5; text-decoration: none;">
                ecouter.transcribe@gmail.com
              </a>
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; padding: 20px; text-align: center; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            🌐 <a href="https://ecouter.systems" style="color: #4f46e5;">ecouter.systems</a> | 
            📧 <a href="mailto:ecouter.transcribe@gmail.com" style="color: #4f46e5;">ecouter.transcribe@gmail.com</a>
          </p>
          <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 12px;">
            This email was sent because a password reset was requested for your account.
          </p>
        </div>
      </div>
    `,
    text: `Password Reset Request - Ecouter

Hello ${userName || 'User'},

We received a request to reset your password for your Ecouter account. Please visit the following link to create a new password:

${resetLink}

🔒 Security Information:
- This link will expire in 1 hour for security
- The link can only be used once  
- If you didn't request this, please ignore this email

Need help? Contact our support team at ecouter.transcribe@gmail.com

Best regards,
The Ecouter Team

---
This email was sent because a password reset was requested for your account.
ecouter.systems | ecouter.transcribe@gmail.com`
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
