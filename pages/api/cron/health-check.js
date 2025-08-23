// Vercel Cron Job API endpoint with Auto-Fixing Capabilities
// This runs automatically at scheduled times

const { AutoFixingAPIManager } = require('../../../lib/auto-fixing-api-manager.cjs');

export default async function handler(req, res) {
  // Verify this is a cron request (Vercel adds this header)
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('� Starting intelligent health check with auto-fixing...');
    
    const apiManager = new AutoFixingAPIManager();
    
    // Perform health check with auto-fixing
    const healthData = await apiManager.performHealthCheckWithAutoFix();
    
    console.log(`🎯 Auto-fix results: ${healthData.systemsFixed} fixed, ${healthData.systemsRequiringManualIntervention} need attention`);
    
    // Send intelligent email report (only if there are issues or fixes)
    let emailResult = { success: false, reason: 'No email needed - all systems healthy' };
    
    if (healthData.criticalIssuesRequiringAttention.length > 0 || healthData.autoFixesPerformed.length > 0) {
      console.log('� Sending intelligent health report...');
      emailResult = await apiManager.sendIntelligentHealthReport(healthData);
      
      if (emailResult.success) {
        console.log(`✅ ${emailResult.emailType} report sent - ID: ${emailResult.messageId}`);
      } else {
        console.error(`❌ Email failed: ${emailResult.error}`);
      }
    } else {
      console.log('✅ All systems healthy - no email needed');
    }
    
    // Return enhanced response
    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      overallStatus: healthData.overallStatus,
      apisChecked: Object.keys(healthData.apis).length,
      autoFixResults: {
        systemsFixed: healthData.systemsFixed,
        systemsRequiringAttention: healthData.systemsRequiringManualIntervention,
        fixesPerformed: healthData.autoFixesPerformed.map(fix => `${fix.api}: ${fix.fixMethod}`)
      },
      emailSent: emailResult.success,
      emailType: emailResult.emailType || 'none',
      intelligentMonitoring: {
        autoFixingEnabled: true,
        backupKeySupport: true,
        onlyAlertsOnIssues: true
      }
    });
    
  } catch (error) {
    console.error('❌ Intelligent cron job failed:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}