import { verifyToken } from '../../../../utils/auth';
import { connectDB } from '../../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const user = await verifyToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { sessionId } = req.query;
    const { transcripts } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    if (!ObjectId.isValid(sessionId)) {
      return res.status(400).json({ error: 'Invalid session ID' });
    }

    if (!transcripts || !Array.isArray(transcripts)) {
      return res.status(400).json({ error: 'Valid transcripts array is required' });
    }

    console.log(`👤 Live Transcription Update - User ID: ${user.userId}, Session ID: ${sessionId}`);

    // Connect to MongoDB
    const { db } = await connectDB();

    // Verify the session belongs to the user
    const existingSession = await db.collection('liveTranscriptions').findOne({
      _id: new ObjectId(sessionId),
      userId: new ObjectId(user.userId)
    });

    if (!existingSession) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Update the session with new transcripts
    const result = await db.collection('liveTranscriptions').updateOne(
      {
        _id: new ObjectId(sessionId),
        userId: new ObjectId(user.userId)
      },
      {
        $set: {
          transcripts: transcripts,
          updatedAt: new Date()
        }
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({ error: 'Failed to update transcript' });
    }

    console.log(`✅ Transcript updated successfully for session: ${sessionId}`);

    res.status(200).json({
      success: true,
      message: 'Transcript updated successfully'
    });

  } catch (error) {
    console.error('❌ Live transcription update error:', error);
    res.status(500).json({ 
      error: 'Failed to update transcript',
      details: error.message 
    });
  }
}