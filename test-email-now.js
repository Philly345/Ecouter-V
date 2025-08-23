// Quick test to send email alert right now
const { getAPIManager } = require('./lib/api-manager.cjs');

async function sendTestEmail() {
  console.log('🧪 Testing email system...');
  
  try {
    const apiManager = getAPIManager();
    
    // Send a simple test alert
    console.log('📧 Sending test alert to ecouter.transcribe@gmail.com...');
    
    await apiManager.sendInfoAlert('EMAIL_TEST', 'This is a test email from your AI system. Everything is working correctly!');
    
    console.log('✅ Test email sent successfully!');
    console.log('📬 Check your inbox at ecouter.transcribe@gmail.com');
    
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    
    if (error.message.includes('Missing credentials')) {
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
    }
  }
  
  // Stop any timers before exit
  setTimeout(() => {
    process.exit(0);
  }, 2000);
}

// Run the test
sendTestEmail();