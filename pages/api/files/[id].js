import { verifyTokenString, getTokenFromRequest } from '../../../utils/auth.js';
import { deleteFile } from '../../../utils/storage.js';
import { connectDB } from '../../../lib/mongodb.js';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  try {
    // Verify authentication
    const token = getTokenFromRequest(req);
    const decoded = verifyTokenString(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user ID from token
    const userId = decoded.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Invalid token - missing user ID' });
    }

    const { id } = req.query;

    if (req.method === 'GET') {
      // Get single file
      const { db } = await connectDB();
      const file = await db.collection('files').findOne({ 
        _id: new ObjectId(id) 
      });
      
      console.log('File API - GET request:', {
        id,
        fileFound: !!file,
        fileUserId: file?.userId,
        fileUserIdType: typeof file?.userId,
        userIdFromToken: userId,
        match: file?.userId?.toString() === userId
      });
      
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }
      
      // Check if user owns this file
      const fileUserIdString = typeof file.userId === 'object' ? file.userId.toString() : file.userId;
      if (fileUserIdString !== userId) {
        console.log('File API - Access denied:', {
          fileUserIdString,
          userIdString: userId,
          match: false
        });
        return res.status(403).json({ error: 'Access denied' });
      }
      
      res.status(200).json({
        success: true,
        file: {
          ...file,
          id: file._id.toString(),
          _id: undefined
        },
      });
    } else if (req.method === 'POST') {
      // Handle POST actions like regenerating summary
      const { db } = await connectDB();
      const file = await db.collection('files').findOne({ 
        _id: new ObjectId(id) 
      });
      
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }
      
      // Check if user owns this file
      const fileUserIdString = typeof file.userId === 'object' ? file.userId.toString() : file.userId;
      if (fileUserIdString !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      if (req.body.action === 'regenerate_summary') {
        // Regenerate the summary
        if (!file.transcript) {
          return res.status(400).json({ error: 'No transcript available to generate summary' });
        }

        const summary = await generateSummary(file.transcript);
        
        // Update file with new summary using MongoDB
        await db.collection('files').updateOne(
          { _id: new ObjectId(id) },
          { 
            $set: {
              summary: summary.summary,
              topic: summary.topic,
              updatedAt: new Date()
            }
          }
        );
        
        const updatedFile = await db.collection('files').findOne({ 
          _id: new ObjectId(id) 
        });
        
        res.status(200).json({
          success: true,
          file: {
            ...updatedFile,
            id: updatedFile._id.toString(),
            _id: undefined
          },
          message: 'Summary regenerated successfully',
        });
      } else {
        res.status(400).json({ error: 'Unknown action' });
      }
      
    } else if (req.method === 'DELETE') {
      // Delete file
      const { db } = await connectDB();
      const file = await db.collection('files').findOne({ 
        _id: new ObjectId(id) 
      });
      
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }
      
      // Check if user owns this file
      const fileUserIdString = typeof file.userId === 'object' ? file.userId.toString() : file.userId;
      if (fileUserIdString !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Delete from storage
      if (file.key) {
        await deleteFile(file.key);
      }
      
      // Delete from database
      await db.collection('files').deleteOne({ _id: new ObjectId(id) });
      
      res.status(200).json({
        success: true,
        message: 'File deleted successfully',
      });
      
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('File API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function generateSummary(text) {
  try {
    // Take a subset of the transcript if it's too long
    const truncatedText = text.length > 5000 ? text.substring(0, 5000) + "..." : text;
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `As an AI assistant for a transcription app, analyze this transcript and provide:

1. Summary: Write a clear, concise summary (2-3 sentences) that captures the main points
2. Topic: Provide a brief topic description (1-3 words)

Format your response exactly like this:
Summary: [Your 2-3 sentence summary here]
Topic: [Your 1-3 word topic here]

Transcript: ${truncatedText}`
          }]
        }],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      }),
    });

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    console.log('Generated text from AI:', generatedText);
    
    // Parse the response to extract summary and topic using regex for more reliability
    let summary = '';
    let topic = '';
    
    const summaryMatch = generatedText.match(/Summary:\s*(.*?)(?=Topic:|$)/si);
    if (summaryMatch && summaryMatch[1]) {
      summary = summaryMatch[1].trim();
    }
    
    const topicMatch = generatedText.match(/Topic:\s*(.*?)(?=\n|$)/si);
    if (topicMatch && topicMatch[1]) {
      topic = topicMatch[1].trim();
    }
    
    // If we still don't have a summary, try a simpler approach
    if (!summary) {
      const lines = generatedText.split('\n').filter(line => line.trim());
      for (const line of lines) {
        if (line.toLowerCase().includes('summary:')) {
          summary = line.replace(/.*summary:?\s*/i, '').trim();
        } else if (line.toLowerCase().includes('topic:')) {
          topic = line.replace(/.*topic:?\s*/i, '').trim();
        }
      }
    }
    
    // If we still don't have a proper summary, create a default one
    if (!summary || summary.length < 10) {
      // Generate a very basic summary from the first few sentences
      const firstSentences = text.split(/[.!?]/).slice(0, 2).join('. ') + '.';
      summary = firstSentences.length > 10 ? firstSentences : "Transcript contains audio content.";
    }
    
    return {
      summary: summary,
      topic: topic || 'General',
    };
  } catch (error) {
    console.error('Summary generation error:', error);
    return {
      summary: 'Summary generation failed',
      topic: 'General',
    };
  }
}
