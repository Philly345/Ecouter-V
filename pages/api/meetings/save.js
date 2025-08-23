// Save Meeting Notes API
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify user authentication
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    const meetingData = req.body;

    if (!meetingData.title || !meetingData.transcript) {
      return res.status(400).json({ error: 'Meeting title and transcript are required' });
    }

    console.log('💾 Saving meeting notes to database...');

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Prepare meeting document
    const meetingDocument = {
      userId: decoded.userId,
      userEmail: decoded.email,
      title: meetingData.title,
      transcript: meetingData.transcript,
      summary: meetingData.summary || '',
      actionItems: meetingData.actionItems || [],
      keyPoints: meetingData.keyPoints || [],
      speakers: meetingData.speakers || [],
      participants: meetingData.participants || [],
      duration: meetingData.duration || 0,
      startTime: meetingData.startTime ? new Date(meetingData.startTime) : new Date(),
      endTime: meetingData.endTime ? new Date(meetingData.endTime) : new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      type: 'zoom_meeting',
      status: 'completed'
    };

    // Insert into database
    const result = await db.collection('meetings').insertOne(meetingDocument);

    console.log('✅ Meeting notes saved successfully with ID:', result.insertedId);

    res.status(200).json({
      success: true,
      meetingId: result.insertedId,
      message: 'Meeting notes saved successfully'
    });

  } catch (error) {
    console.error('❌ Error saving meeting notes:', error);
    res.status(500).json({ 
      error: 'Failed to save meeting notes',
      details: error.message 
    });
  }
}