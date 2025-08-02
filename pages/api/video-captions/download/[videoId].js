import jwt from 'jsonwebtoken';
import { connectToDatabase } from '../../../../lib/mongodb';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify JWT token
    const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const { videoId } = req.query;

    if (!videoId) {
      return res.status(400).json({ error: 'Video ID is required' });
    }

    // Connect to database
    const { db } = await connectToDatabase();

    // Get video information
    const videoDoc = await db.collection('video_captions').findOne({
      videoId,
      userId
    });

    if (!videoDoc) {
      return res.status(404).json({ error: 'Video not found' });
    }

    if (!videoDoc.captionedVideoPath) {
      return res.status(404).json({ error: 'Captioned video not available' });
    }

    const videoPath = videoDoc.captionedVideoPath;

    // Check if file exists
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ error: 'Video file not found on server' });
    }

    // Get file stats
    const stats = fs.statSync(videoPath);
    const fileSize = stats.size;

    // Set appropriate headers
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Length', fileSize);
    res.setHeader('Content-Disposition', `attachment; filename="captioned_${videoDoc.originalName}"`);
    res.setHeader('Accept-Ranges', 'bytes');

    // Handle range requests for video streaming
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;

      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      res.setHeader('Content-Length', chunksize);

      const stream = fs.createReadStream(videoPath, { start, end });
      stream.pipe(res);
    } else {
      // Stream entire file
      const stream = fs.createReadStream(videoPath);
      stream.pipe(res);
    }

  } catch (error) {
    console.error('Video download error:', error);
    res.status(500).json({ 
      error: 'Failed to download video',
      details: error.message 
    });
  }
}
