// Calendar Integration API for auto-uploading meeting recordings
import { connectDB } from '../../../lib/mongodb';
import { getTokenFromRequest, verifyToken } from '../../../utils/auth';
// import { google } from 'googleapis'; // Commented out - install googleapis if needed

export default async function handler(req, res) {
  try {
    // Verify authentication
    const token = getTokenFromRequest(req);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { db } = await connectDB();
    const user = await db.collection('users').findOne({ email: decoded.email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (req.method === 'POST') {
      // Setup calendar integration
      const { calendarType, accessToken, refreshToken, settings = {} } = req.body;

      if (!calendarType || !accessToken) {
        return res.status(400).json({ error: 'calendarType and accessToken are required' });
      }

      // Store calendar integration settings
      await db.collection('users').updateOne(
        { email: decoded.email },
        {
          $set: {
            calendarIntegration: {
              type: calendarType,
              accessToken,
              refreshToken,
              settings: {
                autoUpload: settings.autoUpload || false,
                meetingKeywords: settings.meetingKeywords || ['meeting', 'call', 'standup', 'sync'],
                uploadDelay: settings.uploadDelay || 5, // minutes after meeting ends
                ...settings
              },
              connectedAt: new Date(),
              isActive: true
            }
          }
        }
      );

      res.status(200).json({
        success: true,
        message: 'Calendar integration configured successfully'
      });

    } else if (req.method === 'GET') {
      // Get upcoming meetings that might have recordings
      if (!user.calendarIntegration || !user.calendarIntegration.isActive) {
        return res.status(400).json({ error: 'Calendar integration not configured' });
      }

      const meetings = await getUpcomingMeetings(user.calendarIntegration);
      
      res.status(200).json({
        success: true,
        meetings,
        integration: {
          type: user.calendarIntegration.type,
          isActive: user.calendarIntegration.isActive,
          connectedAt: user.calendarIntegration.connectedAt
        }
      });

    } else if (req.method === 'DELETE') {
      // Disconnect calendar integration
      await db.collection('users').updateOne(
        { email: decoded.email },
        {
          $unset: { calendarIntegration: 1 }
        }
      );

      res.status(200).json({
        success: true,
        message: 'Calendar integration disconnected'
      });

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Calendar integration error:', error);
    res.status(500).json({ 
      error: 'Calendar integration failed',
      details: error.message 
    });
  }
}

// Helper function to get upcoming meetings
async function getUpcomingMeetings(calendarIntegration) {
  try {
    if (calendarIntegration.type === 'google') {
      return await getGoogleCalendarMeetings(calendarIntegration);
    } else if (calendarIntegration.type === 'outlook') {
      return await getOutlookMeetings(calendarIntegration);
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching meetings:', error);
    return [];
  }
}

// Google Calendar integration (requires googleapis package)
async function getGoogleCalendarMeetings(integration) {
  // TODO: Install googleapis package and uncomment the following code
  /*
  const { google } = require('googleapis');
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: integration.accessToken,
    refresh_token: integration.refreshToken
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: now.toISOString(),
    timeMax: tomorrow.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 20
  });

  const events = response.data.items || [];
  
  return events
    .filter(event => {
      const summary = (event.summary || '').toLowerCase();
      return integration.settings.meetingKeywords.some(keyword => 
        summary.includes(keyword.toLowerCase())
      );
    })
    .map(event => ({
      id: event.id,
      title: event.summary,
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
      attendees: event.attendees?.length || 0,
      hasRecording: checkForRecordingLinks(event.description || ''),
      meetingUrl: extractMeetingUrl(event.description || ''),
      source: 'google'
    }));
  */
  
  // Placeholder implementation until googleapis is installed
  return [
    {
      id: 'sample-1',
      title: 'Team Meeting',
      start: new Date().toISOString(),
      end: new Date(Date.now() + 3600000).toISOString(),
      attendees: 5,
      hasRecording: false,
      meetingUrl: 'https://meet.google.com/sample',
      source: 'google'
    }
  ];
}

// Outlook Calendar integration (placeholder)
async function getOutlookMeetings(integration) {
  // Implementation for Microsoft Graph API
  // This would require Microsoft Graph SDK
  return [];
}

// Helper functions
function checkForRecordingLinks(description) {
  const recordingPatterns = [
    /recording/i,
    /zoom\.us\/rec/i,
    /teams\.microsoft\.com.*recording/i,
    /meet\.google\.com.*recording/i
  ];
  
  return recordingPatterns.some(pattern => pattern.test(description));
}

function extractMeetingUrl(description) {
  const urlPatterns = [
    /(https:\/\/zoom\.us\/j\/[^\s]+)/i,
    /(https:\/\/teams\.microsoft\.com\/[^\s]+)/i,
    /(https:\/\/meet\.google\.com\/[^\s]+)/i
  ];
  
  for (const pattern of urlPatterns) {
    const match = description.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}
