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

    const { message, transcript, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const { db } = await connectDB();

    // Get the latest active meeting session
    const meetingSession = await db.collection('meeting_sessions')
      .findOne({ 
        userId: new ObjectId(decoded.userId),
        status: 'recording' 
      }, 
      { sort: { startedAt: -1 } }
    );

    if (!meetingSession) {
      return res.status(404).json({ error: 'No active meeting found' });
    }

    // Process the AI chat message
    // This would integrate with your AI service (OpenAI, Anthropic, etc.)
    const aiResponse = await generateAIResponse(message, transcript, context);

    // Save the chat message to the meeting session
    await db.collection('meeting_sessions').updateOne(
      { _id: meetingSession._id },
      {
        $push: {
          aiChat: {
            message,
            response: aiResponse,
            sender: decoded.userId,
            timestamp: new Date()
          }
        }
      }
    );

    res.status(200).json({
      success: true,
      response: aiResponse,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('Error processing AI chat:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
}

async function generateAIResponse(message, transcript, context) {
  // This is a placeholder for AI integration
  // In production, this would call OpenAI, Anthropic, or your preferred AI service
  
  const prompts = [
    `Based on the meeting transcript, answer: ${message}`,
    `From the context of this meeting, ${message}`,
    `Looking at the current discussion: ${message}`,
  ];

  // Simulate AI responses based on common meeting scenarios
  const responses = [
    "Based on the current discussion, the key points are: project timeline discussion, Q3 deliverables, and resource allocation.",
    "From the transcript, it appears the team is focusing on the Q3 deliverables timeline. The main concerns seem to be around resource allocation and meeting the end-of-month deadline.",
    "Looking at the meeting flow, the discussion has centered on three main topics: timeline adjustments, resource requirements, and risk mitigation strategies.",
    "The meeting participants have been discussing the project scope, timeline feasibility, and potential roadblocks. The consensus seems to be forming around extending the timeline by 2 weeks.",
    "Based on the conversation so far, the team is aligning on prioritizing the core features for Q3 while deferring some enhancements to Q4."
  ];

  // Select response based on message content
  let response;
  if (message.toLowerCase().includes('summary') || message.toLowerCase().includes('recap')) {
    response = responses[0];
  } else if (message.toLowerCase().includes('timeline') || message.toLowerCase().includes('deadline')) {
    response = responses[1];
  } else if (message.toLowerCase().includes('priority') || message.toLowerCase().includes('focus')) {
    response = responses[2];
  } else if (message.toLowerCase().includes('decision') || message.toLowerCase().includes('consensus')) {
    response = responses[3];
  } else {
    response = responses[4];
  }

  return response;
}
