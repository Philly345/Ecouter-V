import { connectDB } from '../../../lib/mongodb';
import { verifyToken } from '../../../utils/auth';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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

    const { db } = await connectDB();

    // Get the latest active meeting session for this user
    const meetingSession = await db.collection('meeting_sessions')
      .findOne({ 
        userId: new ObjectId(decoded.userId),
        status: 'recording' 
      }, 
      { sort: { startedAt: -1 } }
    );

    if (!meetingSession) {
      return res.status(404).json({ error: 'No active meeting found' });
    }

    // Simulate real-time transcript data
    // In production, this would come from the meeting bot's audio processing
    const transcript = [
      {
        speaker: 'Host',
        text: 'Welcome everyone to today\'s meeting. Let\'s start with the agenda.',
        timestamp: new Date(),
        confidence: 0.95
      },
      {
        speaker: 'Participant 1',
        text: 'Great, I have a question about the project timeline.',
        timestamp: new Date(Date.now() - 30000),
        confidence: 0.92
      },
      {
        speaker: 'Host',
        text: 'Absolutely, let\'s discuss the timeline. We have the Q3 deliverables scheduled for next month.',
        timestamp: new Date(Date.now() - 60000),
        confidence: 0.94
      }
    ];

    const participants = [
      { id: 1, name: 'Host', email: 'host@company.com', role: 'host' },
      { id: 2, name: 'Participant 1', email: 'participant1@company.com', role: 'participant' },
      { id: 3, name: 'AI Notetaker', email: 'notetaker@ecouter.app', role: 'bot' }
    ];

    res.status(200).json({
      success: true,
      transcript,
      participants,
      currentSpeaker: 'Host',
      meetingDuration: Math.floor((Date.now() - meetingSession.startedAt.getTime()) / 1000),
      summary: {
        totalSpeakers: participants.length,
        totalWords: transcript.reduce((sum, item) => sum + item.text.split(' ').length, 0),
        keyTopics: ['project timeline', 'Q3 deliverables', 'meeting agenda']
      }
    });

  } catch (error) {
    console.error('Error fetching transcript:', error);
    res.status(500).json({ error: 'Failed to fetch transcript' });
  }
}
