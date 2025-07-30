import { usersDB } from '../../../../utils/database.js';
import { generateToken, setTokenCookie } from '../../../../utils/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }

    // Exchange code for token
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
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return res.status(400).json({ error: 'Failed to get access token' });
    }

    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const googleUser = await userResponse.json();

    if (!googleUser.email) {
      return res.status(400).json({ error: 'Failed to get user information' });
    }

    // Check if user exists
    let user = usersDB.findByEmail(googleUser.email);

    if (!user) {
      // Create new user
      user = usersDB.create({
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
      user = usersDB.update(user.id, {
        googleId: googleUser.id,
        avatar: googleUser.picture,
      });
    }

    // Generate JWT token
    const token = generateToken({ 
      userId: user.id, 
      email: user.email, 
      name: user.name 
    });

    // Set cookie
    setTokenCookie(res, token);

    // Redirect to a special page that will set localStorage and then redirect to dashboard
    const userData = JSON.stringify({
      id: user.id,
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
