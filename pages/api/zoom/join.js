import { connectToDatabase } from '../../../lib/mongodb';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';

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

    const { meetingId, password, userName } = req.body;

    if (!meetingId) {
      return res.status(400).json({ error: 'Meeting ID is required' });
    }

    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({ 
      _id: new ObjectId(decoded.userId) 
    });

    if (!user || !user.zoomTokens || !user.zoomTokens.access_token) {
      return res.status(401).json({ error: 'Zoom account not connected' });
    }

    // Check if token is still valid
    if (user.zoomTokens.expires_at && new Date(user.zoomTokens.expires_at) < new Date()) {
      return res.status(401).json({ error: 'Zoom token expired. Please reconnect.' });
    }

    // Get meeting information
    try {
      const meetingResponse = await fetch(`https://api.zoom.us/v2/meetings/${meetingId}`, {
        headers: {
          'Authorization': `Bearer ${user.zoomTokens.access_token}`,
        },
      });

      if (!meetingResponse.ok) {
        if (meetingResponse.status === 404) {
          return res.status(404).json({ error: 'Meeting not found or invalid meeting ID' });
        }
        throw new Error(`Meeting API error: ${meetingResponse.status}`);
      }

      const meetingData = await meetingResponse.json();

      // Store meeting session in database
      const meetingSession = {
        userId: new ObjectId(decoded.userId),
        meetingId: meetingId,
        meetingTitle: meetingData.topic || `Meeting ${meetingId}`,
        meetingHost: meetingData.host_email,
        startTime: new Date(),
        endTime: null,
        transcript: '',
        summary: '',
        participants: [],
        isActive: true,
        createdAt: new Date(),
      };

      const result = await db.collection('meetingSessions').insertOne(meetingSession);

      res.json({
        success: true,
        meeting: {
          id: meetingId,
          title: meetingData.topic || `Meeting ${meetingId}`,
          host: meetingData.host_email,
          sessionId: result.insertedId,
        },
        meetingTitle: meetingData.topic || `Meeting ${meetingId}`,
      });

    } catch (meetingError) {
      console.error('Meeting join error:', meetingError);
      
      // If meeting API fails, still allow joining with basic info
      const meetingSession = {
        userId: new ObjectId(decoded.userId),
        meetingId: meetingId,
        meetingTitle: `Meeting ${meetingId}`,
        meetingHost: 'Unknown',
        startTime: new Date(),
        endTime: null,
        transcript: '',
        summary: '',
        participants: [],
        isActive: true,
        createdAt: new Date(),
      };

      const result = await db.collection('meetingSessions').insertOne(meetingSession);

      res.json({
        success: true,
        meeting: {
          id: meetingId,
          title: `Meeting ${meetingId}`,
          host: 'Unknown',
          sessionId: result.insertedId,
        },
        meetingTitle: `Meeting ${meetingId}`,
      });
    }

  } catch (error) {
    console.error('Join meeting error:', error);
    res.status(500).json({ error: 'Failed to join meeting' });
  }
}