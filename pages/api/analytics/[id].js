// API endpoint for generating AI-powered meeting analytics
import { connectDB } from '../../../lib/mongodb';
import { getTokenFromRequest, verifyToken } from '../../../utils/auth';
import MeetingAnalytics from '../../../utils/analytics';
import { ObjectId } from 'mongodb';

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

    const { id } = req.query;
    const { forceRegenerate = false } = req.body;

    // Connect to database
    const { db } = await connectDB();
    
    // Find the file
    const file = await db.collection('files').findOne({ 
      _id: new ObjectId(id),
      userId: decoded.userId 
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (!file.transcript || file.transcript.length === 0) {
      return res.status(400).json({ error: 'No transcript available for analysis' });
    }

    // Check if analytics already exist and not forcing regeneration
    if (file.analytics && !forceRegenerate) {
      return res.status(200).json({
        success: true,
        analytics: file.analytics,
        cached: true
      });
    }

    // Generate analytics
    const analytics = new MeetingAnalytics();
    
    // Extract speakers from transcript (basic implementation)
    const speakers = extractSpeakersFromTranscript(file.transcript);
    
    // Generate comprehensive meeting report
    const report = await analytics.generateMeetingReport(file.transcript, speakers);

    // Save analytics to database
    await db.collection('files').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          analytics: report,
          analyticsGeneratedAt: new Date()
        }
      }
    );

    res.status(200).json({
      success: true,
      analytics: report,
      cached: false
    });

  } catch (error) {
    console.error('Analytics generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate analytics',
      details: error.message 
    });
  }
}

// Helper function to extract speakers from transcript
function extractSpeakersFromTranscript(transcript) {
  const speakers = new Set();
  const lines = transcript.split('\n');
  
  lines.forEach(line => {
    // Look for speaker patterns like "Speaker A:", "John:", etc.
    const speakerMatch = line.match(/^([^:]+):\s*/);
    if (speakerMatch) {
      const speaker = speakerMatch[1].trim();
      if (speaker && speaker.length < 50) { // Reasonable speaker name length
        speakers.add(speaker);
      }
    }
  });
  
  return Array.from(speakers);
}
