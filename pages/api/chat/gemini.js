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

    // Initialize OpenRouter API key
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENROUTER_API_KEY not found in environment variables');
      return res.status(500).json({ error: 'OpenRouter API key not configured' });
    }

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

    // ⚠️ WARNING: Using openai/gpt-oss-20b:free model only - changing this model could incur charges!
    // Generate response using OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://ecouter.systems',
        'X-Title': 'Ecouter Chat Assistant'
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b:free", // ⚠️ FREE MODEL ONLY - DO NOT CHANGE
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', response.status, response.statusText);
      console.error('Error response:', errorText);
      
      // If it's an authentication error, provide a helpful fallback response
      if (response.status === 401) {
        // Create an intelligent fallback response based on the user's question
        const questionLower = message.toLowerCase();
        let fallbackResponse = `**AI Service Temporarily Unavailable**\n\nI'm sorry, but I can't access the AI service right now due to an authentication issue. However, I can still help you with your transcript!\n\n`;
        
        // Provide context-aware responses based on common question types
        if (questionLower.includes('summary') || questionLower.includes('summarize')) {
          const wordCount = transcript.split(' ').length;
          const estimatedReadTime = Math.ceil(wordCount / 200);
          fallbackResponse += `**Quick Summary Analysis:**\n- Your transcript contains ${wordCount} words\n- Estimated reading time: ${estimatedReadTime} minutes\n- File: ${fileName || 'Audio transcript'}\n\n**Manual Summary Tips:**\n- Look for repeated themes or topics\n- Identify key speakers and their main points\n- Note any conclusions or action items mentioned`;
        } else if (questionLower.includes('speaker') || questionLower.includes('who said')) {
          const speakers = [...new Set(transcript.match(/Speaker [A-Z]:/g) || [])];
          fallbackResponse += `**Speaker Analysis:**\n- Detected speakers: ${speakers.length > 0 ? speakers.join(', ') : 'Multiple speakers found'}\n- You can search the transcript for specific speaker patterns\n- Look for "Speaker A:", "Speaker B:" etc. to track conversations`;
        } else if (questionLower.includes('action') || questionLower.includes('task') || questionLower.includes('todo')) {
          fallbackResponse += `**Action Items Search:**\n- Look for keywords like: "action", "task", "follow up", "next steps"\n- Search for phrases: "we need to", "I will", "let's do"\n- Check for dates, deadlines, or commitments mentioned`;
        } else if (questionLower.includes('topic') || questionLower.includes('theme')) {
          fallbackResponse += `**Topic Analysis:**\n- Your transcript is ${transcript.length} characters long\n- You can manually scan for recurring words or phrases\n- Look for section breaks or topic transitions\n- Consider the main subjects discussed`;
        } else {
          fallbackResponse += `**Your Question:** "${message}"\n\n**What you can do:**\n- Search the transcript directly for relevant keywords\n- Use browser search (Ctrl+F) to find specific terms\n- Review the transcript sections that might contain your answer\n\n**Transcript Info:**\n- Length: ${transcript.split(' ').length} words\n- File: ${fileName || 'Audio transcript'}`;
        }
        

        
        return res.status(200).json({
          response: fallbackResponse,
          timestamp: new Date().toISOString()
        });
      }
      
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';

    if (!text) {
      throw new Error('No response generated from OpenAI');
    }

    return res.status(200).json({
      response: text,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat API error:', error);
    
    // Handle specific error types with helpful fallback responses
    if (error.message?.includes('API key') || error.message?.includes('401')) {
      return res.status(200).json({
        response: `**AI Service Temporarily Unavailable**\n\nI'm sorry, but I can't access the AI service right now due to a configuration issue. However, I can still provide some basic help!\n\n**About your transcript:**\n- File: ${req.body.fileName || 'Audio transcript'}\n- Word count: ${req.body.transcript?.split(' ').length || 'Unknown'} words\n- Your question: "${req.body.message}"\n\n**Suggestion:** Please contact support or try again later. In the meantime, you can use the transcript directly to find the information you need.`,
        timestamp: new Date().toISOString()
      });
    } else if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('Too Many Requests')) {
      return res.status(200).json({
        response: `**Rate Limit Reached**\n\nI'm receiving too many requests right now. Please wait a moment and try again.\n\n**Your question:** "${req.body.message}"\n\n**Tip:** You can review your transcript directly while waiting, or try asking a simpler question.`,
        timestamp: new Date().toISOString()
      });
    } else if (error.message?.includes('safety')) {
      return res.status(200).json({
        response: `**Content Filtering**\n\nYour question was filtered by safety settings. Please try rephrasing your question in a different way.\n\n**Original question:** "${req.body.message}"\n\n**Suggestion:** Try asking more specific questions about the transcript content.`,
        timestamp: new Date().toISOString()
      });
    }
    
    // Generic fallback for other errors
    return res.status(200).json({
      response: `**Temporary Service Issue**\n\nI'm experiencing a temporary issue and can't process your request right now.\n\n**Your question:** "${req.body.message}"\n\n**What you can do:**\n- Try again in a few moments\n- Review your transcript directly\n- Contact support if the issue persists\n\n**Transcript info:** ${req.body.transcript?.split(' ').length || 'Unknown'} words from ${req.body.fileName || 'your audio file'}`,
      timestamp: new Date().toISOString()
    });
  }
}
