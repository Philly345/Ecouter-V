// Test the enhanced backup key system
require('dotenv').config();
const { BackupAPIManager } = require('./lib/backup-api-manager.cjs');

async function testBackupKeySystem() {
  console.log('🧪 Testing Enhanced Backup Key System');
  console.log('=====================================\n');

  try {
    // Create the backup API manager
    const manager = new BackupAPIManager();
    
    console.log('🔑 Backup Key Configuration:');
    Object.entries(manager.apis).forEach(([name, api]) => {
      console.log(`  ${name.toUpperCase()}:`);
      console.log(`    • Total keys: ${api.keys.length}`);
      console.log(`    • Primary key: ...${api.keys[0]?.slice(-8) || 'Not set'}`);
      api.keys.slice(1).forEach((key, index) => {
        console.log(`    • Backup ${index + 1}: ...${key?.slice(-8) || 'Not set'}`);
      });
      console.log('');
    });

    console.log('🔍 Running comprehensive health check with backup testing...\n');
    
    // Run health check
    const healthResults = await manager.performHealthCheck();
    
    console.log('\n📊 BACKUP KEY TEST RESULTS:');
    console.log('============================');
    
    Object.entries(healthResults.apis).forEach(([name, result]) => {
      const status = result.isHealthy ? '✅ HEALTHY' : 
                    result.hasWorkingBackups ? '🔄 BACKUP ACTIVE' : 
                    '❌ ALL KEYS DEPLETED';
      
      console.log(`\n${name.toUpperCase()}: ${status}`);
      console.log(`  Response time: ${result.responseTime}ms`);
      console.log(`  Status: ${result.statusMessage}`);
      
      if (result.backupKeyResults) {
        console.log(`  🔑 Backup Test Results:`);
        console.log(`    • Working backups: ${result.backupKeyResults.workingBackups}`);
        console.log(`    • Failed backups: ${result.backupKeyResults.failedBackups}`);
        console.log(`    • Total backups tested: ${result.backupKeyResults.totalBackups}`);
        
        if (result.backupKeyResults.backupDetails.length > 0) {
          console.log(`    • Detailed results:`);
          result.backupKeyResults.backupDetails.forEach(detail => {
            const icon = detail.isHealthy ? '✅' : detail.isQuotaIssue ? '⚠️' : '❌';
            console.log(`      ${icon} Key #${detail.keyIndex}: ${detail.isHealthy ? `Working (${detail.responseTime}ms)` : detail.error}`);
          });
        }
      }
    });

    console.log('\n📧 Testing enhanced email report...');
    
    // Test email (if configured)
    if (process.env.SMTP_SERVER) {
      const emailResult = await manager.sendHealthReport(healthResults);
      if (emailResult.success) {
        console.log(`✅ Enhanced email sent successfully (ID: ${emailResult.messageId})`);
      } else {
        console.log(`❌ Email failed: ${emailResult.error}`);
      }
    } else {
      console.log('⚠️ Email not configured (SMTP_SERVER not set)');
    }

    console.log('\n🎯 SYSTEM RELIABILITY ANALYSIS:');
    console.log('===============================');
    
    const totalAPIs = Object.keys(healthResults.apis).length;
    const healthyAPIs = Object.values(healthResults.apis).filter(api => api.isHealthy).length;
    const apisWithBackups = Object.values(healthResults.apis).filter(api => api.hasWorkingBackups).length;
    const totalBackupKeys = Object.values(healthResults.backupKeyStatus).reduce((sum, status) => sum + (status.totalKeys - 1), 0);
    
    const effectiveUptime = ((healthyAPIs + apisWithBackups) / totalAPIs * 100);
    
    console.log(`• Total APIs: ${totalAPIs}`);
    console.log(`• Healthy APIs: ${healthyAPIs}`);
    console.log(`• APIs with working backups: ${apisWithBackups}`);
    console.log(`• Total backup keys available: ${totalBackupKeys}`);
    console.log(`• Effective uptime: ${effectiveUptime.toFixed(1)}% 🎯`);
    
    if (effectiveUptime >= 75) {
      console.log(`\n🎉 EXCELLENT! Your backup key system provides ${effectiveUptime.toFixed(1)}% reliability!`);
    } else if (effectiveUptime >= 50) {
      console.log(`\n👍 GOOD! Consider adding more backup keys for even better reliability.`);
    } else {
      console.log(`\n⚠️ WARNING! Low reliability. Please add backup API keys.`);
    }

    console.log('\n💡 NEXT STEPS:');
    console.log('==============');
    
    // Check which APIs need backup keys
    const needsBackups = Object.entries(healthResults.backupKeyStatus)
      .filter(([name, status]) => status.totalKeys === 1)
      .map(([name]) => name);
    
    if (needsBackups.length > 0) {
      console.log('📝 Add backup keys for these APIs:');
      needsBackups.forEach(api => {
        console.log(`   • ${api.toUpperCase()}_API_KEY2=your-backup-key-here`);
        console.log(`   • ${api.toUpperCase()}_API_KEY3=your-third-key-here`);
      });
    } else {
      console.log('✅ All APIs have multiple keys configured!');
    }
    
    console.log('\n🚀 Deploy command: vercel --prod');
    console.log('📅 The system will run 8 health checks daily with backup key monitoring!');

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Run the test
testBackupKeySystem();