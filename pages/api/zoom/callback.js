import { connectToDatabase } from '../../../lib/mongodb';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { code, state, error, error_description } = req.query;

    console.log('Zoom OAuth callback received:', { code: !!code, state: !!state, error, error_description });

    // Handle OAuth errors
    if (error) {
      console.error('OAuth error:', error, error_description);
      return res.redirect(`/zoom-meetings?error=${error}&description=${encodeURIComponent(error_description || 'OAuth authorization failed')}`);
    }

    if (!code) {
      console.error('No authorization code received');
      return res.status(400).json({ error: 'Authorization code not provided' });
    }

    // Exchange authorization code for access token
    console.log('Attempting token exchange with Zoom...');
    const tokenResponse = await fetch('https://zoom.us/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.ZOOM_REDIRECT_URI,
      }),
    });

    console.log('Token response status:', tokenResponse.status);

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', tokenResponse.status, errorData);
      return res.redirect(`/zoom-meetings?error=token_exchange_failed&description=${encodeURIComponent('Failed to exchange authorization code: ' + errorData)}`);
    }

    const tokenData = await tokenResponse.json();
    
    // Get user information from state parameter (contains JWT token)
    let userId = null;
    if (state) {
      try {
        const decoded = jwt.verify(state, process.env.JWT_SECRET);
        userId = decoded.userId;
      } catch (error) {
        console.error('Failed to decode state token:', error);
      }
    }

    // Get Zoom user info
    const userResponse = await fetch('https://api.zoom.us/v2/users/me', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    const zoomUser = await userResponse.json();

    // Store tokens in database
    if (userId) {
      const { db } = await connectToDatabase();
      
      await db.collection('users').updateOne(
        { _id: userId },
        {
          $set: {
            zoomTokens: {
              access_token: tokenData.access_token,
              refresh_token: tokenData.refresh_token,
              expires_at: new Date(Date.now() + (tokenData.expires_in * 1000)),
              scope: tokenData.scope,
              token_type: tokenData.token_type,
            },
            zoomProfile: {
              id: zoomUser.id,
              email: zoomUser.email,
              first_name: zoomUser.first_name,
              last_name: zoomUser.last_name,
              account_id: zoomUser.account_id,
            },
            zoomConnectedAt: new Date(),
          }
        }
      );
    }

    // Redirect back to the zoom meetings page with success
    res.redirect('/zoom-meetings?connected=true');

  } catch (error) {
    console.error('Zoom OAuth callback error:', error);
    res.redirect('/zoom-meetings?error=connection_failed');
  }
}