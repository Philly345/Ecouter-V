import { connectToDatabase } from '../../../lib/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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

    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({ 
      _id: new ObjectId(decoded.userId) 
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isConnected = !!(user.zoomTokens && user.zoomTokens.access_token);
    
    // Check if token is still valid
    if (isConnected && user.zoomTokens.expires_at && new Date(user.zoomTokens.expires_at) < new Date()) {
      // Token expired, try to refresh
      if (user.zoomTokens.refresh_token) {
        try {
          const refreshResponse = await fetch('https://zoom.us/oauth/token', {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${Buffer.from(`${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`).toString('base64')}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              grant_type: 'refresh_token',
              refresh_token: user.zoomTokens.refresh_token,
            }),
          });

          if (refreshResponse.ok) {
            const tokenData = await refreshResponse.json();
            
            // Update tokens in database
            await db.collection('users').updateOne(
              { _id: new ObjectId(decoded.userId) },
              {
                $set: {
                  'zoomTokens.access_token': tokenData.access_token,
                  'zoomTokens.refresh_token': tokenData.refresh_token || user.zoomTokens.refresh_token,
                  'zoomTokens.expires_at': new Date(Date.now() + (tokenData.expires_in * 1000)),
                }
              }
            );

            res.json({ 
              connected: true, 
              profile: user.zoomProfile 
            });
            return;
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
        }
      }
      
      // If refresh failed, mark as disconnected
      res.json({ connected: false });
      return;
    }

    res.json({ 
      connected: isConnected, 
      profile: isConnected ? user.zoomProfile : null 
    });

  } catch (error) {
    console.error('Zoom status error:', error);
    res.status(500).json({ error: 'Failed to check Zoom connection status' });
  }
}