// Slack/Teams Bot Integration API for easy sharing
import { connectDB } from '../../../lib/mongodb';
import { getTokenFromRequest, verifyToken } from '../../../utils/auth';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  try {
    // Verify authentication
    const token = getTokenFromRequest(req);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { db } = await connectDB();

    if (req.method === 'POST') {
      const { action, platform, fileId, channelId, message, botToken } = req.body;

      if (action === 'share') {
        return await shareToChannel(req, res, decoded, db);
      } else if (action === 'configure') {
        return await configureBotIntegration(req, res, decoded, db);
      } else if (action === 'webhook') {
        return await handleBotWebhook(req, res, decoded, db);
      }

    } else if (req.method === 'GET') {
      // Get bot integration status
      const user = await db.collection('users').findOne({ email: decoded.email });
      
      res.status(200).json({
        success: true,
        integrations: {
          slack: user.slackIntegration || null,
          teams: user.teamsIntegration || null
        }
      });

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Bot integration error:', error);
    res.status(500).json({ 
      error: 'Bot integration failed',
      details: error.message 
    });
  }
}

// Share transcript/analytics to Slack/Teams channel
async function shareToChannel(req, res, decoded, db) {
  const { platform, fileId, channelId, message, includeAnalytics = false } = req.body;

  if (!platform || !fileId || !channelId) {
    return res.status(400).json({ error: 'platform, fileId, and channelId are required' });
  }

  // Get file data
  const file = await db.collection('files').findOne({ 
    _id: new ObjectId(fileId),
    userId: decoded.userId 
  });

  if (!file) {
    return res.status(404).json({ error: 'File not found' });
  }

  // Get user's bot integration
  const user = await db.collection('users').findOne({ email: decoded.email });
  const integration = platform === 'slack' ? user.slackIntegration : user.teamsIntegration;

  if (!integration || !integration.isActive) {
    return res.status(400).json({ error: `${platform} integration not configured` });
  }

  try {
    let shareResult;
    
    if (platform === 'slack') {
      shareResult = await shareToSlack(integration, file, channelId, message, includeAnalytics);
    } else if (platform === 'teams') {
      shareResult = await shareToTeams(integration, file, channelId, message, includeAnalytics);
    }

    // Log the share activity
    await db.collection('share_logs').insertOne({
      userId: decoded.userId,
      fileId: new ObjectId(fileId),
      platform,
      channelId,
      sharedAt: new Date(),
      includeAnalytics,
      messageId: shareResult.messageId
    });

    res.status(200).json({
      success: true,
      message: `Successfully shared to ${platform}`,
      messageId: shareResult.messageId,
      channelUrl: shareResult.channelUrl
    });

  } catch (error) {
    console.error(`Error sharing to ${platform}:`, error);
    res.status(500).json({ error: `Failed to share to ${platform}` });
  }
}

// Configure bot integration
async function configureBotIntegration(req, res, decoded, db) {
  const { platform, botToken, webhookUrl, settings = {} } = req.body;

  if (!platform || !botToken) {
    return res.status(400).json({ error: 'platform and botToken are required' });
  }

  // Verify bot token by making a test API call
  const isValid = await verifyBotToken(platform, botToken);
  
  if (!isValid) {
    return res.status(400).json({ error: 'Invalid bot token' });
  }

  const integrationData = {
    botToken,
    webhookUrl,
    settings: {
      autoShare: settings.autoShare || false,
      defaultChannel: settings.defaultChannel || null,
      includeAnalyticsByDefault: settings.includeAnalyticsByDefault || false,
      notifyOnComplete: settings.notifyOnComplete || false,
      ...settings
    },
    connectedAt: new Date(),
    isActive: true
  };

  const updateField = platform === 'slack' ? 'slackIntegration' : 'teamsIntegration';

  await db.collection('users').updateOne(
    { email: decoded.email },
    { $set: { [updateField]: integrationData } }
  );

  res.status(200).json({
    success: true,
    message: `${platform} integration configured successfully`
  });
}

// Handle incoming webhooks from Slack/Teams
async function handleBotWebhook(req, res, decoded, db) {
  const { platform, event, data } = req.body;

  // Handle different webhook events
  switch (event) {
    case 'message':
      await handleBotMessage(platform, data, decoded, db);
      break;
    case 'command':
      await handleBotCommand(platform, data, decoded, db);
      break;
    default:
      console.log(`Unhandled webhook event: ${event}`);
  }

  res.status(200).json({ success: true });
}

// Slack integration functions
async function shareToSlack(integration, file, channelId, customMessage, includeAnalytics) {
  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `📄 Transcript: ${file.name}`
      }
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Duration:* ${Math.ceil(file.duration / 60)} minutes`
        },
        {
          type: 'mrkdwn',
          text: `*Language:* ${file.language || 'English'}`
        },
        {
          type: 'mrkdwn',
          text: `*Created:* ${new Date(file.createdAt).toLocaleDateString()}`
        },
        {
          type: 'mrkdwn',
          text: `*Status:* ${file.status}`
        }
      ]
    }
  ];

  if (customMessage) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: customMessage
      }
    });
  }

  // Add summary if available
  if (file.summary) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Summary:*\n${file.summary.substring(0, 500)}${file.summary.length > 500 ? '...' : ''}`
      }
    });
  }

  // Add analytics if requested and available
  if (includeAnalytics && file.analytics) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Meeting Score:* ${file.analytics.overallScore}/100\n*Effectiveness:* ${file.analytics.effectiveness.effectivenessScore}/100\n*Engagement:* ${Math.round(file.analytics.speakingAnalysis.engagementLevel)}%`
      }
    });
  }

  // Add action buttons
  blocks.push({
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'View Full Transcript'
        },
        url: `${process.env.NEXTAUTH_URL}/files/${file._id}`,
        action_id: 'view_transcript'
      },
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Download'
        },
        url: `${process.env.NEXTAUTH_URL}/api/files/download/${file._id}`,
        action_id: 'download_transcript'
      }
    ]
  });

  const response = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${integration.botToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      channel: channelId,
      blocks: blocks,
      text: `Transcript: ${file.name}` // Fallback text
    })
  });

  const result = await response.json();
  
  if (!result.ok) {
    throw new Error(`Slack API error: ${result.error}`);
  }

  return {
    messageId: result.ts,
    channelUrl: `https://slack.com/app_redirect?channel=${channelId}`
  };
}

// Teams integration functions
async function shareToTeams(integration, file, channelId, customMessage, includeAnalytics) {
  // Microsoft Teams message card format
  const card = {
    '@type': 'MessageCard',
    '@context': 'https://schema.org/extensions',
    summary: `Transcript: ${file.name}`,
    themeColor: '0078D4',
    sections: [
      {
        activityTitle: `📄 Transcript: ${file.name}`,
        activitySubtitle: `Duration: ${Math.ceil(file.duration / 60)} minutes | Language: ${file.language || 'English'}`,
        facts: [
          {
            name: 'Created',
            value: new Date(file.createdAt).toLocaleDateString()
          },
          {
            name: 'Status',
            value: file.status
          }
        ]
      }
    ],
    potentialAction: [
      {
        '@type': 'OpenUri',
        name: 'View Full Transcript',
        targets: [
          {
            os: 'default',
            uri: `${process.env.NEXTAUTH_URL}/files/${file._id}`
          }
        ]
      }
    ]
  };

  if (customMessage) {
    card.sections.push({
      text: customMessage
    });
  }

  if (file.summary) {
    card.sections.push({
      activityTitle: 'Summary',
      text: file.summary.substring(0, 500) + (file.summary.length > 500 ? '...' : '')
    });
  }

  if (includeAnalytics && file.analytics) {
    card.sections.push({
      activityTitle: 'Meeting Analytics',
      facts: [
        {
          name: 'Overall Score',
          value: `${file.analytics.overallScore}/100`
        },
        {
          name: 'Effectiveness',
          value: `${file.analytics.effectiveness.effectivenessScore}/100`
        },
        {
          name: 'Engagement',
          value: `${Math.round(file.analytics.speakingAnalysis.engagementLevel)}%`
        }
      ]
    });
  }

  const response = await fetch(integration.webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(card)
  });

  if (!response.ok) {
    throw new Error(`Teams webhook error: ${response.status}`);
  }

  return {
    messageId: `teams_${Date.now()}`,
    channelUrl: channelId
  };
}

// Helper functions
async function verifyBotToken(platform, token) {
  try {
    if (platform === 'slack') {
      const response = await fetch('https://slack.com/api/auth.test', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      return result.ok;
    } else if (platform === 'teams') {
      // For Teams, we'd verify the webhook URL is accessible
      return token.startsWith('https://');
    }
    return false;
  } catch (error) {
    return false;
  }
}

async function handleBotMessage(platform, data, decoded, db) {
  // Handle incoming messages from bots
  // This could include commands like "/transcript search keyword"
  console.log(`Received ${platform} message:`, data);
}

async function handleBotCommand(platform, data, decoded, db) {
  // Handle slash commands or bot commands
  // This could include commands like "/ecouter list" or "/ecouter share file123"
  console.log(`Received ${platform} command:`, data);
}
