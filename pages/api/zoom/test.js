export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Test basic Zoom API connectivity
    const response = await fetch('https://api.zoom.us/v2/', {
      method: 'GET',
      headers: {
        'User-Agent': 'zoom-sdk-test'
      }
    });

    const config = {
      ZOOM_CLIENT_ID: process.env.ZOOM_CLIENT_ID ? process.env.ZOOM_CLIENT_ID.substring(0, 5) + '...' : 'NOT SET',
      ZOOM_CLIENT_SECRET: process.env.ZOOM_CLIENT_SECRET ? process.env.ZOOM_CLIENT_SECRET.substring(0, 5) + '...' : 'NOT SET',
      ZOOM_REDIRECT_URI: process.env.ZOOM_REDIRECT_URI || 'NOT SET',
      ZOOM_BASE_URL: process.env.ZOOM_BASE_URL || 'NOT SET',
    };

    const testAuthUrl = new URL('https://zoom.us/oauth/authorize');
    testAuthUrl.searchParams.append('response_type', 'code');
    testAuthUrl.searchParams.append('client_id', process.env.ZOOM_CLIENT_ID);
    testAuthUrl.searchParams.append('redirect_uri', process.env.ZOOM_REDIRECT_URI);
    testAuthUrl.searchParams.append('state', 'test-state');
    testAuthUrl.searchParams.append('scope', 'meeting:read meeting:write user:read user_info:read');

    res.json({
      status: 'OK',
      zoomApiReachable: response.status === 404, // Zoom API returns 404 for root endpoint when reachable
      config,
      testAuthUrl: testAuthUrl.toString(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Zoom test error:', error);
    res.status(500).json({
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}