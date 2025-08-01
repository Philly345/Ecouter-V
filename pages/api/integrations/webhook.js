// Webhook API for third-party integrations
import { connectDB } from '../../../lib/mongodb';
import { getTokenFromRequest, verifyToken } from '../../../utils/auth';
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

    const { 
      fileId, 
      webhookUrl, 
      eventType = 'transcription_complete',
      includeAnalytics = false,
      customData = {}
    } = req.body;

    if (!fileId || !webhookUrl) {
      return res.status(400).json({ error: 'fileId and webhookUrl are required' });
    }

    // Connect to database
    const { db } = await connectDB();
    
    // Find the file
    const file = await db.collection('files').findOne({ 
      _id: new ObjectId(fileId),
      userId: decoded.userId 
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Prepare webhook payload
    const payload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      file: {
        id: file._id,
        name: file.name,
        duration: file.duration,
        language: file.language,
        status: file.status,
        createdAt: file.createdAt,
        transcript: file.transcript,
        summary: file.summary,
        ...(includeAnalytics && file.analytics ? { analytics: file.analytics } : {})
      },
      user: {
        id: decoded.userId,
        email: decoded.email
      },
      customData
    };

    // Send webhook
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Ecouter-Transcribe-Webhook/1.0'
      },
      body: JSON.stringify(payload)
    });

    if (!webhookResponse.ok) {
      throw new Error(`Webhook failed with status: ${webhookResponse.status}`);
    }

    // Log webhook delivery
    await db.collection('webhook_logs').insertOne({
      userId: decoded.userId,
      fileId: new ObjectId(fileId),
      webhookUrl,
      eventType,
      status: 'delivered',
      responseStatus: webhookResponse.status,
      timestamp: new Date(),
      payload: payload
    });

    res.status(200).json({
      success: true,
      message: 'Webhook delivered successfully',
      webhookStatus: webhookResponse.status
    });

  } catch (error) {
    console.error('Webhook delivery error:', error);
    
    // Log failed webhook
    try {
      const { db } = await connectDB();
      await db.collection('webhook_logs').insertOne({
        userId: req.body.userId || 'unknown',
        fileId: req.body.fileId ? new ObjectId(req.body.fileId) : null,
        webhookUrl: req.body.webhookUrl,
        eventType: req.body.eventType || 'transcription_complete',
        status: 'failed',
        error: error.message,
        timestamp: new Date()
      });
    } catch (logError) {
      console.error('Failed to log webhook error:', logError);
    }

    res.status(500).json({ 
      error: 'Webhook delivery failed',
      details: error.message 
    });
  }
}
