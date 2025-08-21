import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { customerName, customerEmail, conversationHistory, timestamp } = req.body;

    if (!customerName || !customerEmail || !conversationHistory) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if email credentials are configured
    const emailUser = process.env.SUPPORT_EMAIL_USER;
    const emailPassword = process.env.SUPPORT_EMAIL_PASSWORD;

    if (!emailUser || !emailPassword) {
      console.warn('Email credentials not configured. Logging support request instead.');
      
      // Log the support request for development/testing
      console.log('=== CUSTOMER SUPPORT REQUEST ===');
      console.log(`Customer: ${customerName} (${customerEmail})`);
      console.log(`Timestamp: ${new Date(timestamp).toLocaleString()}`);
      console.log('Conversation:');
      console.log(conversationHistory);
      console.log('=== END SUPPORT REQUEST ===');

      // Return success even without email sending for development
      return res.status(200).json({ 
        success: true, 
        message: 'Support request logged successfully (development mode)',
        timestamp: new Date().toISOString(),
        developmentMode: true
      });
    }

    // Create email transporter (only if credentials are configured)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPassword
      }
    });

    // Format the email content
    const emailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .conversation { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .customer-info { background: #e8f4f8; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .message { margin: 10px 0; padding: 10px; border-radius: 5px; }
            .user-message { background: #dcf8c6; }
            .bot-message { background: #f1f1f1; }
            .footer { background: #f8f9fa; padding: 15px; text-align: center; color: #666; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🎤 Ecouter Customer Support Request</h1>
            <p>AI Assistant Escalation</p>
        </div>
        
        <div class="content">
            <h2>Customer Needs Human Assistance</h2>
            
            <div class="customer-info">
                <h3>Customer Information</h3>
                <p><strong>Name:</strong> ${customerName}</p>
                <p><strong>Email:</strong> ${customerEmail}</p>
                <p><strong>Request Time:</strong> ${new Date(timestamp).toLocaleString()}</p>
            </div>
            
            <h3>Conversation History</h3>
            <p>The customer interacted with our AI assistant but requested human support. Below is their complete conversation:</p>
            
            <div class="conversation">
                <pre style="white-space: pre-wrap; font-family: inherit;">${conversationHistory}</pre>
            </div>
            
            <h3>Next Steps</h3>
            <p>Please review the conversation above and respond directly to the customer at <strong>${customerEmail}</strong> with personalized assistance.</p>
            
            <p><strong>Customer Expectation:</strong> Response within 24 hours</p>
        </div>
        
        <div class="footer">
            <p>This is an automated message from the Ecouter AI Support System</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
    </body>
    </html>
    `;

    const emailText = `
ECOUTER CUSTOMER SUPPORT REQUEST
================================

Customer Information:
- Name: ${customerName}
- Email: ${customerEmail}
- Request Time: ${new Date(timestamp).toLocaleString()}

Conversation History:
${conversationHistory}

Next Steps:
Please review the conversation above and respond directly to the customer at ${customerEmail} with personalized assistance.

Customer Expectation: Response within 24 hours

---
This is an automated message from the Ecouter AI Support System
Generated on ${new Date().toLocaleString()}
    `;

    // Send email to support team
    const mailOptions = {
      from: process.env.SUPPORT_EMAIL_USER || 'ecouter.transcribe@gmail.com',
      to: 'ecouter.transcribe@gmail.com',
      subject: `🎤 Customer Support Request from ${customerName} - ${new Date().toLocaleDateString()}`,
      text: emailText,
      html: emailHTML
    };

    await transporter.sendMail(mailOptions);

    // Send confirmation email to customer
    const customerConfirmationHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .highlight { background: #e8f4f8; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .footer { background: #f8f9fa; padding: 15px; text-align: center; color: #666; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🎤 Ecouter Support</h1>
            <p>We've received your request!</p>
        </div>
        
        <div class="content">
            <h2>Hi ${customerName},</h2>
            
            <p>Thank you for contacting Ecouter support! We've received your request and our team will review your conversation with our AI assistant.</p>
            
            <div class="highlight">
                <h3>What happens next?</h3>
                <ul>
                    <li>Our support team will review your conversation history</li>
                    <li>We'll provide personalized assistance for your specific needs</li>
                    <li>You can expect a response within <strong>24 hours</strong></li>
                    <li>We'll contact you directly at this email address</li>
                </ul>
            </div>
            
            <p>In the meantime, you can:</p>
            <ul>
                <li>Continue using Ecouter's features</li>
                <li>Check our help documentation at your dashboard</li>
                <li>Try asking our AI assistant again for different questions</li>
            </ul>
            
            <p>We appreciate your patience and look forward to helping you get the most out of Ecouter!</p>
            
            <p>Best regards,<br>
            The Ecouter Support Team</p>
        </div>
        
        <div class="footer">
            <p>Need immediate help? Try our AI assistant again or check your dashboard for quick solutions.</p>
            <p>This confirmation was sent on ${new Date().toLocaleString()}</p>
        </div>
    </body>
    </html>
    `;

    const customerMailOptions = {
      from: process.env.SUPPORT_EMAIL_USER || 'ecouter.transcribe@gmail.com',
      to: customerEmail,
      subject: '🎤 Ecouter Support - We\'ve received your request!',
      html: customerConfirmationHTML
    };

    await transporter.sendMail(customerMailOptions);

    console.log('Support email sent successfully');
    res.status(200).json({ 
      success: true, 
      message: 'Support request sent successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error sending support email:', error);
    res.status(500).json({ 
      error: 'Failed to send support request',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}