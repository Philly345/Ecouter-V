import { verifyTokenString, getTokenFromRequest } from '../../../utils/auth.js';
import { getUserDevices } from '../../../lib/deviceMonitor.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const token = getTokenFromRequest(req);
    const decoded = verifyTokenString(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = decoded.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Invalid token - missing user ID' });
    }

    // Get user's device history
    const devices = await getUserDevices(userId);
    
    res.status(200).json({
      success: true,
      devices: devices
    });

  } catch (error) {
    console.error('Device history API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}