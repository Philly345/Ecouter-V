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

    console.log(`👤 Live Transcription List - User ID: ${user.userId}`);

    // Connect to MongoDB
    const { db } = await connectDB();

    // Get query parameters
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query
    const query = { userId: new ObjectId(user.userId) };
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    // Get sessions with pagination
    const sessions = await db.collection('liveTranscriptions')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .toArray();

    // Get total count
    const total = await db.collection('liveTranscriptions').countDocuments(query);

    // Format sessions for response
    const formattedSessions = sessions.map(session => ({
      id: session._id,
      title: session.title,
      duration: session.duration,
      transcriptCount: session.transcripts ? session.transcripts.length : 0,
      speakers: session.speakers || [],
      audioUrl: session.audioUrl,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    }));

    res.status(200).json({
      sessions: formattedSessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('❌ Live transcription list error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch live transcription sessions',
      details: error.message 
    });
  }
}