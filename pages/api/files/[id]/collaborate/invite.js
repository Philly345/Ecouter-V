import { connectToDatabase } from '../../../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const { email, permission } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { db } = await connectToDatabase();

    // Verify user has permission to invite collaborators
    const file = await db.collection('files').findOne({
      _id: new ObjectId(id),
      userId: decoded.userId
    });

    if (!file) {
      return res.status(404).json({ message: 'File not found or access denied' });
    }

    // Check if collaborator already exists and has accepted
    const existingCollaborator = file.collaborators?.find(c => c.email === email);
    if (existingCollaborator && existingCollaborator.status === 'accepted') {
      return res.status(400).json({ message: 'User is already an active collaborator' });
    }

    // If user was previously invited but hasn't accepted, remove the old invitation
    if (existingCollaborator && existingCollaborator.status === 'invited') {
      await db.collection('files').updateOne(
        { _id: new ObjectId(id) },
        { 
          $pull: { collaborators: { email: email } },
          $set: { updatedAt: new Date() }
        }
      );
    }

    // Generate collaboration token
    const collaborationToken = jwt.sign(
      { 
        fileId: id,
        email,
        permission,
        invitedBy: decoded.userId
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Add collaborator to file
    const newCollaborator = {
      id: new ObjectId().toString(),
      email,
      permission,
      status: 'invited',
      invitedAt: new Date(),
      invitedBy: decoded.userId,
      token: collaborationToken
    };

    await db.collection('files').updateOne(
      { _id: new ObjectId(id) },
      { 
        $push: { collaborators: newCollaborator },
        $set: { updatedAt: new Date() }
      }
    );

    // Get inviter information
    const inviter = await db.collection('users').findOne({ _id: new ObjectId(decoded.userId) });

    // Send invitation email
    await sendInvitationEmail({
      req,
      to: email,
      fileName: file.originalName,
      inviterName: inviter?.name || inviter?.email || 'Someone',
      inviterEmail: inviter?.email,
      permission,
      collaborationToken,
      fileId: id
    });

    // Return collaborator info (without sensitive data)
    const { token: _, ...collaboratorResponse } = newCollaborator;
    
    const message = existingCollaborator && existingCollaborator.status === 'invited' 
      ? 'New invitation sent successfully (previous invitation replaced)' 
      : 'Invitation sent successfully';
    
    res.status(200).json({
      message,
      collaborator: collaboratorResponse,
      isReinvite: !!(existingCollaborator && existingCollaborator.status === 'invited')
    });

  } catch (error) {
    console.error('Collaboration invite error:', error);
    res.status(500).json({ message: 'Failed to send invitation' });
  }
}

async function sendInvitationEmail({ req, to, fileName, inviterName, inviterEmail, permission, collaborationToken, fileId }) {
  // Check if we have email configuration
  const hasBrevoConfig = process.env.SMTP_SERVER && process.env.SMTP_LOGIN && process.env.SMTP_PASSWORD;
  const hasGmailConfig = process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD;
  
  if (!hasBrevoConfig && !hasGmailConfig) {
    console.log('No email configuration found, skipping invitation email');
    return;
  }

  // Use Gmail if available, otherwise fall back to Brevo
  let transporter;
  
  if (hasGmailConfig) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  } else {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_SERVER,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_LOGIN,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  // Determine the correct base URL for collaboration links
  const getBaseUrl = (req) => {
    // Check if request comes from localhost
    const host = req.headers.host;
    if (host && (host.includes('localhost') || host.includes('127.0.0.1'))) {
      return `http://${host}`;
    }
    
    // In development mode, prefer localhost
    if (process.env.NODE_ENV === 'development') {
      return 'http://localhost:3000';
    }
    
    // In production, use the configured URLs
    return process.env.BASE_URL || process.env.NEXTAUTH_URL || 'https://ecoutertranscribe.tech';
  };

  const collaborationUrl = `${getBaseUrl(req)}/files/${fileId}/collaborate?token=${collaborationToken}`;

  const permissionDescriptions = {
    view: 'view the transcript and leave comments',
    comment: 'view the transcript and add comments',
    edit: 'view, comment, and edit the transcript in real-time',
    owner: 'full access including managing collaborators and settings'
  };

  const emailTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Collaboration Invitation</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1a202c; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #f7fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .permission-box { background: #e6f3ff; border: 1px solid #3182ce; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎤 Écouter Collaboration Invitation</h1>
      </div>
      <div class="content">
        <p>Hi there,</p>
        
        <p><strong>${inviterName}</strong> has invited you to collaborate on the transcript "<strong>${fileName}</strong>".</p>
        
        <div class="permission-box">
          <strong>Your Permission Level: ${permission.charAt(0).toUpperCase() + permission.slice(1)}</strong><br>
          <small>You can ${permissionDescriptions[permission]}.</small>
        </div>
        
        <p>Click the button below to join the collaboration:</p>
        
        <div style="text-align: center;">
          <a href="${collaborationUrl}" class="button">🔗 Join Collaboration</a>
        </div>
        
        <p>With Écouter's collaboration features, you can:</p>
        <ul>
          <li>📝 Work together in real-time</li>
          <li>💬 Leave comments and suggestions</li>
          <li>👥 See who's editing where</li>
          <li>💾 Track all changes with version history</li>
          <li>🔄 Get live updates as others edit</li>
        </ul>
        
        <p>If you have any questions, feel free to reach out to ${inviterEmail}.</p>
        
        <div class="footer">
          <p>This invitation was sent from Écouter - AI-Powered Transcription Platform</p>
          <p>If you didn't expect this invitation, you can safely ignore this email.</p>
          <p>This invitation expires in 7 days.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: 'Écouter <no-reply@ecouter.systems>',
    to,
    subject: `You're invited to collaborate on "${fileName}"`,
    html: emailTemplate,
    text: `Hi there,

${inviterName} has invited you to collaborate on the transcript "${fileName}".

Your Permission Level: ${permission.charAt(0).toUpperCase() + permission.slice(1)}
You can ${permissionDescriptions[permission]}.

Join the collaboration: ${collaborationUrl}

If you have any questions, reach out to ${inviterEmail}.

This invitation expires in 7 days.

---
Écouter - AI-Powered Transcription Platform`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Collaboration invitation sent to ${to}`);
  } catch (error) {
    console.error('Error sending collaboration invitation:', error);
    throw error;
  }
}