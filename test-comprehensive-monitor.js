// Test Comprehensive AI Monitoring System
const { ComprehensiveAIMonitor } = require('./lib/comprehensive-ai-monitor.cjs');

async function testComprehensiveMonitoring() {
  console.log('🧪 ====== TESTING COMPREHENSIVE AI MONITORING SYSTEM ======');
  console.log(`🕐 Test started at ${new Date().toLocaleString()}\n`);
  
  try {
    // Initialize the comprehensive AI monitor
    console.log('🤖 Initializing Comprehensive AI Monitor...');
    const aiMonitor = new ComprehensiveAIMonitor();
    console.log('✅ Monitor initialized successfully\n');
    
    // Run a full comprehensive check
    console.log('🔍 Running comprehensive system check...');
    const results = await aiMonitor.runComprehensiveCheck();
    
    // Display detailed results
    console.log('\n📊 ====== COMPREHENSIVE TEST RESULTS ======');
    console.log(`Check ID: ${results.checkId}`);
    console.log(`Overall Status: ${results.overallStatus.toUpperCase()}`);
    console.log(`Timestamp: ${results.timestamp}`);
    
    console.log('\n📈 Summary Statistics:');
    console.log(`  Total Checks: ${results.totalChecks}`);
    console.log(`  Passed: ${results.passedChecks}`);
    console.log(`  Warnings: ${results.warningChecks}`);
    console.log(`  Failed: ${results.failedChecks}`);
    
    console.log('\n🔧 Auto-Fix Results:');
    console.log(`  Auto-Fixes Applied: ${results.apiHealth?.autoFixesApplied || 0}`);
    console.log(`  Manual Intervention Needed: ${results.immediateActionRequired?.length || 0}`);
    
    console.log('\n📡 API Health:');
    console.log(`  Status: ${results.apiHealth.status}`);
    console.log(`  Healthy APIs: ${results.apiHealth.healthyAPIs}/${results.apiHealth.totalAPIs}`);
    console.log(`  Backup Keys Available: ${results.apiHealth.backupKeysAvailable}`);
    
    console.log('\n🔒 Security Status:');
    console.log(`  Status: ${results.securityStatus.status}`);
    console.log(`  Critical Issues: ${results.securityStatus.issues?.length || 0}`);
    console.log(`  Warnings: ${results.securityStatus.warnings?.length || 0}`);
    
    console.log('\n📊 Website Metrics:');
    if (results.websiteMetrics.activeUsers !== undefined) {
      console.log(`  Active Users: ${results.websiteMetrics.activeUsers}`);
      console.log(`  Processing Jobs: ${results.websiteMetrics.processing?.activeJobs || 0}`);
      console.log(`  Error Rate: ${results.websiteMetrics.performance?.errorRate || 0}%`);
      console.log(`  Uptime: ${results.websiteMetrics.performance?.uptime || 99.9}%`);
    } else {
      console.log(`  Status: ${results.websiteMetrics.status || 'Collecting data...'}`);
    }
    
    console.log('\n⚙️ System Health:');
    console.log(`  Status: ${results.systemHealth.status}`);
    console.log(`  Issues: ${results.systemHealth.issues?.length || 0}`);
    
    console.log('\n📁 Processing Status:');
    if (results.processingStatus) {
      console.log(`  Stuck Files: ${results.processingStatus.stuckFiles || 0}`);
      console.log(`  Queue Length: ${results.processingStatus.queueLength || 0}`);
      console.log(`  Auto-Cleanup: ${results.processingStatus.autoCleanupActive ? 'Active' : 'Inactive'}`);
    }
    
    console.log('\n🗄️ Database Health:');
    if (results.databaseHealth) {
      console.log(`  Status: ${results.databaseHealth.status}`);
      console.log(`  Connectivity: ${results.databaseHealth.connectivity ? 'Connected' : 'Disconnected'}`);
      console.log(`  Response Time: ${results.databaseHealth.responseTime || 'N/A'}ms`);
    }
    
    console.log('\n🌐 External Dependencies:');
    if (results.externalDependencies) {
      console.log(`  Status: ${results.externalDependencies.status}`);
      console.log(`  Healthy: ${results.externalDependencies.healthyCount}/${results.externalDependencies.totalCount}`);
      
      if (results.externalDependencies.dependencies) {
        console.log('  Dependencies:');
        results.externalDependencies.dependencies.forEach(dep => {
          console.log(`    - ${dep.name} (${dep.type}): ${dep.status.toUpperCase()} ${dep.responseTime ? `(${dep.responseTime}ms)` : ''}`);
        });
      }
    }
    
    console.log('\n📧 Email Report:');
    if (results.emailStatus) {
      console.log(`  Status: ${results.emailStatus.success ? 'Sent Successfully' : 'Failed'}`);
      console.log(`  Priority: ${results.emailStatus.priority || 'Normal'}`);
      if (results.emailStatus.messageId) {
        console.log(`  Message ID: ${results.emailStatus.messageId}`);
      }
      if (results.emailStatus.error) {
        console.log(`  Error: ${results.emailStatus.error}`);
      }
    }
    
    // Show critical issues if any
    if (results.immediateActionRequired && results.immediateActionRequired.length > 0) {
      console.log('\n🚨 IMMEDIATE ACTION REQUIRED:');
      results.immediateActionRequired.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${typeof issue === 'object' ? `${issue.api || issue.type}: ${issue.issue}` : issue}`);
      });
    }
    
    // Show auto-fixes if any
    if (results.autoFixesApplied && results.autoFixesApplied.length > 0) {
      console.log('\n🔧 AUTO-FIXES APPLIED:');
      results.autoFixesApplied.forEach((fix, index) => {
        console.log(`  ${index + 1}. ${fix.api}: ${fix.issue} → ${fix.fixMethod}`);
      });
    }
    
    console.log('\n✅ ====== TEST COMPLETED SUCCESSFULLY ======');
    console.log(`🎯 Overall System Status: ${results.overallStatus.toUpperCase()}`);
    console.log(`📊 Health Score: ${Math.round((results.passedChecks / results.totalChecks) * 100)}%`);
    console.log(`🔄 Next scheduled check: Every hour (24/7 monitoring)`);
    console.log(`📧 Email notifications: ${results.emailStatus?.success ? 'Working' : 'Needs attention'}`);
    
    // Provide recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (results.overallStatus === 'critical') {
      console.log('  🚨 Address critical issues immediately');
      console.log('  📞 Consider manual intervention for failed auto-fixes');
    } else if (results.overallStatus === 'warning') {
      console.log('  ⚠️ Monitor warnings closely in next few hours');
      console.log('  🔍 Review system resources and performance');
    } else if (results.overallStatus === 'auto_fixed') {
      console.log('  ✅ AI system successfully resolved issues automatically');
      console.log('  📈 Continue monitoring for stability');
    } else {
      console.log('  🎉 System is operating perfectly');
      console.log('  🚀 All monitoring systems are working optimally');
    }
    
    console.log('\n🤖 Comprehensive AI Monitoring Test Complete! 🤖\n');
    
  } catch (error) {
    console.error('\n💥 TEST FAILED:', error);
    console.error('Stack trace:', error.stack);
    console.log('\n❌ ====== TEST FAILED ======\n');
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testComprehensiveMonitoring()
    .then(() => {
      console.log('🎯 Test script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Test script failed:', error);
      process.exit(1);
    });
}

module.exports = { testComprehensiveMonitoring };
