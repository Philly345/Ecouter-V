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
    
    // Get all files that need fixing
    const allFiles = filesDB.findAll({ userId: decoded.userId });
    const filesNeedingFix = allFiles.filter(file => {
      return (
        file.status === 'completed' && 
        file.transcript && 
        (
          !file.summary || 
          file.summary === 'Summary not available' || 
          file.summary === 'Summary generation failed' ||
          file.transcript.startsWith(file.summary) ||
          (file.summary.length < 30 && file.transcript.length > 100)
        )
      );
    });
    
    // Count of fixed files
    let fixedCount = 0;

    // Process each file (in a real application, this would be queued and processed in batches)
    for (const file of filesNeedingFix) {
      try {
        // Generate a new summary
        const newSummary = await generateSummary(file.transcript);
        
        // Update the file
        filesDB.update(file.id, {
          summary: newSummary.summary,
          topic: newSummary.topic || file.topic || 'General'
        });
        
        fixedCount++;
      } catch (fileError) {
        console.error(`Error fixing summary for file ${file.id}:`, fileError);
      }
    }
    
    res.status(200).json({
      fixed: fixedCount,
      total: filesNeedingFix.length
    });
    
  } catch (error) {
    console.error('Error fixing summaries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function generateSummary(text) {
  try {
    // Take a subset of the transcript if it's too long
    const truncatedText = text.length > 10000 ? text.substring(0, 10000) + "..." : text;
    
    // Extract the first 100 characters to check for repetition later
    const startOfText = text.substring(0, 100);
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are an expert AI summarization assistant. Create a high-quality, insightful summary for this transcript.

TRANSCRIPT:
${truncatedText}

IMPORTANT INSTRUCTIONS:
1. Do NOT repeat the first few sentences of the transcript
2. Do NOT start with phrases like "This transcript discusses" or "The audio discusses"
3. Begin your summary with a strong, informative statement about the core topic
4. Use your own words to synthesize the key points and insights
5. Focus on the main message, themes, and significant details
6. Write 2-3 concise paragraphs in a professional style
7. Make the summary valuable to someone who hasn't heard the audio
8. End your response with: TOPIC: [1-3 word topic]

Summary:`
          }]
        }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 1024,
        }
      }),
    });

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Parse the response
    let summary = '';
    let topic = '';
    
    // Remove any "Summary:" prefix
    summary = generatedText.replace(/^Summary:\s*/i, '').trim();
    
    // Extract topic if provided at the end
    const topicMatch = summary.match(/TOPIC:\s*([^\.]+)$/i);
    if (topicMatch && topicMatch[1]) {
      topic = topicMatch[1].trim();
      // Remove the topic line from summary
      summary = summary.replace(/TOPIC:\s*([^\.]+)$/i, '').trim();
    }
    
    // Validate the summary
    // Check if summary is just repeating the start of the transcript
    const startOfTruncatedText = truncatedText.substring(0, 100).toLowerCase();
    const startOfSummary = summary.substring(0, Math.min(summary.length, 100)).toLowerCase();
    
    if (startOfTruncatedText.includes(startOfSummary) || startOfSummary.includes(startOfTruncatedText.substring(0, 30))) {
      // Try to generate again with different approach
      return await generateSummaryRetry(truncatedText);
    }
    
    // Create default values if parsing failed
    if (!summary || summary.length < 20) {
      return {
        summary: "AI summary generation failed - please regenerate manually.",
        topic: 'General',
      };
    }
    
    return {
      summary: summary,
      topic: topic || 'General',
    };
  } catch (error) {
    console.error('Summary generation error:', error);
    return {
      summary: 'Summary generation failed. Please try again.',
      topic: 'General',
    };
  }
}

async function generateSummaryRetry(text) {
  try {
    // Using a different prompt and higher temperature for diversity
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `As an expert content analyst, create an original and insightful summary of this transcript. 
            
TRANSCRIPT:
${text}

REQUIREMENTS:
- Begin with a creative, engaging opening sentence that captures the essence
- DO NOT start with "This transcript discusses" or similar phrases
- Write in your own original words, not copying any part of the transcript
- Create 2-3 paragraphs that synthesize the core message and key points
- Use a professional, journalistic style
- End your response with: TOPIC: [1-3 word category]

Your summary:`
          }]
        }],
        generationConfig: {
          temperature: 0.9, // Higher temperature for more creativity
          maxOutputTokens: 600,
        }
      }),
    });

    const data = await response.json();
    let summary = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Clean up summary
    summary = summary.replace(/^Your summary:/, '').trim();
    
    // Extract topic if provided
    let topic = 'General';
    const topicMatch = summary.match(/TOPIC:\s*([^\.]+)$/i);
    if (topicMatch && topicMatch[1]) {
      topic = topicMatch[1].trim();
      // Remove the topic line from summary
      summary = summary.replace(/TOPIC:\s*([^\.]+)$/i, '').trim();
    }
    
    if (!summary || summary.length < 20) {
      return {
        summary: "AI summary generation failed after retry - please regenerate manually.",
        topic: 'General'
      };
    }
    
    return {
      summary: summary,
      topic: topic
    };
  } catch (error) {
    console.error('Retry summary generation error:', error);
    return {
      summary: 'AI summary generation failed after retry',
      topic: 'General'
    };
  }
}
