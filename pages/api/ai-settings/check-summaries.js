import { filesDB } from '../../../utils/database.js';
import { verifyToken, getTokenFromRequest } from '../../../utils/auth.js';

export default async function handler(req, res) {
  try {
    // Verify authentication
    const token = getTokenFromRequest(req);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Get all files
    const allFiles = filesDB.findAll({ userId: decoded.userId });
    
    // Check for files with potentially low-quality summaries
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
    
    res.status(200).json({
      totalFiles: allFiles.filter(f => f.status === 'completed').length,
      needFixing: filesNeedingFix.length
    });
    
  } catch (error) {
    console.error('Error checking summaries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
