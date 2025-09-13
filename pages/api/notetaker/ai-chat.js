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
    // ⚠️ Using OpenAI gpt-oss-20b:free model only to avoid charges
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
  try {
    // Create a truncated transcript for the context window
    const maxTranscriptLength = 8000;
    const truncatedTranscript = transcript?.length > maxTranscriptLength 
      ? transcript.substring(0, maxTranscriptLength) + "... [transcript truncated]" 
      : transcript || "No transcript available";

    // Build the chat prompt
    const chatPrompt = `You are an AI assistant helping with meeting analysis and note-taking.

${transcript ? `MEETING TRANSCRIPT:\n${truncatedTranscript}\n\n` : ''}
${context ? `ADDITIONAL CONTEXT:\n${context}\n\n` : ''}

INSTRUCTIONS:
- Answer questions about the meeting content accurately
- Provide summaries when requested
- Help identify action items and key decisions
- Be concise and helpful
- Reference specific parts of the meeting when relevant

User Question: ${message}

Answer:`;

    // 🎯 PRIORITY ORDER: Gemini → OpenAI (free)
    try {
      console.log('🚀 Trying Gemini first for AI chat...');
      return await generateWithGemini(chatPrompt);
    } catch (geminiError) {
      console.log('⚠️ Gemini failed, falling back to OpenAI:', geminiError.message);
      return await generateWithOpenAI(chatPrompt);
    }

  } catch (error) {
    console.error('AI response generation error:', error);
    
    // Fallback responses based on message content
    if (message.toLowerCase().includes('summary') || message.toLowerCase().includes('recap')) {
      return "I'm currently unable to generate an AI summary. Please check the meeting transcript manually for key points and decisions.";
    } else if (message.toLowerCase().includes('action') || message.toLowerCase().includes('todo')) {
      return "I'm currently unable to identify action items. Please review the transcript for any mentioned tasks or follow-ups.";
    } else if (message.toLowerCase().includes('decision') || message.toLowerCase().includes('conclusion')) {
      return "I'm currently unable to analyze decisions. Please review the transcript for any concluded discussions or agreements.";
    } else {
      return "I'm currently unable to process your request. Please try again later or review the transcript directly.";
    }
  }
}

async function generateWithGemini(chatPrompt) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        contents: [{ parts: [{ text: chatPrompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  if (!generatedText) {
    throw new Error('Empty response from Gemini');
  }
  
  console.log('✅ Gemini chat response generated successfully');
  return generatedText.replace(/^Answer:/, '').trim();
}

async function generateWithOpenAI(chatPrompt) {
  // Check if OpenAI API key is available
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  // ⚠️ WARNING: Using openai/gpt-oss-20b:free model only - changing this model could incur charges!
  // This is the ONLY free OpenAI model available through OpenRouter
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'HTTP-Referer': 'https://ecouter.systems',
      'X-Title': 'Ecouter Meeting Assistant'
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-20b:free", // ⚠️ FREE MODEL ONLY - DO NOT CHANGE
      messages: [{ role: "user", content: chatPrompt }],
      temperature: 0.7,
      max_tokens: 1024
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenAI API error:", response.status, errorText);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const generatedText = data.choices?.[0]?.message?.content || "";
  
  if (!generatedText) {
    throw new Error("No response generated from OpenAI");
  }

  // Clean up the response
  return generatedText.replace(/^Answer:/, '').trim();
}
