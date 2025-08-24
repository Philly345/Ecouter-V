// Comprehensive AI Monitoring API - Runs Every Hour
const { ComprehensiveAIMonitor } = require('../../../lib/comprehensive-ai-monitor.cjs');

export default async function handler(req, res) {
  // Only allow cron jobs to trigger this
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify it's a Vercel cron request (optional security check)
  const cronSecret = req.headers['x-vercel-cron-signature'] || req.query.secret;
  if (!cronSecret && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'Unauthorized - Cron only' });
  }

  console.log('🚀 Comprehensive AI Monitoring triggered at:', new Date().toISOString());

  try {
    // Initialize the comprehensive monitoring system
    const monitor = new ComprehensiveAIMonitor();

    // Run the complete monitoring suite
    console.log('🔍 Starting comprehensive system monitoring...');
    const monitoringResults = await monitor.runComprehensiveMonitoring();

    // Send detailed email report
    console.log('📧 Sending comprehensive email report...');
    const emailResult = await monitor.sendComprehensiveReport(monitoringResults);

    // Prepare response summary
    const summary = {
      timestamp: new Date().toISOString(),
      monitoringComplete: true,
      overallStatus: monitoringResults.overallStatus,
      systemsChecked: {
        apis: Object.keys(monitoringResults.apiHealth.detailedResults).length,
        securityChecks: Object.keys(monitoringResults.securityStatus.checks).length,
        websiteMetrics: 'analyzed',
        systemHealth: 'monitored',
        processingStatus: 'checked',
        userActivity: 'tracked'
      },
      results: {
        healthyAPIs: monitoringResults.apiHealth.healthyAPIs,
        totalAPIs: monitoringResults.apiHealth.totalAPIs,
        autoFixesApplied: monitoringResults.apiHealth.autoFixesApplied,
        securityRiskLevel: monitoringResults.securityStatus.riskLevel,
        activeUsers: monitoringResults.websiteMetrics.currentUsers,
        systemHealth: monitoringResults.systemHealth.overallHealth,
        processingIssues: monitoringResults.processingStatus.stuckFiles,
        userTrend: monitoringResults.userActivity.trends
      },
      alerts: {
        criticalIssues: monitoringResults.criticalIssues.length,
        warnings: monitoringResults.warnings.length,
        immediateActionRequired: monitoringResults.immediateActionRequired,
        recommendations: monitoringResults.recommendations.length
      },
      emailReport: {
        sent: emailResult.success,
        messageId: emailResult.messageId || null,
        error: emailResult.error || null
      },
      nextCheck: monitoringResults.nextCheckTime
    };

    // Log comprehensive summary
    console.log('✅ Comprehensive monitoring complete:');
    console.log(`   📊 Overall Status: ${monitoringResults.overallStatus}`);
    console.log(`   🔌 APIs: ${monitoringResults.apiHealth.healthyAPIs}/${monitoringResults.apiHealth.totalAPIs} healthy`);
    console.log(`   🛡️ Security: ${monitoringResults.securityStatus.riskLevel} risk`);
    console.log(`   👥 Users: ${monitoringResults.websiteMetrics.currentUsers} active`);
    console.log(`   ⚙️ System: ${monitoringResults.systemHealth.overallHealth}`);
    console.log(`   🔧 Auto-fixes: ${monitoringResults.apiHealth.autoFixesApplied} applied`);
    console.log(`   📧 Email: ${emailResult.success ? 'Sent' : 'Failed'}`);
    
    if (monitoringResults.immediateActionRequired) {
      console.log('🚨 CRITICAL: Manual intervention required!');
      console.log(`   Issues: ${monitoringResults.criticalIssues.map(i => i.issue).join(', ')}`);
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Comprehensive AI monitoring completed successfully',
      summary,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 Critical error in comprehensive monitoring:', error);

    // Try to send emergency email about monitoring failure
    try {
      const monitor = new ComprehensiveAIMonitor();
      const emergencyEmail = {
        from: process.env.SMTP_SENDER,
        to: 'ecouter.transcribe@gmail.com',
        subject: '🚨 CRITICAL: AI Monitoring System Failure',
        html: `
          <div style="background: #fee2e2; padding: 20px; border-radius: 8px; font-family: Arial, sans-serif;">
            <h2 style="color: #dc2626;">🚨 AI Monitoring System Failure</h2>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Error:</strong> ${error.message}</p>
            <p><strong>Status:</strong> Comprehensive monitoring failed to complete</p>
            <div style="background: #fef2f2; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3>⚠️ Immediate Action Required</h3>
              <p>The AI monitoring system encountered a critical error and was unable to complete the hourly health check.</p>
              <p>Please investigate the system logs and restore monitoring functionality immediately.</p>
            </div>
            <p><small>This is an automated emergency alert from the AI monitoring system.</small></p>
          </div>
        `
      };

      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransporter(monitor.emailConfig);
      await transporter.sendMail(emergencyEmail);
      console.log('📧 Emergency email sent about monitoring failure');

    } catch (emailError) {
      console.error('📧 Failed to send emergency email:', emailError);
    }

    // Return error response
    res.status(500).json({
      success: false,
      error: 'Comprehensive monitoring failed',
      message: error.message,
      timestamp: new Date().toISOString(),
      action: 'Emergency email sent, manual investigation required'
    });
  }
}