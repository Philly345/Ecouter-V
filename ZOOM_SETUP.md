# Zoom Meeting Integration Setup Guide

## 📋 Required Zoom App Configuration

### 1. App Credentials (From Zoom Marketplace)
```
Client ID: b_eJ9aqdTqmBgJq... (get full value from your app)
Client Secret: (get from App Credentials section)
```

### 2. Required Scopes (Add these in Zoom App > Scopes)
Go to your Zoom app dashboard and add these scopes:

**Meeting Scopes:**
- `meeting:read` - Read meeting information
- `meeting:write` - Create and manage meetings
- `recording:read` - Access meeting recordings
- `recording:write` - Manage recordings

**User Scopes:**
- `user:read` - Read user information
- `user:write` - Manage user data

**Webhook Scopes:**
- `meeting:participant_joined` - Detect when participants join
- `meeting:participant_left` - Detect when participants leave
- `meeting:started` - Meeting start events
- `meeting:ended` - Meeting end events
- `recording:completed` - Recording completion events

### 3. Redirect URLs (Add in App Settings)
Add these redirect URLs in your Zoom app:
```
http://localhost:3001/api/zoom/callback
https://yourdomain.com/api/zoom/callback
```

### 4. Event Subscriptions (Webhooks)
Enable these event subscriptions:
- Meeting Started
- Meeting Ended
- Participant Joined Meeting
- Participant Left Meeting
- Recording Completed

### 5. App Features to Enable
In your Zoom app settings, enable:
- ✅ Meeting SDK
- ✅ Webhooks
- ✅ OAuth
- ✅ Recording

## 🔑 Environment Variables Needed

Add these to your `.env.local` file:

```env
# Zoom Integration
ZOOM_CLIENT_ID=your_full_client_id_here
ZOOM_CLIENT_SECRET=your_client_secret_here
ZOOM_WEBHOOK_SECRET=your_webhook_secret_here
ZOOM_REDIRECT_URI=http://localhost:3001/api/zoom/callback

# Speech Recognition APIs (Choose one or multiple)
GOOGLE_CLOUD_PROJECT_ID=your_google_project_id
GOOGLE_CLOUD_KEY_FILE=path_to_service_account_json

# Alternative: Azure Speech
AZURE_SPEECH_KEY=your_azure_speech_key
AZURE_SPEECH_REGION=your_azure_region

# Alternative: AWS Transcribe
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
```

## 📝 What Information to Send Me

Please provide:

1. **Full Zoom Client ID** (complete the partial one: b_eJ9aqdTqmBgJq...)
2. **Zoom Client Secret** (from your app credentials)
3. **Which Speech-to-Text service you prefer:**
   - Google Cloud Speech-to-Text (recommended)
   - Azure Speech Services
   - AWS Transcribe
   - Or I can set up multiple with fallbacks

4. **Your preferred deployment domain** (for production redirect URLs)

## 🚀 Next Steps After Setup

1. I'll configure the OAuth flow
2. Set up real-time audio processing
3. Implement speaker identification
4. Create meeting summaries and notes
5. Add automatic meeting joining capabilities

## 🔧 Technical Implementation

The system will work like this:

```
📱 User Interface → 🔐 Zoom OAuth → 📹 Join Meeting → 🎙️ Audio Capture → 
📝 Speech-to-Text → 👥 Speaker Detection → 🤖 AI Summary → 💾 Save Notes
```

Ready to proceed once you provide the credentials!