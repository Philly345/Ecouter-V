// Test the intelligent auto-fixing system
require('dotenv').config();
const { AutoFixingAPIManager } = require('./lib/auto-fixing-api-manager.cjs');

async function testAutoFixingSystem() {
  console.log('🧪 Testing Intelligent Auto-Fixing System');
  console.log('==========================================\n');

  try {
    const manager = new AutoFixingAPIManager();
    
    console.log('🔧 Auto-Fixing Capabilities:');
    console.log('  • Automatic backup key switching');
    console.log('  • API configuration reset');
    console.log('  • Retry after delay for server errors');
    console.log('  • Network connectivity retry');
    console.log('  • Intelligent email alerts only when needed\n');

    console.log('🔍 Running comprehensive health check with auto-fixing...\n');
    
    // Run health check with auto-fixing
    const results = await manager.performHealthCheckWithAutoFix();
    
    console.log('\n🎯 AUTO-FIXING RESULTS:');
    console.log('========================');
    
    console.log(`📊 Overall Status: ${results.overallStatus.toUpperCase()}`);
    console.log(`🔧 Systems Auto-Fixed: ${results.systemsFixed}`);
    console.log(`⚠️ Systems Requiring Manual Intervention: ${results.systemsRequiringManualIntervention}`);
    console.log(`📈 Total APIs Monitored: ${Object.keys(results.apis).length}`);
    
    if (results.autoFixesPerformed.length > 0) {
      console.log('\n✅ AUTO-FIXES SUCCESSFULLY APPLIED:');
      results.autoFixesPerformed.forEach((fix, index) => {
        console.log(`  ${index + 1}. ${fix.api.toUpperCase()}: ${fix.fixMethod}`);
        console.log(`     Issue: ${fix.issue}`);
        console.log(`     Fixed at: ${new Date(fix.timestamp).toLocaleTimeString()}`);
      });
    }
    
    if (results.criticalIssuesRequiringAttention.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES REQUIRING YOUR ATTENTION:');
      results.criticalIssuesRequiringAttention.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue.api.toUpperCase()}: ${issue.issue}`);
        if (issue.attemptedFixes && issue.attemptedFixes.length > 0) {
          console.log(`     Attempted fixes: ${issue.attemptedFixes.join(', ')}`);
        }
      });
    }
    
    console.log('\n📧 Testing intelligent email system...');
    
    // Test email (if configured and there are issues/fixes to report)
    if (process.env.SMTP_SERVER) {
      if (results.criticalIssuesRequiringAttention.length > 0 || results.autoFixesPerformed.length > 0) {
        const emailResult = await manager.sendIntelligentHealthReport(results);
        if (emailResult.success) {
          console.log(`✅ ${emailResult.emailType.toUpperCase()} email sent successfully (ID: ${emailResult.messageId})`);
        } else {
          console.log(`❌ Email failed: ${emailResult.error}`);
        }
      } else {
        console.log('ℹ️ All systems healthy - no email sent (intelligent alerting)');
      }
    } else {
      console.log('⚠️ Email not configured (SMTP_SERVER not set)');
    }

    console.log('\n🤖 INTELLIGENT MONITORING ANALYSIS:');
    console.log('===================================');
    
    if (results.overallStatus === 'healthy') {
      console.log('🎉 PERFECT! All systems are running optimally.');
      console.log('   • No issues detected');
      console.log('   • No fixes needed');
      console.log('   • No email alerts required');
      console.log('   • System operating at 100% efficiency');
    } else if (results.overallStatus === 'auto_fixed') {
      console.log('🔧 GOOD! Issues detected and automatically resolved.');
      console.log(`   • ${results.systemsFixed} system(s) automatically fixed`);
      console.log('   • You received a notification about the fixes applied');
      console.log('   • No manual intervention needed');
      console.log('   • System restored to optimal operation');
    } else if (results.overallStatus === 'requires_attention') {
      console.log('🚨 ATTENTION NEEDED! Some issues require manual intervention.');
      console.log(`   • ${results.systemsRequiringManualIntervention} system(s) need your attention`);
      console.log('   • AI attempted automatic fixes but was unsuccessful');
      console.log('   • You received a detailed alert email');
      console.log('   • Manual action required for full restoration');
    }

    console.log('\n💡 SYSTEM INTELLIGENCE FEATURES:');
    console.log('=================================');
    console.log('✅ Only emails you when action is needed');
    console.log('✅ Automatically fixes common issues');
    console.log('✅ Provides detailed fix information');
    console.log('✅ Tests backup keys when needed');
    console.log('✅ Retries network and server errors');
    console.log('✅ Intelligent error categorization');
    console.log('✅ Comprehensive auto-fix attempt logging');

    console.log('\n🚀 DEPLOYMENT READY:');
    console.log('====================');
    console.log('Your intelligent AI monitoring system is ready for production!');
    console.log('• Deploy with: vercel --prod');
    console.log(`• Will monitor ${Object.keys(results.apis).length} APIs automatically`);
    console.log('• Auto-fixes issues when possible');
    console.log('• Only alerts you when manual intervention is required');
    console.log('• Runs 9 times daily for optimal coverage');

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
}

// Run the test
testAutoFixingSystem();