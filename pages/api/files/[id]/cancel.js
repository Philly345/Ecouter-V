import { verifyTokenString, getTokenFromRequest } from '../../../../utils/auth.js';
import { deleteFile } from '../../../../utils/storage.js';
import { connectDB } from '../../../../lib/mongodb.js';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    // Connect to database
    const { db } = await connectDB();
    
    // Find the file
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
    
    // Check if file is actually processing
    if (file.status !== 'processing' && file.status !== 'processing_ai') {
      return res.status(400).json({ 
        error: 'File is not in processing state',
        currentStatus: file.status 
      });
    }
    
    // Cancel the AssemblyAI job if it exists
    if (file.transcriptId || file.assemblyJobId) {
      const transcriptId = file.transcriptId || file.assemblyJobId;
      try {
        console.log(`🛑 Attempting to cancel AssemblyAI job: ${transcriptId}`);
        
        // Check if the job is still active before trying to cancel
        const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
          headers: { 'Authorization': `Bearer ${process.env.ASSEMBLYAI_API_KEY}` }
        });
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          console.log(`📊 AssemblyAI job status: ${statusData.status}`);
          
          // Only try to cancel if the job is still processing
          if (statusData.status === 'processing' || statusData.status === 'queued') {
            // Note: AssemblyAI doesn't provide a direct cancel endpoint
            // The job will continue on their end but we're removing our reference to it
            console.log(`⚠️ AssemblyAI job ${transcriptId} is still processing but cannot be cancelled directly`);
            console.log(`✅ Removing local reference - job will complete on AssemblyAI but results will be ignored`);
          } else {
            console.log(`ℹ️ AssemblyAI job ${transcriptId} status: ${statusData.status} - no cancellation needed`);
          }
        } else {
          console.log(`⚠️ Could not check AssemblyAI job status: ${statusResponse.status}`);
        }
      } catch (assemblyError) {
        console.error('Error checking/cancelling AssemblyAI job:', assemblyError);
        // Continue with file deletion even if AssemblyAI cancellation fails
      }
    }
    
    // Delete the file from storage if it exists
    if (file.key) {
      try {
        await deleteFile(file.key);
        console.log(`🗄️ Successfully deleted file from storage: ${file.key}`);
      } catch (storageError) {
        console.error('Error deleting file from storage:', storageError);
        // Continue with database deletion even if storage deletion fails
      }
    }
    
    // Delete the file from database
    await db.collection('files').deleteOne({ _id: new ObjectId(id) });
    
    console.log(`File cancelled and deleted: ${file.name} (ID: ${id}) for user ${userId}`);
    
    res.status(200).json({
      success: true,
      message: 'File processing cancelled and file deleted successfully',
      fileName: file.name
    });
    
  } catch (error) {
    console.error('Cancel file API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}