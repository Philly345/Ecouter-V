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
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decoded.userId;

    // Get list of PDF dialogues for the user
    const { db } = await connectDB();
    const dialogues = await db.collection('pdf_dialogues')
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    res.status(200).json({
      dialogues: dialogues.map(d => ({
        id: d._id,
        filename: d.filename,
        mode: d.mode,
        audioUrl: d.audioUrl,
        createdAt: d.createdAt,
        script: d.script ? d.script.substring(0, 200) + '...' : null
      }))
    });

  } catch (error) {
    console.error('❌ List PDF dialogues error:', error);
    res.status(500).json({ 
      error: 'Failed to list dialogues', 
      details: error.message 
    });
  }
}