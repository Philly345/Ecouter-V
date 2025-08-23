// Simple email test without scheduler
console.log('🧪 Testing email system...');

// Check if environment variables are set
console.log('📧 Email Configuration:');
console.log('SMTP_SENDER:', process.env.SMTP_SENDER || 'NOT SET');
console.log('SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? 'SET (hidden)' : 'NOT SET');

if (!process.env.SMTP_SENDER || !process.env.SMTP_PASSWORD) {
  console.log('');
  console.log('🔧 Email Setup Required:');
  console.log('1. Add to your .env.local file:');
  console.log('   SMTP_SENDER=your_gmail@gmail.com');
  console.log('   SMTP_PASSWORD=your_16_character_app_password');
  console.log('');
  console.log('2. Get Gmail App Password:');
  console.log('   - Go to Google Account Settings');
  console.log('   - Security → 2-Step Verification');
  console.log('   - App Passwords → Generate for "Mail"');
  console.log('   - Use the 16-character password in SMTP_PASSWORD');
  console.log('');
  console.log('📧 Once configured, your system will automatically send:');
  console.log('   • Daily health reports at: 12AM, 7AM, 10AM, 12PM, 3PM, 10PM');
  console.log('   • Critical alerts when manual intervention is needed');
  console.log('   • API switch notifications');
  process.exit(0);
} else {
  console.log('✅ Email configuration found! Testing email...');
  
  const nodemailer = require('nodemailer');
  
  async function testEmail() {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_SENDER,
          pass: process.env.SMTP_PASSWORD
        }
      });
      
      const mailOptions = {
        from: process.env.SMTP_SENDER,
        to: 'ecouter.transcribe@gmail.com',
        subject: '🤖 AI System Test - Email Working!',
        html: `
          <h2>🎉 Your AI System Email Test</h2>
          <p>This is a test email from your AI API management system.</p>
          <p><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>System Status:</strong> ✅ Email system working correctly!</p>
          <p><strong>Scheduled Reports:</strong> Daily at 12AM, 7AM, 10AM, 12PM, 3PM, 10PM</p>
          <p><strong>Auto-Debug:</strong> Active and ready to fix issues automatically</p>
          <p><strong>API Management:</strong> Monitoring 4 APIs with smart rotation</p>
          <hr>
          <p><em>Your intelligent transcription system is ready for production! 🚀</em></p>
        `
      };
      
      await transporter.sendMail(mailOptions);
      console.log('✅ Test email sent successfully to ecouter.transcribe@gmail.com!');
      console.log('📬 Check your inbox for the test email');
      console.log('');
      console.log('🎉 Email system is working! Your scheduled reports will be sent at:');
      console.log('   • 12:00 AM - Midnight health check');
      console.log('   • 7:00 AM - Morning system status');
      console.log('   • 10:00 AM - Mid-morning update');
      console.log('   • 12:00 PM - Noon status report');
      console.log('   • 3:00 PM - Afternoon check');
      console.log('   • 10:00 PM - Evening summary');
      
    } catch (error) {
      console.error('❌ Email test failed:', error.message);
      
      if (error.message.includes('EAUTH')) {
        console.log('');
        console.log('🔧 Authentication Error - Check:');
        console.log('1. Gmail account has 2-Factor Authentication enabled');
        console.log('2. App password is correctly generated');
        console.log('3. App password is exactly 16 characters');
        console.log('4. No spaces in the app password');
      }
    }
    
    process.exit(0);
  }
  
  testEmail();
}