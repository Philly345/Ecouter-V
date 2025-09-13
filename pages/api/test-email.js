import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { to } = req.body;
    
    if (!to) {
      return res.status(400).json({ message: 'Email address required' });
    }

    // Check if we have email configuration
    const hasBrevoConfig = process.env.SMTP_SERVER && process.env.SMTP_LOGIN && process.env.SMTP_PASSWORD;
    const hasGmailConfig = process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD;
    
    if (!hasBrevoConfig && !hasGmailConfig) {
      return res.status(500).json({ message: 'No email configuration found' });
    }

    // Use Gmail if available, otherwise fall back to Brevo
    let transporter;
    let serviceUsed = '';
    
    if (hasGmailConfig) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });
      serviceUsed = 'Gmail';
    } else {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_SERVER,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_LOGIN,
          pass: process.env.SMTP_PASSWORD,
        },
      });
      serviceUsed = 'Brevo SMTP';
    }

    const mailOptions = {
      from: 'Écouter <no-reply@ecouter.systems>',
      to,
      subject: 'Écouter Email Test - Collaboration System Working!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #1a202c; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1>🎉 Email Test Successful!</h1>
          </div>
          <div style="background: #f7fafc; padding: 30px; border-radius: 0 0 8px 8px;">
            <p>Great news! Your Écouter collaboration email system is working perfectly.</p>
            
            <p><strong>Service Used:</strong> ${serviceUsed}</p>
            <p><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
            
            <p>This means collaboration invitations will now be sent successfully when you invite team members to work on transcripts.</p>
            
            <div style="background: #e6f3ff; border: 1px solid #3182ce; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <strong>✅ Email system is ready for collaboration!</strong>
            </div>
            
            <p>You can now:</p>
            <ul>
              <li>📧 Send collaboration invitations</li>
              <li>👥 Invite team members to transcripts</li>
              <li>🔔 Receive notifications</li>
              <li>📝 Collaborate in real-time</li>
            </ul>
          </div>
        </div>
      `,
      text: `
Email Test Successful!

Your Écouter collaboration email system is working perfectly.

Service Used: ${serviceUsed}
Test Time: ${new Date().toLocaleString()}

This means collaboration invitations will now be sent successfully when you invite team members to work on transcripts.

✅ Email system is ready for collaboration!
      `
    };

    await transporter.sendMail(mailOptions);
    
    res.status(200).json({ 
      message: 'Test email sent successfully',
      service: serviceUsed,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Email test error:', error);
    res.status(500).json({ 
      message: 'Failed to send test email',
      error: error.message 
    });
  }
}