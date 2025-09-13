import { connectToDatabase } from '../../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const { changes, description } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { db } = await connectToDatabase();

    // Verify user has edit access
    const file = await db.collection('files').findOne({
      _id: new ObjectId(id),
      $or: [
        { userId: decoded.userId },
        { 'collaborators.email': decoded.email, 'collaborators.permission': { $in: ['edit', 'owner'] }, 'collaborators.status': 'active' }
      ]
    });

    if (!file) {
      return res.status(404).json({ message: 'File not found or edit access denied' });
    }

    // Get user info
    const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.userId) });

    // Create version entry
    const version = {
      id: new ObjectId().toString(),
      version: (file.versions?.length || 0) + 1,
      changes,
      description: description || 'Transcript updated',
      author: {
        id: decoded.userId,
        email: user?.email || decoded.email,
        name: user?.name || user?.email?.split('@')[0] || 'Anonymous'
      },
      timestamp: new Date(),
      contentSnapshot: file.content // Store current content before changes
    };

    // Apply changes to file content
    let updatedContent = file.content;
    if (changes && Array.isArray(changes)) {
      // Apply changes in reverse order to maintain positions
      const sortedChanges = changes.sort((a, b) => b.position - a.position);
      
      for (const change of sortedChanges) {
        switch (change.type) {
          case 'insert':
            updatedContent = updatedContent.slice(0, change.position) + 
                           change.text + 
                           updatedContent.slice(change.position);
            break;
          case 'delete':
            updatedContent = updatedContent.slice(0, change.position) + 
                           updatedContent.slice(change.position + change.length);
            break;
          case 'replace':
            updatedContent = updatedContent.slice(0, change.position) + 
                           change.text + 
                           updatedContent.slice(change.position + change.length);
            break;
        }
      }
    }

    // Update file with new content and version
    await db.collection('files').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          content: updatedContent,
          updatedAt: new Date(),
          lastEditedBy: decoded.userId
        },
        $push: { versions: version }
      }
    );

    res.status(200).json({
      message: 'File updated successfully',
      version: version.version,
      versionId: version.id,
      content: updatedContent
    });

  } catch (error) {
    console.error('Update file error:', error);
    res.status(500).json({ message: 'Failed to update file' });
  }
}