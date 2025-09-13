// Setup Gmail SMTP as backup email service
console.log('📧 Setting up Gmail SMTP as backup email service...');

// Instructions for Gmail SMTP setup
console.log('');
console.log('🔧 GMAIL SMTP CONFIGURATION STEPS:');
console.log('==================================');
console.log('');

console.log('1. 🔐 ENABLE 2-FACTOR AUTHENTICATION:');
console.log('   - Go to: https://myaccount.google.com/security');
console.log('   - Turn on 2-Step Verification');
console.log('   - This is required for app passwords');
console.log('');

console.log('2. 📱 CREATE APP PASSWORD:');
console.log('   - Go to: https://myaccount.google.com/apppasswords');
console.log('   - Select "Mail" from dropdown');
console.log('   - Click "Generate"');
console.log('   - Copy the 16-character password (like: abcd efgh ijkl mnop)');
console.log('');

console.log('3. 📝 UPDATE YOUR .env.local FILE:');
console.log('   Add these lines (comment out Brevo settings):');
console.log('');
console.log('   # Gmail SMTP Configuration');
console.log('   SMTP_SERVER=smtp.gmail.com');
console.log('   SMTP_PORT=587');
console.log('   SMTP_LOGIN=phillyrick34@gmail.com');
console.log('   SMTP_PASSWORD=your-16-character-app-password');
console.log('   SMTP_SENDER=phillyrick34@gmail.com');
console.log('');

console.log('4. 🧪 TEST GMAIL SMTP:');
console.log('   After updating .env.local, run:');
console.log('   node test-gmail-smtp.js');
console.log('');

console.log('💡 GMAIL SMTP BENEFITS:');
console.log('- Emails from your own Gmail are less likely to be filtered');
console.log('- Higher delivery rates to Gmail recipients');
console.log('- Better reputation with email providers');
console.log('- No daily sending limits for small volumes');
console.log('');

console.log('⚠️ GMAIL SMTP LIMITATIONS:');
console.log('- 500 emails per day limit');
console.log('- Requires 2FA setup');
console.log('- App password needed');
console.log('- Gmail terms of service apply');
console.log('');

console.log('🔄 QUICK BACKUP SOLUTION:');
console.log('If you want to test immediately, I can create a Gmail SMTP');
console.log('version right now. Just let me know your Gmail app password!');

// Create the Gmail SMTP test file
const gmailTestCode = `// Test Gmail SMTP configuration
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
      html: \`
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #4285f4;">✅ Gmail SMTP Working!</h2>
          <p>This email was sent using Gmail SMTP instead of Brevo.</p>
          <p><strong>Time:</strong> \${new Date().toLocaleString()}</p>
          <p><strong>From:</strong> \${process.env.SMTP_LOGIN}</p>
          <p><strong>Provider:</strong> Gmail SMTP (smtp.gmail.com)</p>
          <div style="background: #e8f0fe; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #1a73e8;"><strong>✅ If you see this email, Gmail SMTP is working perfectly!</strong></p>
          </div>
          <p>Now your forgot password emails should definitely reach your inbox.</p>
        </div>
      \`,
      text: \`Gmail SMTP Test - Password Reset System
      
✅ Gmail SMTP Working!

This email was sent using Gmail SMTP instead of Brevo.

Time: \${new Date().toLocaleString()}
From: \${process.env.SMTP_LOGIN}
Provider: Gmail SMTP (smtp.gmail.com)

✅ If you see this email, Gmail SMTP is working perfectly!

Now your forgot password emails should definitely reach your inbox.\`
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

testGmailSMTP();`;

require('fs').writeFileSync('test-gmail-smtp.js', gmailTestCode);
console.log('');
console.log('✅ Created test-gmail-smtp.js file');
console.log('');
console.log('🚀 READY TO SWITCH TO GMAIL SMTP:');
console.log('1. Follow the setup steps above');
console.log('2. Update your .env.local file');
console.log('3. Run: node test-gmail-smtp.js');
console.log('4. Your emails will be delivered from your own Gmail!');