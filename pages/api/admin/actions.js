const { getAPIManager } = require('../../../lib/api-manager.cjs');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, params } = req.body;
    const apiManager = getAPIManager();

    switch (action) {
      case 'force_api_switch':
        const newAPI = await apiManager.switchToNextAPI(params?.currentAPI || apiManager.currentAPI);
        res.status(200).json({ 
          success: true, 
          message: `Switched to ${newAPI}`,
          newAPI 
        });
        break;

      case 'send_test_alert':
        await apiManager.sendInfoAlert('TEST_ALERT', 'This is a test alert from the admin dashboard');
        res.status(200).json({ 
          success: true, 
          message: 'Test alert sent successfully' 
        });
        break;

      case 'reset_api_usage':
        if (params?.apiName && apiManager.apis[params.apiName]) {
          apiManager.apis[params.apiName].usage = 0;
          apiManager.apis[params.apiName].errorCount = 0;
          await apiManager.saveAPIMetrics();
          res.status(200).json({ 
            success: true, 
            message: `Reset usage for ${params.apiName}` 
          });
        } else {
          res.status(400).json({ error: 'Invalid API name' });
        }
        break;

      case 'toggle_api_status':
        if (params?.apiName && apiManager.apis[params.apiName]) {
          apiManager.apis[params.apiName].isActive = !apiManager.apis[params.apiName].isActive;
          await apiManager.saveAPIMetrics();
          res.status(200).json({ 
            success: true, 
            message: `${params.apiName} ${apiManager.apis[params.apiName].isActive ? 'activated' : 'deactivated'}` 
          });
        } else {
          res.status(400).json({ error: 'Invalid API name' });
        }
        break;

      case 'clear_debug_cache':
        apiManager.debugAttempts.clear();
        res.status(200).json({ 
          success: true, 
          message: 'Debug cache cleared' 
        });
        break;

      default:
        res.status(400).json({ error: 'Unknown action' });
    }
  } catch (error) {
    console.error('Admin action error:', error);
    res.status(500).json({ error: 'Action failed' });
  }
}