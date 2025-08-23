import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization token' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.userId) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Create OAuth authorization URL
    const state = jwt.sign({ userId: decoded.userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    const authUrl = new URL('https://zoom.us/oauth/authorize');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', process.env.ZOOM_CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', process.env.ZOOM_REDIRECT_URI);
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('scope', 'meeting:read meeting:write user:read user_info:read');

    res.json({ authUrl: authUrl.toString() });

  } catch (error) {
    console.error('Zoom connect error:', error);
    res.status(500).json({ error: 'Failed to generate authorization URL' });
  }
}