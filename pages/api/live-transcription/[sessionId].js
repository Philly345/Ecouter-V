import { verifyToken } from '../../../utils/auth';
import { connectDB } from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const user = await verifyToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    if (!ObjectId.isValid(sessionId)) {
      return res.status(400).json({ error: 'Invalid session ID' });
    }

    console.log(`👤 Live Transcription Get - User ID: ${user.userId}, Session ID: ${sessionId}`);

    // Connect to MongoDB
    const { db } = await connectDB();

    // Get session
    const session = await db.collection('liveTranscriptions').findOne({
      _id: new ObjectId(sessionId),
      userId: new ObjectId(user.userId)
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Format session for response
    const formattedSession = {
      id: session._id,
      title: session.title,
      duration: session.duration,
      transcripts: session.transcripts || [],
      speakers: session.speakers || [],
      audioUrl: session.audioUrl,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    };

    res.status(200).json(formattedSession);

  } catch (error) {
    console.error('❌ Live transcription get error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch live transcription session',
      details: error.message 
    });
  }
}