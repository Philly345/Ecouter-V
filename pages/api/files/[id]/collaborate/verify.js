import { connectToDatabase } from '../../../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Collaboration token required' });
    }

    // Verify the JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid or expired invitation token' });
    }

    // Check if the token matches the file ID
    if (decoded.fileId !== id) {
      return res.status(400).json({ message: 'Token does not match the requested file' });
    }

    const { db } = await connectToDatabase();

    // Get file information
    const file = await db.collection('files').findOne({
      _id: new ObjectId(id)
    });

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Find the collaboration invitation
    const collaborator = file.collaborators?.find(c => c.token === token);
    
    if (!collaborator) {
      return res.status(404).json({ message: 'Collaboration invitation not found' });
    }

    if (collaborator.status === 'accepted') {
      return res.status(400).json({ message: 'Invitation already accepted' });
    }

    if (collaborator.status === 'rejected') {
      return res.status(400).json({ message: 'Invitation was previously rejected' });
    }

    // Get inviter information
    const inviter = await db.collection('users').findOne({
      _id: new ObjectId(decoded.invitedBy)
    });

    // Return collaboration details
    res.status(200).json({
      fileName: file.originalName,
      permission: decoded.permission,
      inviterName: inviter?.name || inviter?.email || 'Someone',
      inviterEmail: inviter?.email,
      collaboratorEmail: decoded.email,
      invitedAt: collaborator.invitedAt,
      expiresAt: new Date(decoded.exp * 1000), // Convert JWT exp to Date
      fileId: id,
      valid: true
    });

  } catch (error) {
    console.error('Collaboration verification error:', error);
    res.status(500).json({ message: 'Failed to verify collaboration invitation' });
  }
}