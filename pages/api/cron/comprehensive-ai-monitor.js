// Comprehensive AI Monitoring API Endpoint
const { ComprehensiveAIMonitor } = require('../../../lib/comprehensive-ai-monitor.cjs');

export default async function handler(req, res) {
  // Verify this is a cron request
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.log('❌ Unauthorized cron request - missing or invalid auth header');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('🤖 === COMPREHENSIVE AI MONITORING SYSTEM ACTIVATED ===');
  console.log(`🕐 Cron trigger received at ${new Date().toLocaleString()}`);
  
  try {
    // Initialize the comprehensive AI monitor
    const aiMonitor = new ComprehensiveAIMonitor();
    
    // Run the full comprehensive check
    const results = await aiMonitor.runComprehensiveCheck();
    
    // Log summary to console
    console.log('\n📈 === MONITORING SUMMARY ===');
    console.log(`Overall Status: ${results.overallStatus.toUpperCase()}`);
    console.log(`Checks Performed: ${results.totalChecks}`);
    console.log(`Passed: ${results.passedChecks} | Warnings: ${results.warningChecks} | Failed: ${results.failedChecks}`);
    console.log(`Auto-Fixes Applied: ${results.apiHealth?.autoFixesApplied || 0}`);
    console.log(`Manual Intervention Needed: ${results.immediateActionRequired?.length || 0}`);
    console.log(`Email Status: ${results.emailStatus?.success ? 'Sent' : 'Failed'}`);
    
    if (results.emailStatus?.success) {
      console.log(`Email Message ID: ${results.emailStatus.messageId}`);
      console.log(`Email Priority: ${results.emailStatus.priority}`);
    }
    
    console.log('\n✅ Comprehensive AI monitoring complete');
    console.log(`🔄 Next check scheduled for: ${new Date(Date.now() + 60 * 60 * 1000).toLocaleString()}`);
    console.log('🤖 === COMPREHENSIVE AI MONITORING SYSTEM COMPLETE ===\n');
    
    // Return success response
    res.status(200).json({
      success: true,
      timestamp: results.timestamp,
      checkId: results.checkId,
      overallStatus: results.overallStatus,
      summary: {
        totalChecks: results.totalChecks,
        passedChecks: results.passedChecks,
        warningChecks: results.warningChecks,
        failedChecks: results.failedChecks,
        autoFixesApplied: results.apiHealth?.autoFixesApplied || 0,
        manualInterventionNeeded: results.immediateActionRequired?.length || 0,
        emailSent: results.emailStatus?.success || false
      },
      nextCheck: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      message: 'Comprehensive AI monitoring completed successfully'
    });
    
  } catch (error) {
    console.error('💥 Critical error in comprehensive AI monitoring:', error);
    
    // Try to send emergency alert
    try {
      const emergencyMonitor = new ComprehensiveAIMonitor();
      await emergencyMonitor.sendEmergencyAlert(error);
      console.log('📧 Emergency alert sent');
    } catch (emailError) {
      console.error('❌ Failed to send emergency alert:', emailError);
    }
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      emergencyAlertSent: true,
      message: 'Comprehensive AI monitoring failed - emergency alert sent'
    });
  }
}