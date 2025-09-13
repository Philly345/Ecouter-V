import { verifyTokenString, getTokenFromRequest } from '../../../utils/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if user is already logged in
    const existingToken = getTokenFromRequest(req);
    if (existingToken) {
      const decoded = verifyTokenString(existingToken);
      if (decoded && decoded.email) {
        console.log('🚫 User already logged in, blocking Google OAuth:', decoded.email);
        // Redirect to dashboard with error message
        return res.redirect('/dashboard?error=already_logged_in&email=' + encodeURIComponent(decoded.email));
      }
    }

    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ].join(' ');

    // Use environment variable with fallback to production domain
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'https://ecoutertranscribe.tech/api/auth/callback/google';
    
    // Debug logging
    console.log('Google OAuth Debug:');
    console.log('GOOGLE_REDIRECT_URI env var:', process.env.GOOGLE_REDIRECT_URI);
    console.log('Final redirectUri:', redirectUri);
    console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
    
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      scope: scopes,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    
    res.redirect(authUrl);
  } catch (error) {
    console.error('Google auth initiation error:', error);
    res.status(500).json({ error: 'Failed to initiate Google authentication' });
  }
}
