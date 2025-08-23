// Meeting Summary Generation API
import jwt from 'jsonwebtoken';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

    const { transcript, participants, duration, meetingTitle } = req.body;

    if (!transcript || !transcript.trim()) {
      return res.status(400).json({ error: 'Meeting transcript is required' });
    }

    console.log('🤖 Generating meeting summary with Gemini...');

    // Generate summary using Gemini AI
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
Please analyze this meeting transcript and provide a comprehensive summary with the following sections:

**Meeting Information:**
- Title: ${meetingTitle || 'Meeting'}
- Duration: ${Math.floor(duration / 60)} minutes
- Participants: ${participants?.join(', ') || 'Multiple participants'}

**Meeting Transcript:**
${transcript}

Please provide:

1. **EXECUTIVE SUMMARY** (2-3 sentences): Brief overview of the main purpose and outcomes of the meeting.

2. **KEY DISCUSSION POINTS** (bullet points): List the main topics discussed, decisions made, and important information shared.

3. **ACTION ITEMS** (specific, actionable items): Extract any tasks, assignments, or follow-up items mentioned, including who is responsible if specified.

4. **DECISIONS MADE**: List any concrete decisions or agreements reached during the meeting.

5. **NEXT STEPS**: Outline any planned follow-up meetings, deadlines, or future actions.

6. **PARTICIPANT INSIGHTS**: Identify the main contributors and their key points or concerns.

Format your response as JSON with the following structure:
{
  "summary": "Executive summary here",
  "keyPoints": ["Point 1", "Point 2", ...],
  "actionItems": ["Action 1", "Action 2", ...],
  "decisions": ["Decision 1", "Decision 2", ...],
  "nextSteps": ["Step 1", "Step 2", ...],
  "participantInsights": [
    {"participant": "Name", "contribution": "Main points"},
    ...
  ]
}

Focus on extracting concrete, actionable information. If certain sections don't apply, provide empty arrays.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('✅ Summary generated successfully');

    // Try to parse the JSON response
    let summaryData;
    try {
      // Extract JSON from the response (remove any markdown formatting)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        summaryData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.warn('⚠️ Failed to parse JSON response, creating manual structure');
      
      // Fallback: create a simple summary structure
      summaryData = {
        summary: text.substring(0, 500) + '...',
        keyPoints: extractBulletPoints(text),
        actionItems: extractActionItems(text),
        decisions: [],
        nextSteps: [],
        participantInsights: []
      };
    }

    res.status(200).json({
      success: true,
      summary: summaryData.summary,
      keyPoints: summaryData.keyPoints || [],
      actionItems: summaryData.actionItems || [],
      decisions: summaryData.decisions || [],
      nextSteps: summaryData.nextSteps || [],
      participantInsights: summaryData.participantInsights || [],
      rawResponse: text
    });

  } catch (error) {
    console.error('❌ Error generating summary:', error);
    res.status(500).json({ 
      error: 'Failed to generate meeting summary',
      details: error.message 
    });
  }
}

function extractBulletPoints(text) {
  const bullets = [];
  const lines = text.split('\\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.match(/^\\d+\\./)) {
      bullets.push(trimmed.replace(/^[•\\-\\d\\.\\s]+/, ''));
    }
  }
  
  return bullets.slice(0, 10); // Limit to 10 points
}

function extractActionItems(text) {
  const actions = [];
  const actionKeywords = ['action', 'todo', 'task', 'follow up', 'will', 'should', 'need to', 'must'];
  const lines = text.split('\\n');
  
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (actionKeywords.some(keyword => lower.includes(keyword))) {
      const trimmed = line.trim();
      if (trimmed.length > 10 && trimmed.length < 200) {
        actions.push(trimmed);
      }
    }
  }
  
  return actions.slice(0, 8); // Limit to 8 action items
}