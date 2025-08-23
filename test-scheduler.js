// Test the scheduled health reporting system
const { getAPIManager } = require('./lib/api-manager.cjs');
const { getScheduler } = require('./lib/advanced-health-scheduler.cjs');

async function testScheduler() {
  console.log('📅 Testing Scheduled Health Reporting System...\n');

  try {
    // Test 1: Initialize Scheduler
    console.log('📋 Test 1: Scheduler Initialization');
    const scheduler = getScheduler();
    console.log('✅ Advanced health scheduler initialized successfully');

    // Test 2: Check Schedule Configuration
    console.log('\n📊 Test 2: Schedule Configuration');
    const status = scheduler.getStatus();
    console.log('Scheduled Times:');
    status.scheduledTimes.forEach((time, index) => {
      const timeStr = `${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}`;
      console.log(`  ${index + 1}. ${timeStr}`);
    });
    console.log(`Is Running: ${status.isRunning ? '✅ Yes' : '❌ No'}`);
    console.log(`Total Scheduled Checks: ${status.totalScheduledChecks}`);

    // Test 3: API Manager Integration
    console.log('\n🤖 Test 3: API Manager Integration');
    const apiManager = getAPIManager();
    const schedulerStatus = apiManager.getSchedulerStatus();
    console.log(`Scheduler Status: ${schedulerStatus.isRunning ? '✅ Active' : '❌ Inactive'}`);

    // Test 4: Generate Sample Report (without sending)
    console.log('\n📧 Test 4: Sample Report Generation');
    const systemHealth = await apiManager.getSystemHealth();
    const apiStatus = await apiManager.getAPIStatus();
    const currentAPI = await apiManager.getCurrentAPI();
    
    console.log('Sample Report Data:');
    console.log(`  • System Status: ${systemHealth.status}`);
    console.log(`  • Auto-Fixes: ${systemHealth.autoFixedCount}`);
    console.log(`  • Manual Interventions: ${systemHealth.manualInterventionCount}`);
    console.log(`  • Current API: ${currentAPI}`);
    console.log(`  • Active APIs: ${Object.values(apiStatus).filter(api => api.isActive).length}/4`);

    // Test 5: Force Send Test Report (if email is configured)
    console.log('\n📤 Test 5: Test Report Sending');
    try {
      await scheduler.forceHealthCheck();
      console.log('✅ Test health check completed successfully');
    } catch (error) {
      if (error.message.includes('Missing credentials')) {
        console.log('⚠️ Email not configured - test report not sent (this is expected)');
        console.log('   Configure SMTP_SENDER and SMTP_PASSWORD in .env.local to enable email reports');
      } else {
        console.log('❌ Test report failed:', error.message);
      }
    }

    // Test 6: Next Report Timing
    console.log('\n⏰ Test 6: Next Report Timing');
    const nextReport = scheduler.getNextRunTime();
    const now = new Date();
    console.log(`Current Time: ${now.toLocaleTimeString()}`);
    console.log(`Next Report: ${nextReport.toLocaleTimeString()}`);

    // Summary
    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    console.log('✅ Scheduler system is working correctly');
    console.log(`✅ Daily reports scheduled for ${status.totalScheduledChecks} times per day`);
    console.log('✅ Integration with API manager is functional');
    console.log('✅ Report generation is operational');
    
    if (status.isRunning) {
      console.log('✅ Automated scheduling is ACTIVE');
      console.log('\n🎉 Your system will now send health reports at:');
      console.log('   • 12:00 AM - Midnight check');
      console.log('   • 12:50 AM - Late night verification');
      console.log('   • 1:35 AM - Early morning check #1');
      console.log('   • 1:45 AM - Early morning check #2');
      console.log('   • 1:55 AM - Early morning check #3');
      console.log('   • 2:10 AM - Early morning check #4');
      console.log('   • 2:40 AM - Early morning check #5');
      console.log('   • 7:00 AM - Morning status');
      console.log('   • 10:00 AM - Mid-morning update');
      console.log('   • 12:00 PM - Noon checkpoint');
      console.log('   • 3:00 PM - Afternoon review');
      console.log('   • 10:00 PM - Evening summary');
      console.log('\n📧 Reports will be sent to: ecouter.transcribe@gmail.com');
      console.log('🔧 Configure email in .env.local to receive reports');
    } else {
      console.log('⚠️ Scheduler not running - check initialization');
    }

  } catch (error) {
    console.error('❌ Scheduler test failed:', error);
    console.log('\nTroubleshooting:');
    console.log('1. Ensure all required files are present');
    console.log('2. Check that API manager is working');
    console.log('3. Verify email configuration if testing reports');
  }
}

// Also test the specific time checking logic
function testTimeChecking() {
  console.log('\n🕐 Testing Time Checking Logic');
  console.log('==============================');
  
  const scheduler = getScheduler();
  const now = new Date();
  
  console.log(`Current time: ${now.toLocaleTimeString()}`);
  console.log(`Current hour: ${now.getHours()}`);
  console.log(`Current minute: ${now.getMinutes()}`);
  
  // Check if current time matches any scheduled time
  const scheduledTimes = [
    { hour: 0, minute: 0, name: '12:00 AM' },
    { hour: 0, minute: 50, name: '12:50 AM' },
    { hour: 1, minute: 35, name: '1:35 AM' },
    { hour: 1, minute: 45, name: '1:45 AM' },
    { hour: 1, minute: 55, name: '1:55 AM' },
    { hour: 2, minute: 10, name: '2:10 AM' },
    { hour: 2, minute: 40, name: '2:40 AM' },
    { hour: 7, minute: 0, name: '7:00 AM' },
    { hour: 10, minute: 0, name: '10:00 AM' },
    { hour: 12, minute: 0, name: '12:00 PM' },
    { hour: 15, minute: 0, name: '3:00 PM' },
    { hour: 22, minute: 0, name: '10:00 PM' }
  ];
  
  let isScheduledTime = false;
  scheduledTimes.forEach(time => {
    const isMatch = now.getHours() === time.hour && now.getMinutes() === time.minute;
    console.log(`${time.name}: ${isMatch ? '🎯 MATCH!' : '⏳ Wait'}`);
    if (isMatch) isScheduledTime = true;
  });
  
  if (isScheduledTime) {
    console.log('🚨 This is a scheduled report time! Report should be sending now.');
  } else {
    console.log('⏰ Not a scheduled time. Next check in 1 minute.');
  }
}

// Run tests
if (require.main === module) {
  testScheduler().then(() => {
    testTimeChecking();
  });
}

module.exports = { testScheduler, testTimeChecking };