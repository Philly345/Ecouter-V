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

    const { fileId } = req.body;
    
    if (!fileId) {
      return res.status(400).json({ error: 'File ID is required' });
    }

    // Get the file
    const file = filesDB.findById(fileId);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    if (file.userId !== user.id) {
      return res.status(403).json({ error: 'Not authorized to update this file' });
    }
    
    if (!file.transcript) {
      return res.status(400).json({ error: 'File has no transcript to summarize' });
    }

    // Generate new summary
    try {
      const newSummary = await generateSummary(file.transcript);
      
      // Update file
      filesDB.update(file.id, {
        summary: newSummary,
        topic: file.topic || 'General' // Preserve existing topic if available
      });

      return res.status(200).json({
        success: true,
        message: 'Summary regenerated successfully',
        summary: newSummary
      });
    } catch (err) {
      console.error(`Error processing file ${file.id}:`, err);
      return res.status(500).json({ error: 'Failed to regenerate summary' });
    }

  } catch (error) {
    console.error('Error regenerating summary:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function generateSummary(text) {
  try {
    // Take a subset of the transcript if it's too long (matching working TypeScript code)
    const maxTranscriptLength = 32000;
    const truncatedText = text.length > maxTranscriptLength 
      ? text.substring(0, maxTranscriptLength) 
      : text;
    
    // Using the exact same prompt format as the working TypeScript code
    const summaryPrompt = `Analyze this transcript:\n\n"${truncatedText}"\n\nProvide:\n1. SUMMARY: A 2-3 sentence summary.\n2. TOPICS: 3-5 main topics, comma-separated.\n3. INSIGHTS: 1-2 key insights.\n\nFormat your response exactly like this:\nSUMMARY: [Your summary]\nTOPICS: [topic1, topic2]\nINSIGHTS: [Your insights]`;
    
    // Using the same model as the working code (gemini-1.5-flash)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: summaryPrompt
          }]
        }]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, response.statusText);
      console.error('Error response:', errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Parse response using the exact same logic as working code
    let summary = "AI-generated summary not available";
    
    const summaryMatch = generatedText.match(/SUMMARY:\s*(.+?)(?=TOPICS:|$)/s);
    if (summaryMatch) {
      summary = summaryMatch[1].trim();
    }
    
    // Validate the summary
    if (!summary || summary.length < 20) {
      return "AI summary generation failed - please try regenerating manually.";
    }
    
    return summary;
  } catch (error) {
    console.error('Summary generation error:', error);
    return 'AI summary generation failed';
  }
}

async function generateSummaryRetry(text) {
  try {
    // Simplified retry using the same working pattern
    const summaryPrompt = `Analyze this transcript:\n\n"${text}"\n\nProvide:\n1. SUMMARY: A 2-3 sentence summary.\n2. TOPICS: 3-5 main topics, comma-separated.\n3. INSIGHTS: 1-2 key insights.\n\nFormat your response exactly like this:\nSUMMARY: [Your summary]\nTOPICS: [topic1, topic2]\nINSIGHTS: [Your insights]`;
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: summaryPrompt
          }]
        }]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API retry error:', response.status, response.statusText);
      console.error('Error response:', errorText);
      throw new Error(`Gemini API retry error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Parse response
    const summaryMatch = generatedText.match(/SUMMARY:\s*(.+?)(?=TOPICS:|$)/s);
    let summary = summaryMatch ? summaryMatch[1].trim() : "AI summary generation failed after retry";
    
    if (!summary || summary.length < 20) {
      return "AI summary generation failed after retry - please regenerate manually.";
    }
    
    return summary;
  } catch (error) {
    console.error('Retry summary generation error:', error);
    return 'AI summary generation failed after retry';
  }
}
