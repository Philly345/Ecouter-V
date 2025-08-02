import { verifyToken, getTokenFromRequest } from '../../../../utils/auth.js';
import { connectDB } from '../../../../lib/mongodb.js';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const token = getTokenFromRequest(req);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.query;
    const { transcript } = req.body;

    if (!transcript) {
      return res.status(400).json({ message: 'Transcript content is required' });
    }

    // Find user in MongoDB
    const { db } = await connectDB();
    const user = await db.collection('users').findOne({ email: decoded.email });
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Find the file and verify ownership
    const file = await db.collection('files').findOne({ 
      _id: new ObjectId(id)
    });

    const userId = user.id || user._id.toString();
    if (!file || file.userId !== userId) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Update the transcript
    const result = await db.collection('files').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          transcript: transcript,
          updatedAt: new Date()
        }
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(400).json({ message: 'Failed to update transcript' });
    }

    res.status(200).json({ 
      message: 'Transcript updated successfully',
      success: true 
    });

  } catch (error) {
    console.error('Edit transcript error:', error);
    
    if (error.message?.includes('token') || error.message?.includes('auth')) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
