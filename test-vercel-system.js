// Test the Vercel API manager locally
console.log('🧪 Testing Vercel API Manager...');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { VercelAPIManager } = require('./lib/vercel-api-manager.cjs');

async function testVercelSystem() {
  try {
    console.log('🚀 Initializing Vercel API Manager...');
    
    const apiManager = new VercelAPIManager();
    
    console.log('🔍 Performing health check...');
    const healthData = await apiManager.performHealthCheck();
    
    console.log('📊 Health Check Results:');
    console.log(`   Status: ${healthData.overallStatus}`);
    console.log(`   APIs Checked: ${Object.keys(healthData.apis).length}`);
    console.log(`   Issues: ${healthData.issues.length}`);
    
    // Display API details
    Object.entries(healthData.apis).forEach(([name, data]) => {
      const status = data.isHealthy ? '✅' : '❌';
      console.log(`   ${status} ${name.toUpperCase()}: ${data.responseTime}ms`);
      if (data.error) {
        console.log(`      Error: ${data.error}`);
      }
    });
    
    console.log('');
    console.log('📧 Sending email report...');
    
    const emailResult = await apiManager.sendHealthReport(healthData);
    
    if (emailResult.success) {
      console.log('✅ Email sent successfully!');
      console.log(`📧 Message ID: ${emailResult.messageId}`);
      console.log('📬 Check ecouter.transcribe@gmail.com for the report');
    } else {
      console.error('❌ Email failed:', emailResult.error);
    }
    
    console.log('');
    console.log('🎉 Vercel system test completed!');
    console.log('');
    console.log('📋 Next Steps for Vercel Deployment:');
    console.log('1. Deploy to Vercel with: vercel --prod');
    console.log('2. Add environment variables in Vercel dashboard');
    console.log('3. Cron jobs will run automatically at scheduled times');
    console.log('4. Test manually at: your-domain.vercel.app/api/health/manual-check');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    if (error.message.includes('fetch')) {
      console.log('');
      console.log('🔧 Network Error Tips:');
      console.log('- Check internet connection');
      console.log('- Verify API keys are correct');
      console.log('- Some APIs might be temporarily unavailable');
    }
  }
  
  process.exit(0);
}

testVercelSystem();