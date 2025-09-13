// Test email delivery directly
console.log('📧 Testing Email Delivery...');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const nodemailer = require('nodemailer');

async function testEmailDelivery() {
  try {
    console.log('🔧 Email Configuration:');
    console.log('SMTP Server:', process.env.SMTP_SERVER);
    console.log('SMTP Port:', process.env.SMTP_PORT);
    console.log('SMTP Login:', process.env.SMTP_LOGIN);
    console.log('SMTP Sender:', process.env.SMTP_SENDER);
    console.log('SMTP Password:', process.env.SMTP_PASSWORD ? 'SET (hidden)' : 'NOT SET');
    console.log('');

    // Create transporter
    console.log('🔗 Creating email transporter...');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_SERVER,
      port: parseInt(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_LOGIN,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Test connection
    console.log('🧪 Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!');

    // Send test email to your Gmail
    console.log('📤 Sending test email...');
    const testEmailOptions = {
      from: process.env.SMTP_SENDER,
      to: 'phillyrick34@gmail.com', // Your personal Gmail
      subject: '🧪 Test Email - Forgot Password System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4f46e5;">🧪 Email System Test</h2>
          <p>This is a test email to verify your forgot password email delivery is working.</p>
          <p><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>SMTP Provider:</strong> Brevo (${process.env.SMTP_SERVER})</p>
          <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>✅ If you see this email, your SMTP configuration is working correctly!</strong></p>
          </div>
          <p>Now test the forgot password flow:</p>
          <ol>
            <li>Go to: http://localhost:3000/forgot-password</li>
            <li>Enter email: phillyrick34@gmail.com</li>
            <li>Check this email for the reset link</li>
          </ol>
        </div>
      `,
      text: `Email System Test
      
This is a test email to verify your forgot password email delivery is working.

Test Time: ${new Date().toLocaleString()}
SMTP Provider: Brevo (${process.env.SMTP_SERVER})

✅ If you see this email, your SMTP configuration is working correctly!

Now test the forgot password flow:
1. Go to: http://localhost:3000/forgot-password
2. Enter email: phillyrick34@gmail.com
3. Check this email for the reset link`
    };

    const result = await transporter.sendMail(testEmailOptions);
    console.log('✅ Test email sent successfully!');
    console.log('📋 Message ID:', result.messageId);
    console.log('📬 Check your Gmail: phillyrick34@gmail.com');
    console.log('');
    
    console.log('📋 Email Troubleshooting Tips:');
    console.log('1. Check your Gmail spam/junk folder');
    console.log('2. Check Gmail promotions tab');
    console.log('3. Search for "Ecouter" in Gmail');
    console.log('4. Check if emails are being filtered');
    console.log('');

    // Also send to support email
    console.log('📤 Sending test email to support address...');
    const supportEmailOptions = {
      ...testEmailOptions,
      to: 'ecouter.transcribe@gmail.com',
      subject: '🧪 Test Email - Support Address'
    };

    const supportResult = await transporter.sendMail(supportEmailOptions);
    console.log('✅ Support email sent successfully!');
    console.log('📋 Message ID:', supportResult.messageId);
    console.log('📬 Check support Gmail: ecouter.transcribe@gmail.com');

  } catch (error) {
    console.error('❌ Email test failed:', error);
    
    if (error.code === 'EAUTH') {
      console.log('');
      console.log('🔧 Authentication Error:');
      console.log('- Check SMTP_LOGIN and SMTP_PASSWORD in .env.local');
      console.log('- Verify Brevo credentials are correct');
    } else if (error.code === 'ENOTFOUND') {
      console.log('');
      console.log('🔧 Connection Error:');
      console.log('- Check internet connection');
      console.log('- Verify SMTP_SERVER: smtp-relay.brevo.com');
    } else {
      console.log('');
      console.log('🔧 Error Details:', error.message);
    }
  }
}

testEmailDelivery().then(() => {
  console.log('🏁 Email delivery test completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});