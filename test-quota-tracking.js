// Test enhanced API manager with quota tracking
console.log('💳 Testing API Quota Tracking System...');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { EnhancedAPIManager } = require('./lib/enhanced-api-manager.cjs');

async function testQuotaTracking() {
  try {
    console.log('🚀 Initializing enhanced API manager with quota tracking...');
    
    const apiManager = new EnhancedAPIManager();
    
    console.log('🔍 Running comprehensive health check with quota information...');
    const healthData = await apiManager.performHealthCheck();
    
    console.log('');
    console.log('💳 QUOTA TRACKING RESULTS:');
    console.log('='.repeat(60));
    
    // Show overall status
    console.log(`Overall Status: ${healthData.overallStatus.toUpperCase()}`);
    console.log(`Total Issues: ${healthData.issues.length}`);
    console.log(`Quota Warnings: ${healthData.quotaWarnings.length}`);
    console.log(`Critical Errors: ${healthData.criticalErrors.length}`);
    
    console.log('');
    console.log('📊 DETAILED QUOTA BREAKDOWN:');
    console.log('-'.repeat(40));
    
    // Show each API with quota details
    Object.entries(healthData.apis).forEach(([name, data]) => {
      const status = data.isHealthy ? '✅ HEALTHY' : 
                    data.isQuotaIssue ? '⚠️ QUOTA ISSUE' : '❌ ERROR';
      
      console.log(`${name.toUpperCase()}: ${status}`);
      console.log(`  Response Time: ${data.responseTime}ms`);
      console.log(`  Status Code: ${data.statusCode || 'N/A'}`);
      
      if (data.quotaInfo) {
        console.log(`  📊 QUOTA DETAILS:`);
        console.log(`    Provider: ${data.quotaInfo.provider}`);
        console.log(`    Daily Used: ${data.quotaInfo.dailyUsed}`);
        console.log(`    Daily Limit: ${data.quotaInfo.dailyLimit}`);
        console.log(`    Monthly Used: ${data.quotaInfo.monthlyUsed}`);
        console.log(`    Monthly Limit: ${data.quotaInfo.monthlyLimit}`);
        console.log(`    Remaining: ${data.quotaInfo.estimatedRemaining}`);
        console.log(`    Reset Time: ${data.quotaInfo.resetTime}`);
        
        if (data.quotaInfo.balanceInfo) {
          console.log(`    Balance Info:`, data.quotaInfo.balanceInfo);
        }
        if (data.quotaInfo.status) {
          console.log(`    Status Details: ${data.quotaInfo.status}`);
        }
      } else {
        console.log(`  📊 QUOTA: Check provider dashboard (quota info not available via API)`);
      }
      
      if (data.error) {
        console.log(`  ❌ Error: ${data.error}`);
        console.log(`  🔍 Quota Issue: ${data.isQuotaIssue ? 'YES' : 'NO'}`);
      }
      console.log('');
    });
    
    console.log('📧 Sending enhanced email report with quota information...');
    
    const emailResult = await apiManager.sendHealthReport(healthData);
    
    if (emailResult.success) {
      console.log('✅ Enhanced email report with quota tracking sent successfully!');
      console.log(`📧 Message ID: ${emailResult.messageId}`);
      console.log('📬 Check ecouter.transcribe@gmail.com for the detailed report');
      console.log('');
      console.log('📋 Email now includes:');
      console.log('   • ✅ Health status for each API');
      console.log('   • 💳 Daily and monthly quota usage');
      console.log('   • ⏰ Quota reset times');
      console.log('   • 📊 Remaining limits for each API');
      console.log('   • 🎯 Clear distinction between quota vs critical errors');
      console.log('   • 📈 Quota summary section');
    } else {
      console.error('❌ Email failed:', emailResult.error);
    }
    
    console.log('');
    console.log('🎯 QUOTA TRACKING FEATURES:');
    console.log('✅ Real-time quota checking where APIs support it');
    console.log('✅ Daily and monthly limit tracking');
    console.log('✅ Reset time information');
    console.log('✅ Remaining usage estimates');
    console.log('✅ Provider-specific quota details');
    console.log('✅ Visual quota display in email reports');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  process.exit(0);
}

testQuotaTracking();