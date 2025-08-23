// Manual health check trigger for testing
const { VercelAPIManager } = require('../../lib/vercel-api-manager.cjs');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🧪 Manual health check triggered...');
    
    const apiManager = new VercelAPIManager();
    
    // Perform health check
    const healthData = await apiManager.performHealthCheck();
    
    console.log(`📊 Health check completed - Status: ${healthData.overallStatus}`);
    
    // Send email report
    const emailResult = await apiManager.sendHealthReport(healthData);
    
    res.status(200).json({
      success: true,
      message: 'Health check completed and email sent',
      timestamp: new Date().toISOString(),
      healthStatus: healthData.overallStatus,
      apisChecked: Object.keys(healthData.apis).length,
      emailSent: emailResult.success,
      emailMessageId: emailResult.messageId,
      issues: healthData.issues,
      apiDetails: healthData.apis
    });
    
  } catch (error) {
    console.error('❌ Manual health check failed:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}