import { filesDB, usersDB } from '../../../utils/database.js';
import { verifyToken, getTokenFromRequest } from '../../../utils/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const token = getTokenFromRequest(req);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = usersDB.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const { fileId, message, conversation, transcript } = req.body;
    
    if (!fileId || !message) {
      return res.status(400).json({ error: 'File ID and message are required' });
    }

    // Get the file
    const file = filesDB.findById(fileId);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    if (file.userId !== user.id) {
      return res.status(403).json({ error: 'Not authorized to access this file' });
    }
    
    // If transcript wasn't provided in the request body, get it from the file
    const fileTranscript = transcript || file.transcript;
    if (!fileTranscript) {
      return res.status(400).json({ error: 'File has no transcript to chat about' });
    }

      // Generate AI response with smart fallback
      try {
        // Verify at least one API key is available
        if (!process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
          console.error('No AI API keys configured');
          return res.status(500).json({ 
            error: 'AI service configuration is missing',
            details: 'Please check your .env.local file and ensure OPENAI_API_KEY or GEMINI_API_KEY is set'
          });
        }
      
      // Log some info about the request
      console.log(`Processing chat request for file ${file.id}, message length: ${message.length}`);
      console.log(`Conversation history has ${conversation ? conversation.length : 0} messages`);
      
      const aiReply = await generateChatResponse(fileTranscript, message, conversation);
      
      // Log successful response
      console.log(`Successfully generated AI reply of length: ${aiReply.length}`);
      
      return res.status(200).json({
        success: true,
        reply: aiReply
      });
    } catch (err) {
      console.error(`Error processing chat for file ${file.id}:`, err);
      
      // Send a detailed error message in development, simplified in production
      const isProduction = process.env.NODE_ENV === 'production';
      const errorMessage = isProduction 
        ? 'Failed to generate AI response' 
        : `Error: ${err.message || 'Unknown error'}`;
        
      // Add stack trace in development
      if (!isProduction) {
        console.error('Stack trace:', err.stack);
      }
      
      return res.status(500).json({ 
        error: errorMessage,
        details: isProduction ? undefined : String(err)
      });
    }

  } catch (error) {
    console.error('Error in audio chat:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function generateChatResponse(transcript, userMessage, conversation) {
  try {
    // Create a truncated transcript for the context window
    const maxTranscriptLength = 12000;
    const truncatedTranscript = transcript.length > maxTranscriptLength 
      ? transcript.substring(0, maxTranscriptLength) + "... [transcript truncated for length]" 
      : transcript;
      
    console.log("Transcript length:", transcript.length, "Truncated length:", truncatedTranscript.length);

    // First, organize conversation history
    const messageHistory = [];
    if (conversation && conversation.length > 0) {
      conversation.forEach(msg => {
        if (msg.role !== 'system') {
          messageHistory.push(`${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`);
        }
      });
    }
    
    const conversationContext = messageHistory.length > 0 
      ? `\n\nPrevious conversation:\n${messageHistory.join('\n')}` 
      : '';
    
    const chatPrompt = `You are a helpful AI assistant analyzing an audio transcript. Answer the user's question based on the transcript content.

TRANSCRIPT:
"""
${truncatedTranscript}
"""

INSTRUCTIONS:
- Answer questions about the transcript content accurately
- If asked about topics not in the transcript, provide general knowledge
- Be concise and helpful
- Reference specific parts of the transcript when relevant${conversationContext}

User Question: ${userMessage}

Answer:`;

    // 🎯 SMART AI FALLBACK SYSTEM: OpenAI (free) → Gemini → DeepSeek
    try {
      console.log('🚀 Chat: Trying OpenAI first (free model)...');
      return await generateChatWithOpenAI(chatPrompt);
    } catch (openaiError) {
      console.log('⚠️ Chat: OpenAI failed, falling back to Gemini:', openaiError.message);
      try {
        return await generateChatWithGemini(chatPrompt);
      } catch (geminiError) {
        console.log('⚠️ Chat: Gemini failed, using fallback response:', geminiError.message);
        return "I'm sorry, I couldn't generate a response due to AI service issues. Please try asking something else about this audio file.";
      }
    }

  } catch (error) {
    console.error('Chat generation error:', error);
    return "I'm sorry, I couldn't process your question properly. Please try asking something else about the audio.";
  }
}

async function generateChatWithOpenAI(chatPrompt) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  // ⚠️ WARNING: Using openai/gpt-oss-20b:free model only - changing this model could incur charges!
  const response = await fetch(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "HTTP-Referer": "https://ecouter.systems",
        "X-Title": "Ecouter Chat System"
      },
      body: JSON.stringify({ 
        model: "openai/gpt-oss-20b:free", // ⚠️ FREE MODEL ONLY - DO NOT CHANGE
        messages: [{ role: "user", content: chatPrompt }],
        temperature: 0.7,
        max_tokens: 1024
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const generatedText = data.choices?.[0]?.message?.content || '';
  
  if (!generatedText) {
    throw new Error('Empty response from OpenAI');
  }

  console.log('✅ Chat: OpenAI succeeded');
  return generatedText.replace(/^Answer:/, '').trim();
}

async function generateChatWithGemini(chatPrompt) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        contents: [{ parts: [{ text: chatPrompt }] }]
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

  console.log('✅ Chat: Gemini fallback succeeded');
  return generatedText.replace(/^Answer:/, '').trim();
}