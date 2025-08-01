import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the authorization token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { message, transcript, fileName, context } = req.body;

    if (!message || !transcript) {
      return res.status(400).json({ error: 'Message and transcript are required' });
    }

    // Initialize Gemini AI
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY not found in environment variables');
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Use Gemini 1.5 Flash for better quota efficiency
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024,
      },
    });

    // Create optimized context-aware prompt
    // Truncate transcript if too long to avoid token limits
    const maxTranscriptLength = 8000; // Adjust based on token limits
    const truncatedTranscript = transcript.length > maxTranscriptLength 
      ? transcript.substring(0, maxTranscriptLength) + '\n\n[Transcript truncated for length]'
      : transcript;

    const prompt = `You are an intelligent AI assistant that can both analyze audio transcripts and provide general knowledge. You have access to a transcript and can answer questions about it, but you can also provide general information, research, and knowledge on any topic.

Available Context:
File: ${fileName || 'Audio transcript'}

Transcript Content:
${truncatedTranscript}

User Question: ${message}

Instructions:
1. If the question is about the transcript content, analyze and respond based on the transcript
2. If the question is general knowledge (like "Who is Albert Einstein?"), provide informative general information
3. If the question relates to both (e.g., asking about a person mentioned in the transcript), provide both transcript context AND general information
4. Be helpful, accurate, and comprehensive in your responses
5. Always clarify whether your information comes from the transcript, general knowledge, or both

Provide a helpful and informative response:`;

    // Generate response using Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({
      response: text,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Gemini API error:', error);
    
    // Handle specific error types
    if (error.message?.includes('API key')) {
      return res.status(401).json({ error: 'Invalid API key configuration' });
    } else if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('Too Many Requests')) {
      return res.status(429).json({ 
        error: 'API quota exceeded. Please try again later or upgrade your Gemini API plan.',
        retryAfter: error.errorDetails?.[2]?.retryDelay || '60s'
      });
    } else if (error.message?.includes('safety')) {
      return res.status(400).json({ error: 'Content filtered by safety settings. Please rephrase your question.' });
    } else if (error.status === 400) {
      return res.status(400).json({ error: 'Invalid request. Please check your input and try again.' });
    } else if (error.status === 503) {
      return res.status(503).json({ error: 'Service temporarily unavailable. Please try again in a few moments.' });
    }
    
    return res.status(500).json({ 
      error: 'Failed to generate response. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
