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
    if (file.status !== 'processing') {
      return res.status(400).json({ 
        error: 'File is not in processing state',
        currentStatus: file.status 
      });
    }
    
    // Delete the file from storage if it exists
    if (file.key) {
      try {
        await deleteFile(file.key);
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