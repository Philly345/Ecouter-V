import { connectToDatabase } from '../../../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  try {
    const { id } = req.query;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const dbConnection = await connectToDatabase();
    if (!dbConnection || !dbConnection.db) {
      return res.status(500).json({ message: 'Database connection failed' });
    }
    
    const { db } = dbConnection;

    // Get file with collaborators
    const file = await db.collection('files').findOne({
      _id: new ObjectId(id),
      $or: [
        { userId: decoded.userId },
        { 'collaborators.email': decoded.email, 'collaborators.status': 'active' }
      ]
    });

    if (!file) {
      return res.status(404).json({ message: 'File not found or access denied' });
    }

    // Get user permission level
    const isOwner = file.userId === decoded.userId;
    const collaborator = file.collaborators?.find(c => c.email === decoded.email && c.status === 'active');
    const permission = isOwner ? 'owner' : collaborator?.permission || null;

    if (!permission) {
      return res.status(403).json({ message: 'No collaboration access' });
    }

    // Get active collaborators (including user info)
    const activeCollaborators = file.collaborators?.filter(c => c.status === 'active') || [];
    const userIds = [file.userId, ...activeCollaborators.map(c => c.userId)].filter(Boolean);
    
    const users = await db.collection('users').find({
      _id: { $in: userIds.map(id => new ObjectId(id)) }
    }).toArray();

    const usersMap = users.reduce((acc, user) => {
      acc[user._id.toString()] = user;
      return acc;
    }, {});

    // Format collaborators with user info
    const collaboratorsWithInfo = activeCollaborators.map(c => {
      const user = usersMap[c.userId];
      return {
        id: c.id,
        email: c.email,
        permission: c.permission,
        status: c.status,
        name: user?.name || c.email.split('@')[0],
        avatar: user?.avatar || null,
        lastActive: c.lastActive || new Date(),
        isOnline: c.isOnline || false
      };
    });

    // Add owner info
    const owner = usersMap[file.userId];
    if (owner && !collaboratorsWithInfo.find(c => c.email === owner.email)) {
      collaboratorsWithInfo.unshift({
        id: 'owner',
        email: owner.email,
        permission: 'owner',
        status: 'active',
        name: owner.name || owner.email.split('@')[0],
        avatar: owner.avatar || null,
        lastActive: new Date(),
        isOnline: true // Assume owner is online if they're requesting
      });
    }

    res.status(200).json({
      collaborators: collaboratorsWithInfo,
      userPermission: permission,
      isOwner,
      canInvite: permission === 'owner' || permission === 'edit'
    });

  } catch (error) {
    console.error('Get collaborators error:', error);
    res.status(500).json({ message: 'Failed to get collaborators' });
  }
}