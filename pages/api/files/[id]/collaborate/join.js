import { connectToDatabase } from '../../../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const { token: collaborationToken } = req.body;

    if (!collaborationToken) {
      return res.status(400).json({ message: 'Collaboration token required' });
    }

    // Get the user's JWT token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Verify the collaboration JWT token
    let collaborationDecoded;
    try {
      collaborationDecoded = jwt.verify(collaborationToken, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid or expired invitation token' });
    }

    // Check if the token matches the file ID
    if (collaborationDecoded.fileId !== id) {
      return res.status(400).json({ message: 'Token does not match the requested file' });
    }

    const { db } = await connectToDatabase();

    // Get the file
    const file = await db.collection('files').findOne({
      _id: new ObjectId(id)
    });

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Find the collaboration invitation
    const collaboratorIndex = file.collaborators?.findIndex(c => c.token === collaborationToken);
    
    if (collaboratorIndex === -1) {
      return res.status(404).json({ message: 'Collaboration invitation not found' });
    }

    const collaborator = file.collaborators[collaboratorIndex];

    if (collaborator.status === 'accepted') {
      // Already accepted, just return success
      return res.status(200).json({ 
        message: 'Collaboration already joined',
        collaborator: {
          id: collaborator.id,
          email: collaborator.email,
          permission: collaborator.permission,
          status: 'accepted'
        }
      });
    }

    if (collaborator.status === 'rejected') {
      return res.status(400).json({ message: 'Invitation was previously rejected' });
    }

    // Check if the user's email matches the invitation email
    const currentUser = await db.collection('users').findOne({ _id: new ObjectId(decoded.userId) });
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Allow more flexible email matching for testing/development
    const invitedEmail = collaborationDecoded.email;
    const currentEmail = currentUser.email;
    
    // For development: allow if both emails belong to the same person (common email domains)
    const isDevelopment = process.env.NODE_ENV === 'development';
    const emailsMatch = currentEmail === invitedEmail;
    
    // Check if both emails might belong to the same person (same domain or similar pattern)
    const isSamePersonEmails = isDevelopment && (
      currentEmail.split('@')[1] === invitedEmail.split('@')[1] || // Same domain
      currentEmail.includes('philly') && invitedEmail.includes('philly') || // Similar pattern
      process.env.DISABLE_EMAIL_VERIFICATION === 'true' // Environment override
    );

    if (!emailsMatch && !isSamePersonEmails) {
      return res.status(403).json({ 
        message: `This invitation was sent to ${invitedEmail}. Please sign in with that email address.`,
        currentEmail,
        invitedEmail,
        suggestAction: 'signout_and_signin'
      });
    }

    // Get or create user record
    let user = await db.collection('users').findOne({ email: currentUser.email });
    
    if (!user) {
      // This shouldn't happen since we just found the user above, but just in case
      return res.status(404).json({ message: 'User record not found' });
    }

    // Update the collaborator status
    const updatedCollaborator = {
      ...collaborator,
      status: 'accepted',
      userId: user._id.toString(),
      acceptedAt: new Date(),
      // Remove the token for security
      token: undefined
    };

    // Update the file with the accepted collaboration
    await db.collection('files').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          [`collaborators.${collaboratorIndex}`]: updatedCollaborator,
          updatedAt: new Date()
        }
      }
    );

    // Add a log entry for the collaboration join
    await db.collection('files').updateOne(
      { _id: new ObjectId(id) },
      {
        $push: {
          activityLog: {
            id: new ObjectId().toString(),
            type: 'collaboration_joined',
            userId: user._id.toString(),
            userName: user.name,
            timestamp: new Date(),
            details: {
              permission: collaborationDecoded.permission,
              invitedBy: collaborationDecoded.invitedBy
            }
          }
        }
      }
    );

    // Return success response
    res.status(200).json({
      message: 'Successfully joined collaboration',
      collaborator: {
        id: updatedCollaborator.id,
        email: updatedCollaborator.email,
        permission: updatedCollaborator.permission,
        status: 'accepted',
        userId: user._id.toString(),
        userName: user.name
      },
      file: {
        id: file._id.toString(),
        name: file.originalName,
        ownerId: file.userId
      }
    });

  } catch (error) {
    console.error('Collaboration join error:', error);
    res.status(500).json({ message: 'Failed to join collaboration' });
  }
}