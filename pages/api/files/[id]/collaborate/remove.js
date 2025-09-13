import { connectToDatabase } from '../../../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const { collaboratorId } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { db } = await connectToDatabase();

    // Verify user has permission to remove collaborators (owner only)
    const file = await db.collection('files').findOne({
      _id: new ObjectId(id),
      userId: decoded.userId
    });

    if (!file) {
      return res.status(404).json({ message: 'File not found or access denied' });
    }

    // Remove collaborator
    const result = await db.collection('files').updateOne(
      { _id: new ObjectId(id) },
      { 
        $pull: { collaborators: { id: collaboratorId } },
        $set: { updatedAt: new Date() }
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'Collaborator not found' });
    }

    res.status(200).json({ message: 'Collaborator removed successfully' });

  } catch (error) {
    console.error('Remove collaborator error:', error);
    res.status(500).json({ message: 'Failed to remove collaborator' });
  }
}