// Test email with Brevo SMTP configuration
console.log('🧪 Testing email system with Brevo SMTP...');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Check if Brevo environment variables are set
console.log('📧 Brevo SMTP Configuration:');
console.log('SMTP_SERVER:', process.env.SMTP_SERVER || 'NOT SET');
console.log('SMTP_PORT:', process.env.SMTP_PORT || 'NOT SET');
console.log('SMTP_LOGIN:', process.env.SMTP_LOGIN || 'NOT SET');
console.log('SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? 'SET (hidden)' : 'NOT SET');
console.log('SMTP_SENDER:', process.env.SMTP_SENDER || 'NOT SET');

if (!process.env.SMTP_SERVER || !process.env.SMTP_LOGIN || !process.env.SMTP_PASSWORD) {
  console.log('❌ Brevo SMTP configuration incomplete!');
  process.exit(1);
}

console.log('✅ Brevo SMTP configuration found! Testing email...');

const nodemailer = require('nodemailer');

async function testBrevoEmail() {
  try {
    // Create Brevo transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_SERVER,
      port: parseInt(process.env.SMTP_PORT),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_LOGIN,
        pass: process.env.SMTP_PASSWORD
      }
    });

    // Test connection
    console.log('🔗 Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!');

    // Send test email
    const mailOptions = {
      from: process.env.SMTP_SENDER,
      to: 'ecouter.transcribe@gmail.com',
      subject: '🤖 AI System Test - Email Working via Brevo!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">🎉 Your AI System Email Test</h2>
          <p>This is a test email from your AI API management system using <strong>Brevo SMTP</strong>.</p>
          
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>📅 Test Time:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>📧 SMTP Provider:</strong> Brevo (smtp-relay.brevo.com)</p>
            <p><strong>🚀 System Status:</strong> ✅ Email system working correctly!</p>
          </div>
          
          <h3 style="color: #059669;">📋 Your AI System Features:</h3>
          <ul>
            <li><strong>🕐 Scheduled Reports:</strong> Daily at 12AM, 12:20AM, 7AM, 10AM, 12PM, 3PM, 10PM</li>
            <li><strong>🔧 Auto-Debug:</strong> Active and ready to fix issues automatically</li>
            <li><strong>🔄 API Management:</strong> Monitoring 4 APIs with smart rotation</li>
            <li><strong>🛡️ Health Monitoring:</strong> Real-time system health tracking</li>
            <li><strong>⚡ Critical Alerts:</strong> Instant notifications for manual intervention</li>
          </ul>
          
          <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #1d4ed8; margin-top: 0;">🎯 Next Steps:</h4>
            <p>Your intelligent transcription system is ready for production! The scheduler will automatically:</p>
            <ul>
              <li>Monitor API health and usage</li>
              <li>Switch between APIs when needed</li>
              <li>Send daily health reports</li>
              <li>Alert you to critical issues</li>
            </ul>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 14px;"><em>🚀 Your intelligent transcription system is ready for production!</em></p>
        </div>
      `
    };

    console.log('📤 Sending test email...');
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully!');
    console.log('📬 Email sent to: ecouter.transcribe@gmail.com');
    console.log('📧 Message ID:', result.messageId);
    
    console.log('');
    console.log('🎉 Email system is working! Your scheduled reports will be sent at:');
    console.log('   • 12:00 AM - Midnight health check');
    console.log('   • 12:20 AM - Post-midnight API verification');
    console.log('   • 7:00 AM - Morning system status');
    console.log('   • 10:00 AM - Mid-morning update');
    console.log('   • 12:00 PM - Noon status report');
    console.log('   • 3:00 PM - Afternoon check');
    console.log('   • 10:00 PM - Evening summary');
    
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('');
      console.log('🔧 Authentication Error - Check:');
      console.log('1. Brevo SMTP credentials are correct');
      console.log('2. Login: 91659a001@smtp-brevo.com');
      console.log('3. Password is valid');
    } else if (error.code === 'ENOTFOUND') {
      console.log('');
      console.log('🔧 Connection Error - Check:');
      console.log('1. Internet connection');
      console.log('2. SMTP server: smtp-relay.brevo.com');
      console.log('3. Port: 587');
    }
    
    console.log('');
    console.log('🔍 Full error details:', error);
  }
  
  process.exit(0);
}

testBrevoEmail();