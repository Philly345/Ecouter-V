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

    // Generate AI response
    try {
      // Verify API key is available
      if (!process.env.GEMINI_API_KEY) {
        console.error('GEMINI_API_KEY is not defined in environment variables');
        return res.status(500).json({ 
          error: 'API key configuration is missing',
          details: 'Please check your .env.local file and ensure GEMINI_API_KEY is set'
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
    
    // Updated payload format for Gemini API to match working TypeScript code
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          contents: [{ 
            parts: [{ 
              text: chatPrompt 
            }] 
          }]
        })
      }
    );

    // Process the response
    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API error:", geminiResponse.status, geminiResponse.statusText);
      console.error("Error response:", errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    // Parse the response
    const geminiData = await geminiResponse.json();
    console.log("Gemini API response received");
    
    // Extract the generated text using the correct response structure
    const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    if (!generatedText) {
      console.error("No text in Gemini response");
      return "I'm sorry, I couldn't generate a response. Please try asking something else about this audio file.";
    }
    
    // Clean up the response text
    let responseText = generatedText.replace(/^Answer:/, '').trim();
    
    // Add some validation to make sure we have a good response
    if (responseText.length < 5) {
      console.error("Response too short:", responseText);
      return "I received an incomplete response. Please try asking your question again.";
    }
    
    return responseText;
  } catch (error) {
    console.error('Chat generation error:', error);
    
    // Provide more specific error messages
    if (error.message && error.message.includes('API key')) {
      return "There's an issue with the API configuration. Please contact support.";
    }
    
    if (error.message && error.message.includes('400')) {
      return "I couldn't process your question. Please try rephrasing it.";
    }
    
    return "I'm sorry, I couldn't process your question properly. Please try asking something else about the audio.";
  }
}