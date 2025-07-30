import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { verifyToken, getTokenFromRequest } from '../../../utils/auth.js';
import { connectDB } from '../../../lib/mongodb.js';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check required environment variables
    const requiredEnvVars = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME', 'R2_PUBLIC_URL'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: `Missing environment variables: ${missingVars.join(', ')}`
      });
    }

    // Verify authentication
    const token = getTokenFromRequest(req);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Find user in MongoDB
    const { db } = await connectDB();
    const user = await db.collection('users').findOne({ email: decoded.email });
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const { fileName, fileType, fileSize } = req.body;

    if (!fileName || !fileType || !fileSize) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Validate file size (max 500MB)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (fileSize > maxSize) {
      return res.status(400).json({ 
        error: 'File too large',
        details: `File size exceeds limit of 500MB`
      });
    }

    // Validate file type
    const supportedTypes = [
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/flac', 'audio/aac',
      'video/mp4', 'video/mov', 'video/avi', 'video/mkv', 'video/webm'
    ];
    
    if (!supportedTypes.includes(fileType)) {
      return res.status(400).json({ 
        error: 'Unsupported file type',
        details: `File type ${fileType} not supported`
      });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const userId = user.id || user._id.toString();
    const uniqueFileName = `${userId}/${timestamp}_${fileName}`;

    // Create presigned URL for direct upload to R2
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: uniqueFileName,
      ContentType: fileType,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { 
      expiresIn: 3600 // 1 hour
    });

    // Return the presigned URL and file details
    res.status(200).json({
      presignedUrl,
      fileName: uniqueFileName,
      publicUrl: `${process.env.R2_PUBLIC_URL}/${uniqueFileName}`,
      expiresIn: 3600
    });

  } catch (error) {
    console.error('Presigned URL error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}
