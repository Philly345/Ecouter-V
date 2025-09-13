// Test Gmail SMTP configuration
console.log('📧 Testing Gmail SMTP...');

require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

async function testGmailSMTP() {
  try {
    // Gmail SMTP configuration
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_LOGIN, // Your Gmail address
        pass: process.env.SMTP_PASSWORD, // Your 16-character app password
      },
    });

    // Alternative Gmail SMTP configuration
    // const transporter = nodemailer.createTransport({
    //   host: 'smtp.gmail.com',
    //   port: 587,
    //   secure: false,
    //   auth: {
    //     user: process.env.SMTP_LOGIN,
    //     pass: process.env.SMTP_PASSWORD,
    //   },
    // });

    console.log('🔗 Testing Gmail SMTP connection...');
    await transporter.verify();
    console.log('✅ Gmail SMTP connection successful!');

    console.log('📤 Sending test email via Gmail SMTP...');
    const result = await transporter.sendMail({
      from: process.env.SMTP_LOGIN,
      to: 'phillyrick34@gmail.com',
      subject: '🧪 Gmail SMTP Test - Password Reset System',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #4285f4;">✅ Gmail SMTP Working!</h2>
          <p>This email was sent using Gmail SMTP instead of Brevo.</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>From:</strong> ${process.env.SMTP_LOGIN}</p>
          <p><strong>Provider:</strong> Gmail SMTP (smtp.gmail.com)</p>
          <div style="background: #e8f0fe; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #1a73e8;"><strong>✅ If you see this email, Gmail SMTP is working perfectly!</strong></p>
          </div>
          <p>Now your forgot password emails should definitely reach your inbox.</p>
        </div>
      `,
      text: `Gmail SMTP Test - Password Reset System
      
✅ Gmail SMTP Working!

This email was sent using Gmail SMTP instead of Brevo.

Time: ${new Date().toLocaleString()}
From: ${process.env.SMTP_LOGIN}
Provider: Gmail SMTP (smtp.gmail.com)

✅ If you see this email, Gmail SMTP is working perfectly!

Now your forgot password emails should definitely reach your inbox.`
    });

    console.log('✅ Gmail SMTP test email sent successfully!');
    console.log('📋 Message ID:', result.messageId);
    console.log('📬 Check your Gmail inbox: phillyrick34@gmail.com');
    console.log('');
    console.log('🎉 Gmail SMTP is working! Your forgot password emails will now be delivered reliably.');

  } catch (error) {
    console.error('❌ Gmail SMTP test failed:', error);
    
    if (error.code === 'EAUTH') {
      console.log('');
      console.log('🔧 Authentication Error Solutions:');
      console.log('1. Make sure 2-Factor Authentication is enabled on your Gmail');
      console.log('2. Generate a new App Password:');
      console.log('   - Go to: https://myaccount.google.com/apppasswords');
      console.log('   - Select "Mail" and generate password');
      console.log('3. Use the 16-character app password (not your regular Gmail password)');
      console.log('4. Update SMTP_PASSWORD in your .env.local file');
    }
  }
}

testGmailSMTP();