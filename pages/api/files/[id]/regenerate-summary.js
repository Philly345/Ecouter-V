import { connectToDatabase } from '../../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Check authentication
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    // Get file ID from URL
    const { id } = req.query;
    
    // Connect to the database
    const { db } = await connectToDatabase();
    
    // Find the file by ID
    const file = await db.collection('files').findOne({ 
      _id: new ObjectId(id),
    });

    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Generate a new summary using the transcript
    const summary = await generateSummary(file.transcript);
    
    // Update the file with the new summary
    await db.collection('files').updateOne(
      { _id: new ObjectId(id) },
      { $set: { summary } }
    );

    // Return the updated summary
    return res.status(200).json({ 
      message: 'Summary regenerated successfully', 
      summary 
    });
    
  } catch (error) {
    console.error('Summary regeneration error:', error);
    return res.status(500).json({ message: 'Error regenerating summary' });
  }
}

// Helper function to generate a summary from a transcript
async function generateSummary(transcript) {
  try {
    // Initialize the Gemini Pro model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    // Clean up the transcript if needed
    const cleanTranscript = transcript.slice(0, 30000); // Limit to 30k chars to avoid token limits
    
    // Create a prompt for the model
    const prompt = `
    You are an expert AI assistant specialized in creating high-quality summaries of audio transcripts.

    IMPORTANT INSTRUCTIONS:
    1. DO NOT repeat the transcript verbatim
    2. Create an insightful, thoughtful summary that captures the key points (1-2 paragraphs)
    3. Use your own words to synthesize the main ideas and context
    4. Make the summary informative and useful even for very short transcripts
    5. If the transcript is unclear or incomplete, make note of that fact in your summary
    
    Transcript:
    ${cleanTranscript}
    `;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    if (!text || text.trim() === '') {
      return 'Summary generation failed';
    }
    
    return text.trim();
  } catch (error) {
    console.error('Gemini API error:', error);
    return 'Summary generation failed';
  }
}
