import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { connectDB } from '../../lib/mongodb.js';
import { ObjectId } from 'mongodb';
import { verifyTokenString, getTokenFromRequest } from '../../utils/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const token = getTokenFromRequest(req);
    const decoded = verifyTokenString(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user ID from token
    const userId = decoded.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Invalid token - missing user ID' });
    }

    const { fileId } = req.query;
    
    if (!fileId) {
      return res.status(400).json({ error: 'File ID required' });
    }

    // Find file in MongoDB
    const { db } = await connectDB();
    const file = await db.collection('files').findOne({ 
      _id: new ObjectId(fileId),
      userId: userId
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Return file status
    res.status(200).json({
      success: true,
      file: {
        id: file._id,
        name: file.name,
        status: file.status,
        transcript: file.transcript || null,
        summary: file.summary || null,
        topic: file.topic || null,
        topics: file.topics || [],
        insights: file.insights || null,
        speakers: file.speakers || [],
        duration: file.duration || null,
        wordCount: file.wordCount || 0,
        language: file.language || 'en',
        createdAt: file.createdAt,
        updatedAt: file.updatedAt,
        error: file.error || null
      }
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ 
      error: 'Failed to check transcription status',
      details: error.message 
    });
  }
}