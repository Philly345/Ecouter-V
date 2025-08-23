// Test DeepSeek API specifically to check if it's really depleted
console.log('🔍 Testing DeepSeek API specifically...');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { EnhancedAPIManager } = require('./lib/enhanced-api-manager.cjs');

async function testDeepSeekSpecifically() {
  try {
    console.log('🚀 Initializing enhanced API manager...');
    
    const apiManager = new EnhancedAPIManager();
    
    console.log('🧪 Running comprehensive health check...');
    const healthData = await apiManager.performHealthCheck();
    
    console.log('');
    console.log('📊 DETAILED RESULTS:');
    console.log('='.repeat(50));
    
    // Show overall status
    console.log(`Overall Status: ${healthData.overallStatus.toUpperCase()}`);
    console.log(`Total Issues: ${healthData.issues.length}`);
    console.log(`Quota Warnings: ${healthData.quotaWarnings.length}`);
    console.log(`Critical Errors: ${healthData.criticalErrors.length}`);
    
    console.log('');
    console.log('🔍 API BREAKDOWN:');
    console.log('-'.repeat(30));
    
    // Show each API in detail
    Object.entries(healthData.apis).forEach(([name, data]) => {
      const status = data.isHealthy ? '✅ HEALTHY' : 
                    data.isQuotaIssue ? '⚠️ QUOTA ISSUE' : '❌ ERROR';
      
      console.log(`${name.toUpperCase()}: ${status}`);
      console.log(`  Response Time: ${data.responseTime}ms`);
      console.log(`  Status Code: ${data.statusCode || 'N/A'}`);
      if (data.error) {
        console.log(`  Error: ${data.error}`);
        console.log(`  Is Quota Issue: ${data.isQuotaIssue ? 'YES' : 'NO'}`);
      }
      console.log('');
    });
    
    // Special focus on DeepSeek
    if (healthData.apis.deepseek) {
      const deepseek = healthData.apis.deepseek;
      console.log('🎯 DEEPSEEK SPECIFIC ANALYSIS:');
      console.log('-'.repeat(35));
      console.log(`Status: ${deepseek.isHealthy ? 'WORKING' : 'NOT WORKING'}`);
      console.log(`Error Type: ${deepseek.isQuotaIssue ? 'QUOTA/RATE LIMIT' : 'OTHER ERROR'}`);
      console.log(`Response Time: ${deepseek.responseTime}ms`);
      console.log(`HTTP Status: ${deepseek.statusCode}`);
      console.log(`Error Message: ${deepseek.error || 'None'}`);
      console.log(`Status Message: ${deepseek.statusMessage}`);
      
      if (!deepseek.isHealthy) {
        console.log('');
        if (deepseek.isQuotaIssue) {
          console.log('💡 CONCLUSION: DeepSeek has hit its quota/rate limit.');
          console.log('   This is normal behavior when APIs reach their limits.');
          console.log('   The system should automatically switch to backup APIs.');
        } else {
          console.log('🚨 CONCLUSION: DeepSeek has a serious error that needs attention.');
          console.log('   This could be an invalid API key or server issue.');
        }
      } else {
        console.log('');
        console.log('✅ CONCLUSION: DeepSeek is working perfectly!');
      }
    }
    
    console.log('');
    console.log('📧 Sending enhanced email report...');
    
    const emailResult = await apiManager.sendHealthReport(healthData);
    
    if (emailResult.success) {
      console.log('✅ Enhanced email report sent successfully!');
      console.log(`📧 Message ID: ${emailResult.messageId}`);
      console.log('📬 Check ecouter.transcribe@gmail.com for the detailed report');
      console.log('');
      console.log('📋 Email will show:');
      console.log('   • Clear distinction between quota issues vs real errors');
      console.log('   • Detailed error messages from each API');
      console.log('   • Actual functionality testing results');
      console.log('   • Color-coded categories (healthy/quota/error)');
    } else {
      console.error('❌ Email failed:', emailResult.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  process.exit(0);
}

testDeepSeekSpecifically();