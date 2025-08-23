// Zoom Meeting API - Leave Meeting
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

    const { meetingId } = req.body;

    if (!meetingId) {
      return res.status(400).json({ error: 'Meeting ID is required' });
    }

    // Log the meeting leave event
    console.log(`📤 User ${decoded.email} left meeting ${meetingId}`);

    // In a real implementation, you might want to:
    // 1. Clean up any meeting-related resources
    // 2. Save final meeting data
    // 3. Notify other participants
    // 4. Stop any recording or transcription services

    res.status(200).json({
      success: true,
      message: 'Successfully left meeting'
    });

  } catch (error) {
    console.error('❌ Error leaving meeting:', error);
    res.status(500).json({ 
      error: 'Failed to leave meeting',
      details: error.message 
    });
  }
}