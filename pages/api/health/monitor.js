const { getScheduler } = require('../../../lib/advanced-health-scheduler.cjs');

export default async function handler(req, res) {
  try {
    console.log('🩺 Advanced health monitor endpoint called');
    
    const scheduler = getScheduler();
    
    if (req.method === 'POST') {
      // Force run a health check with backup key testing
      console.log('🔥 Forcing immediate health check with backup key support...');
      await scheduler.forceHealthCheck();
      
      return res.status(200).json({
        success: true,
        message: 'Enhanced health check with backup key testing completed',
        timestamp: new Date().toISOString()
      });
    } else if (req.method === 'GET') {
      // Return scheduler status
      const status = scheduler.getStatus();
      
      return res.status(200).json({
        success: true,
        scheduler: status,
        backupKeySupport: true,
        enhancedFeatures: [
          'Automatic backup key switching',
          'Multi-key redundancy testing', 
          'Smart quota vs critical error detection',
          'Enhanced email reports with backup status'
        ],
        timestamp: new Date().toISOString()
      });
    } else {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed'
      });
    }
    
  } catch (error) {
    console.error('Advanced health monitor error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}