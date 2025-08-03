import { connectDB } from '../../../lib/mongodb';
import { verifyToken } from '../../../utils/auth';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { platform, meetingUrl, meetingId, meetingPassword, userId } = req.body;

    if (!platform || (!meetingUrl && !meetingId)) {
      return res.status(400).json({ error: 'Platform and meeting details are required' });
    }

    const { db } = await connectDB();

    // Create meeting session
    const meetingSession = {
      userId: new ObjectId(decoded.userId),
      platform,
      meetingUrl,
      meetingId,
      meetingPassword,
      status: 'connecting',
      createdAt: new Date(),
      startedAt: new Date(),
      transcript: [],
      participants: [],
      aiChat: [],
      settings: {
        autoJoin: true,
        recordAudio: true,
        speakerIdentification: true,
        realTimeTranscription: true,
        aiChatEnabled: true,
      }
    };

    const result = await db.collection('meeting_sessions').insertOne(meetingSession);
    
    // Start the meeting bot (simulated for now)
    // In production, this would launch a browser automation bot
    setTimeout(async () => {
      await db.collection('meeting_sessions').updateOne(
        { _id: result.insertedId },
        { 
          $set: { 
            status: 'recording',
            botId: `bot_${result.insertedId}`,
            joinedAt: new Date()
          } 
        }
      );
    }, 5000);

    res.status(200).json({
      success: true,
      sessionId: result.insertedId,
      status: 'connecting',
      message: 'Notetaker bot is joining your meeting'
    });

  } catch (error) {
    console.error('Error joining meeting:', error);
    res.status(500).json({ error: 'Failed to join meeting' });
  }
}
