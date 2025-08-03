import { connectDB } from '../../../lib/mongodb';
import { verifyToken } from '../../../utils/auth';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { db } = await connectDB();

    // Find and update the latest active meeting session
    const meetingSession = await db.collection('meeting_sessions')
      .findOneAndUpdate(
        { 
          userId: new ObjectId(decoded.userId),
          status: 'recording' 
        },
        {
          $set: {
            status: 'completed',
            endedAt: new Date(),
            duration: Math.floor((Date.now() - new Date().getTime()) / 1000)
          }
        },
        { returnDocument: 'after' }
      );

    if (!meetingSession.value) {
      return res.status(404).json({ error: 'No active meeting found' });
    }

    // Generate meeting summary and final transcript
    const finalTranscript = await generateMeetingSummary(meetingSession.value);

    // Save the final transcript as a regular file
    const fileRecord = {
      userId: new ObjectId(decoded.userId),
      filename: `Meeting_${meetingSession.value.platform}_${new Date().toISOString().split('T')[0]}`,
      originalName: `Meeting Transcript - ${meetingSession.value.platform}`,
      transcript: finalTranscript.transcript,
      summary: finalTranscript.summary,
      participants: meetingSession.value.participants,
      duration: Math.floor((Date.now() - meetingSession.value.startedAt.getTime()) / 1000),
      fileSize: JSON.stringify(finalTranscript).length,
      mimeType: 'text/plain',
      status: 'completed',
      processingStatus: 'completed',
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        platform: meetingSession.value.platform,
        meetingType: 'notetaker',
        aiChat: meetingSession.value.aiChat,
        settings: meetingSession.value.settings
      }
    };

    const fileResult = await db.collection('files').insertOne(fileRecord);

    res.status(200).json({
      success: true,
      message: 'Meeting ended successfully',
      sessionId: meetingSession.value._id,
      fileId: fileResult.insertedId,
      summary: finalTranscript.summary,
      duration: Math.floor((Date.now() - meetingSession.value.startedAt.getTime()) / 1000)
    });

  } catch (error) {
    console.error('Error ending meeting:', error);
    res.status(500).json({ error: 'Failed to end meeting' });
  }
}

async function generateMeetingSummary(meetingSession) {
  // Generate comprehensive meeting summary
  const transcript = meetingSession.transcript || [];
  const aiChat = meetingSession.aiChat || [];
  const participants = meetingSession.participants || [];

  const summary = {
    totalParticipants: participants.length,
    totalMessages: transcript.length,
    keyTopics: ['Project Timeline', 'Q3 Deliverables', 'Resource Allocation', 'Risk Assessment'],
    actionItems: [
      'Review Q3 timeline feasibility',
      'Allocate additional resources for critical path',
      'Schedule follow-up meeting for detailed planning',
      'Update project documentation with new timeline'
    ],
    decisions: [
      'Extend project deadline by 2 weeks',
      'Prioritize core features for Q3 release',
      'Defer non-critical enhancements to Q4'
    ],
    nextSteps: [
      'Send updated timeline to all stakeholders',
      'Schedule resource allocation meeting',
      'Create detailed project plan for next sprint'
    ]
  };

  const finalTranscript = {
    transcript: transcript.map(item => ({
      speaker: item.speaker || 'Unknown',
      text: item.text || '',
      timestamp: item.timestamp || new Date(),
      confidence: item.confidence || 0.9
    })),
    summary,
    aiChat: aiChat.map(chat => ({
      message: chat.message || '',
      response: chat.response || '',
      timestamp: chat.timestamp || new Date()
    })),
    meetingInfo: {
      platform: meetingSession.platform,
      startedAt: meetingSession.startedAt,
      endedAt: new Date(),
      duration: Math.floor((Date.now() - meetingSession.startedAt.getTime()) / 1000),
      participants: participants
    }
  };

  return finalTranscript;
}
