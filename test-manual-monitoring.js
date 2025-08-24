// Manual Test for Comprehensive AI Monitoring
const { ComprehensiveAIMonitor } = require('./lib/comprehensive-ai-monitor.cjs');

async function testManualTrigger() {
  console.log('🧪 ====== MANUAL COMPREHENSIVE MONITORING TEST ======');
  console.log(`🕐 Manual trigger at ${new Date().toLocaleString()}`);
  console.log('📧 Testing email functionality...\n');
  
  try {
    // Initialize the comprehensive AI monitor
    const aiMonitor = new ComprehensiveAIMonitor();
    
    // Check if email configuration is available
    console.log('🔍 Checking email configuration...');
    if (!process.env.SMTP_SENDER || !process.env.SMTP_PASS) {
      console.log('⚠️ WARNING: SMTP configuration not found in environment variables');
      console.log('   Required variables: SMTP_SENDER, SMTP_PASS');
      console.log('   Without these, emails cannot be sent');
    } else {
      console.log('✅ SMTP configuration found');
    }
    
    // Run a comprehensive check
    console.log('\n🤖 Running comprehensive monitoring check...');
    const results = await aiMonitor.runComprehensiveCheck();
    
    // Display results
    console.log('\n📊 ====== MONITORING RESULTS ======');
    console.log(`Overall Status: ${results.overallStatus.toUpperCase()}`);
    console.log(`Email Status: ${results.emailStatus?.success ? 'SENT SUCCESSFULLY' : 'FAILED'}`);
    
    if (results.emailStatus?.success) {
      console.log(`Email Message ID: ${results.emailStatus.messageId}`);
      console.log(`Email Priority: ${results.emailStatus.priority}`);
      console.log('✅ Email should arrive shortly!');
    } else {
      console.log(`Email Error: ${results.emailStatus?.error || 'Unknown error'}`);
      console.log('❌ Email was not sent');
    }
    
    // Show next scheduled time
    const nextHour = new Date();
    nextHour.setHours(nextHour.getHours() + 1);
    nextHour.setMinutes(0);
    nextHour.setSeconds(0);
    
    console.log(`\n⏰ Next scheduled check: ${nextHour.toLocaleString()}`);
    console.log('\n🎯 DIAGNOSIS:');
    
    if (!results.emailStatus?.success) {
      console.log('   📧 Email sending failed - check SMTP configuration');
      console.log('   🔑 Verify environment variables are set on Vercel');
      console.log('   🌐 Ensure production deployment includes email settings');
    } else {
      console.log('   ✅ System is working correctly');
      console.log('   📬 Check your email inbox and spam folder');
    }
    
  } catch (error) {
    console.error('\n💥 Manual test failed:', error.message);
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('   1. Verify all dependencies are installed');
    console.log('   2. Check environment variables');
    console.log('   3. Ensure email configuration is correct');
  }
}

// Run the manual test
testManualTrigger()
  .then(() => {
    console.log('\n🎯 Manual test completed');
  })
  .catch(error => {
    console.error('💥 Manual test error:', error);
  });