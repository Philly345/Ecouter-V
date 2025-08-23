// Vercel Cron Job API endpoint with Backup Key Support
// This runs automatically at scheduled times

const { BackupAPIManager } = require('../../../lib/backup-api-manager.cjs');

export default async function handler(req, res) {
  // Verify this is a cron request (Vercel adds this header)
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('🔍 Starting scheduled health check with backup key support...');
    
    const apiManager = new BackupAPIManager();
    
    // Perform enhanced health check with backup key testing
    const healthData = await apiManager.performHealthCheck();
    
    console.log(`📊 Enhanced health check completed - Status: ${healthData.overallStatus}`);
    
    // Count backup key statistics
    const totalBackupKeys = Object.values(healthData.backupKeyStatus).reduce((sum, status) => sum + (status.totalKeys - 1), 0);
    const apisWithBackups = Object.values(healthData.apis).filter(api => api.hasWorkingBackups).length;
    
    console.log(`🔑 Backup keys: ${totalBackupKeys} total, ${apisWithBackups} APIs have working backups`);
    
    // Send enhanced email report with backup key information
    const emailResult = await apiManager.sendHealthReport(healthData);
    
    if (emailResult.success) {
      console.log(`📧 Enhanced email report sent successfully - ID: ${emailResult.messageId}`);
    } else {
      console.error(`❌ Email failed: ${emailResult.error}`);
    }
    
    // Return enhanced success response
    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      healthStatus: healthData.overallStatus,
      apisChecked: Object.keys(healthData.apis).length,
      emailSent: emailResult.success,
      issues: healthData.issues.length,
      // Enhanced backup key information
      backupKeyStats: {
        totalBackupKeys,
        apisWithWorkingBackups: apisWithBackups,
        backupKeyStatus: healthData.backupKeyStatus
      },
      enhancedFeatures: [
        'Backup key testing',
        'Automatic key switching',
        'Multi-tier redundancy',
        'Smart error categorization'
      ]
    });
    
  } catch (error) {
    console.error('❌ Enhanced cron job failed:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}