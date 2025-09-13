import { connectToDatabase } from '../../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Connect to database with error handling
    let dbConnection;
    try {
      dbConnection = await connectToDatabase();
    } catch (error) {
      console.error('Database connection error:', error);
      return res.status(500).json({ message: 'Database connection failed' });
    }

    if (!dbConnection || !dbConnection.db) {
      console.error('Database connection returned null');
      return res.status(500).json({ message: 'Database not available' });
    }

    const { db } = dbConnection;

    // Verify user has access to view versions
    const file = await db.collection('files').findOne({
      _id: new ObjectId(id)
    });

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check if user has access (owner or collaborator)
    const hasAccess = file.userId === decoded.userId || 
      file.collaborators?.some(c => 
        c.userId === decoded.userId && 
        c.status === 'accepted'
      );

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const versions = file.versions || [];

    // If no versions exist, create a basic response
    if (versions.length === 0) {
      const defaultVersion = {
        id: '1',
        version: 1,
        timestamp: file.updatedAt || file.createdAt || new Date(),
        author: 'System',
        changes: 'Initial version',
        isCurrent: true
      };

      return res.status(200).json({
        versions: [defaultVersion],
        currentVersion: 1,
        totalVersions: 1
      });
    }

    res.status(200).json({
      versions: versions.sort((a, b) => b.version - a.version),
      currentVersion: versions.length > 0 ? Math.max(...versions.map(v => v.version)) : 1,
      totalVersions: versions.length
    });

  } catch (error) {
    console.error('Get versions error:', error);
    res.status(500).json({ message: 'Failed to get versions' });
  }
}