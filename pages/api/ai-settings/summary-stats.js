import { filesDB, usersDB } from '../../../utils/database.js';
import { verifyToken, getTokenFromRequest } from '../../../utils/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
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

    // Get all completed files with transcripts
    const allFiles = filesDB.findAll()
      .filter(file => 
        file.userId === user.id && 
        file.status === 'completed' && 
        file.transcript
      );
    
    // Find problematic files (missing or poor summaries)
    const problematicFiles = allFiles.filter(file => 
      !file.summary || 
      file.summary === 'Summary not available' ||
      file.summary === 'Summary generation failed' ||
      file.summary.length < 30 ||
      // Check if summary is just the start of the transcript
      file.summary === file.transcript.substring(0, file.summary.length)
    );
    
    const total = allFiles.length;
    const problematic = problematicFiles.length;
    const percentGood = total > 0 ? Math.round(((total - problematic) / total) * 100) : 100;

    return res.status(200).json({
      total,
      problematic,
      percentGood
    });

  } catch (error) {
    console.error('Error getting summary stats:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
