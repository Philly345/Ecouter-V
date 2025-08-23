// Zoom Meeting API - Join Meeting
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify user authentication
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    const { meetingId, password, userName } = req.body;

    if (!meetingId) {
      return res.status(400).json({ error: 'Meeting ID is required' });
    }

    // Generate Zoom JWT Token for SDK
    const zoomJWT = jwt.sign({
      iss: process.env.ZOOM_API_KEY,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 2 // 2 hours
    }, process.env.ZOOM_API_SECRET);

    // Zoom Meeting SDK configuration
    const meetingConfig = {
      apiKey: process.env.ZOOM_API_KEY,
      signature: zoomJWT,
      meetingNumber: meetingId,
      password: password || '',
      userName: userName || 'Meeting Assistant',
      userEmail: decoded.email || '',
      passWord: password || '',
      role: 0, // Participant role
      success: function(res) {
        console.log('✅ Zoom meeting joined successfully');
      },
      error: function(res) {
        console.error('❌ Zoom meeting join failed:', res);
      }
    };

    // In a real implementation, you might want to:
    // 1. Validate the meeting exists
    // 2. Check if user has permission to join
    // 3. Log the meeting join event

    res.status(200).json({
      success: true,
      meetingTitle: `Meeting ${meetingId}`,
      config: meetingConfig,
      message: 'Meeting configuration generated successfully'
    });

  } catch (error) {
    console.error('❌ Error joining meeting:', error);
    res.status(500).json({ 
      error: 'Failed to join meeting',
      details: error.message 
    });
  }
}