import { sendEmail, generateVerificationEmail } from '../../../utils/email';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Generate test verification code
    const verificationCode = '123456';
    
    // Generate email content
    const emailContent = generateVerificationEmail(verificationCode, 'Test User');
    
    // Send test email
    const result = await sendEmail({
      to: email,
      ...emailContent
    });

    if (result.success) {
      res.status(200).json({ 
        success: true, 
        message: 'Test email sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to send test email',
        details: result.error
      });
    }
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Test email failed',
      details: error.message
    });
  }
}
