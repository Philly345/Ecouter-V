import { verifyToken } from '../../../utils/auth';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { connectDB } from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export const config = {
  api: {
    bodyParser: false, // Disable body parser to handle file uploads
  },
};

// Helper function to upload file to storage
async function uploadAudioFile(file, sessionTitle, userId) {
  try {
    // For now, we'll save to local uploads directory
    // In production, you'd upload to cloud storage like R2, S3, etc.
    const uploadsDir = path.join(process.cwd(), 'uploads', 'live-sessions');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const timestamp = Date.now();
    const sanitizedTitle = sessionTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    // Get file extension from original filename or mimetype
    let extension = 'wav'; // default
    if (file.originalFilename && file.originalFilename.includes('.')) {
      extension = file.originalFilename.split('.').pop().toLowerCase();
    } else if (file.mimetype) {
      if (file.mimetype.includes('webm')) extension = 'webm';
      else if (file.mimetype.includes('mp4')) extension = 'mp4';
      else if (file.mimetype.includes('wav')) extension = 'wav';
    }
    
    const fileName = `${sanitizedTitle}_${userId}_${timestamp}.${extension}`;
    const filePath = path.join(uploadsDir, fileName);
    
    console.log(`📁 Saving audio file: ${fileName} (${file.size} bytes)`);
    
    // Copy file to destination
    fs.copyFileSync(file.filepath, filePath);
    
    // Verify file was saved
    if (fs.existsSync(filePath)) {
      const savedFileSize = fs.statSync(filePath).size;
      console.log(`✅ Audio file saved successfully: ${savedFileSize} bytes`);
    } else {
      throw new Error('File was not saved properly');
    }
    
    // Return relative URL (in production, return cloud storage URL)
    return `/uploads/live-sessions/${fileName}`;
    
  } catch (error) {
    console.error('File upload error:', error);
    throw new Error('Failed to upload audio file');
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🎙️ Live Transcription Save - Request received');

  try {
    // Verify authentication
    const user = await verifyToken(req);
    if (!user) {
      console.log('❌ Live Transcription Save - Authentication failed');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log(`👤 Live Transcription Save - User ID: ${user.userId}`);

    // Parse form data
    const form = formidable({
      maxFileSize: 100 * 1024 * 1024, // 100MB limit
      keepExtensions: true,
      filter: ({ mimetype }) => {
        // Allow audio files and video files that contain audio
        return Boolean(mimetype && (
          mimetype.includes('audio/') || 
          mimetype.includes('video/webm') ||
          mimetype.includes('video/mp4')
        ));
      }
    });

    const [fields, files] = await form.parse(req);
    
    const title = Array.isArray(fields.title) ? fields.title[0] : fields.title;
    const transcriptsJson = Array.isArray(fields.transcripts) ? fields.transcripts[0] : fields.transcripts;
    const speakersJson = Array.isArray(fields.speakers) ? fields.speakers[0] : fields.speakers;
    const duration = Array.isArray(fields.duration) ? fields.duration[0] : fields.duration;
    const audioFile = Array.isArray(files.audio) ? files.audio[0] : files.audio;

    console.log('📝 Form data received:', {
      title,
      transcriptsLength: transcriptsJson?.length || 0,
      speakersLength: speakersJson?.length || 0,
      duration,
      audioFile: audioFile ? {
        name: audioFile.originalFilename,
        size: audioFile.size,
        type: audioFile.mimetype
      } : 'No audio file'
    });

    if (!title || !transcriptsJson) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let transcripts, speakers;
    try {
      transcripts = JSON.parse(transcriptsJson);
      speakers = speakersJson ? JSON.parse(speakersJson) : [];
    } catch (error) {
      return res.status(400).json({ error: 'Invalid JSON data' });
    }

    console.log(`📝 Session title: ${title}`);
    console.log(`⏱️ Duration: ${duration} seconds`);
    console.log(`🎤 Transcripts count: ${transcripts.length}`);
    console.log(`👥 Speakers: ${speakers.join(', ')}`);

    // Upload audio file if provided
    let audioUrl = null;
    if (audioFile) {
      console.log('🎵 Uploading audio file...');
      audioUrl = await uploadAudioFile(audioFile, title, user.userId);
      console.log(`✅ Audio uploaded: ${audioUrl}`);
    }

    // Connect to MongoDB
    console.log('🔗 Connecting to MongoDB...');
    const { db } = await connectDB();

    // Create session document
    const sessionData = {
      userId: new ObjectId(user.userId),
      title: title.trim(),
      transcripts,
      speakers,
      duration: parseInt(duration) || 0,
      audioUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
      type: 'live-transcription'
    };

    const result = await db.collection('liveTranscriptions').insertOne(sessionData);
    console.log(`✅ Live transcription session saved with ID: ${result.insertedId}`);

    // Clean up temporary file
    if (audioFile) {
      try {
        fs.unlinkSync(audioFile.filepath);
      } catch (error) {
        console.log('Warning: Could not clean up temporary file');
      }
    }

    res.status(200).json({
      success: true,
      sessionId: result.insertedId,
      message: 'Live transcription session saved successfully'
    });

  } catch (error) {
    console.error('❌ Live transcription save error:', error);
    res.status(500).json({ 
      error: 'Failed to save live transcription session',
      details: error.message 
    });
  }
}