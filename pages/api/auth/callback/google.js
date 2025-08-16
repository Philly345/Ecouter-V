import { usersDB } from '../../../../utils/database.js';
import { generateToken, setTokenCookie } from '../../../../utils/auth.js';

export default async function handler(req, res) {
  console.log('--- Google Callback Handler Reached ---');
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }

    // Exchange code for token
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'https://ecoutertranscribe.tech/api/auth/callback/google';
    
    // Debug logging
    console.log('Google Callback Debug - Starting OAuth flow');
    console.log('GOOGLE_REDIRECT_URI env var:', process.env.GOOGLE_REDIRECT_URI);
    console.log('Final redirectUri:', redirectUri);
    console.log('Received code:', code ? 'present' : 'missing');
    
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();
    console.log('Token exchange response:', tokenData);

    if (!tokenData.access_token) {
      console.error('Failed to get access token. Response:', tokenData);
      return res.status(400).json({ error: 'Failed to get access token' });
    }

    // Get user info from Google
    console.log('Fetching user info from Google...');
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const googleUser = await userResponse.json();
    console.log('Google user info:', JSON.stringify(googleUser, null, 2));

    if (!googleUser.email) {
      console.error('No email in Google user info:', googleUser);
      return res.status(400).json({ error: 'Failed to get user information' });
    }

    // Check if user exists
    let user = await usersDB.findByEmail(googleUser.email);

    if (!user) {
      // Create new user
      user = await usersDB.create({
        name: googleUser.name || googleUser.email.split('@')[0],
        email: googleUser.email,
        provider: 'google',
        googleId: googleUser.id,
        avatar: googleUser.picture,
        storageUsed: 0,
        transcriptionsCount: 0,
        minutesUsed: 0,
      });
    } else {
      // Update existing user with Google info
      user = await usersDB.update(user._id, {
        googleId: googleUser.id,
        avatar: googleUser.picture,
      });
    }

    // Generate JWT token
    const token = generateToken({ 
      userId: user._id, // MongoDB uses _id as the primary key
      email: user.email, 
      name: user.name 
    });

    // Set cookie
    setTokenCookie(res, token);

    // Redirect to a special page that will set localStorage and then redirect to dashboard
    const userData = JSON.stringify({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      avatar: user.avatar || null
    });
    
    // Send HTML response that sets localStorage and redirects
    res.setHeader('Content-Type', 'text/html');
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authenticating...</title>
        </head>
        <body>
          <p>Authenticating...</p>
          <script>
            // Store user data and token in localStorage
            localStorage.setItem('user', '${userData.replace(/'/g, "\\'")}');
            localStorage.setItem('token', '${token}');
            // Redirect to dashboard
            window.location.href = '/dashboard';
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.redirect('/login?error=oauth_failed');
  }
}
