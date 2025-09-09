import { verifyTokenString, getTokenFromRequest } from '../../../utils/auth.js';
import { connectDB } from '../../../lib/mongodb.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Debug: Check environment variables
    const envCheck = {
      R2_ACCOUNT_ID: !!process.env.R2_ACCOUNT_ID,
      R2_ACCESS_KEY_ID: !!process.env.R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY: !!process.env.R2_SECRET_ACCESS_KEY,
      R2_BUCKET_NAME: !!process.env.R2_BUCKET_NAME,
      R2_PUBLIC_URL: !!process.env.R2_PUBLIC_URL,
    };

    console.log('Environment variables check:', envCheck);

    // Check required environment variables
    const requiredEnvVars = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME', 'R2_PUBLIC_URL'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('Missing environment variables:', missingVars);
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: `Missing environment variables: ${missingVars.join(', ')}`,
        envCheck
      });
    }

    // Verify authentication
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const decoded = verifyTokenString(token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid authorization token' });
    }

    // Get user ID from token
    const userId = decoded.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Invalid token - missing user ID' });
    }

    const { fileName, fileType, fileSize } = req.body;

    if (!fileName || !fileType || !fileSize) {
      return res.status(400).json({ 
        error: 'Missing required parameters',
        received: { fileName: !!fileName, fileType: !!fileType, fileSize: !!fileSize }
      });
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
    const uniqueFileName = `${userId}/${timestamp}_${fileName}`;

    // Try to import AWS SDK
    let S3Client, PutObjectCommand, getSignedUrl;
    try {
      const s3Module = await import('@aws-sdk/client-s3');
      const presignerModule = await import('@aws-sdk/s3-request-presigner');
      
      S3Client = s3Module.S3Client;
      PutObjectCommand = s3Module.PutObjectCommand;
      getSignedUrl = presignerModule.getSignedUrl;
      
      console.log('AWS SDK modules loaded successfully');
    } catch (importError) {
      console.error('Failed to import AWS SDK:', importError);
      return res.status(500).json({ 
        error: 'AWS SDK import failed',
        details: importError.message
      });
    }

    // Create S3 client
    let s3Client;
    try {
      s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        },
      });
      console.log('S3 client created successfully');
    } catch (clientError) {
      console.error('Failed to create S3 client:', clientError);
      return res.status(500).json({ 
        error: 'S3 client creation failed',
        details: clientError.message
      });
    }

    // Create presigned URL for direct upload to R2
    try {
      const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: uniqueFileName,
        ContentType: fileType,
      });

      const presignedUrl = await getSignedUrl(s3Client, command, { 
        expiresIn: 3600 // 1 hour
      });

      console.log('Presigned URL generated successfully');

      // Return the presigned URL and file details
      return res.status(200).json({
        presignedUrl,
        fileName: uniqueFileName,
        publicUrl: `${process.env.R2_PUBLIC_URL}/${uniqueFileName}`,
        expiresIn: 3600,
        debug: {
          envCheck,
          userId: userId.substring(0, 8) + '...',
          originalFileName: fileName,
          uniqueFileName,
        }
      });
    } catch (presignError) {
      console.error('Failed to generate presigned URL:', presignError);
      return res.status(500).json({ 
        error: 'Presigned URL generation failed',
        details: presignError.message
      });
    }

  } catch (error) {
    console.error('Presigned URL handler error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
