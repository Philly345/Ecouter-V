# ===========================================
# ZOOM MEETING FEATURE - ADDITIONAL SETUP
# ===========================================

# Option 1: Google Cloud Speech-to-Text (RECOMMENDED)
# Visit: https://console.cloud.google.com/apis/credentials
# Enable: Speech-to-Text API
# Create: Service Account Key
# Download: JSON key file
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_KEY_FILE=path/to/service-account-key.json
GOOGLE_CLOUD_SPEECH_API_KEY=your-speech-api-key

# Option 2: Azure Speech Services (ALTERNATIVE)
# Visit: https://portal.azure.com
# Create: Speech Service resource
AZURE_SPEECH_KEY=your-azure-speech-key
AZURE_SPEECH_REGION=your-region

# ===========================================
# ZOOM APP MARKETPLACE SETUP CHECKLIST
# ===========================================

# ✅ 1. OAuth Redirect URL (ADD THIS EXACT URL):
#      http://localhost:3001/api/zoom/callback

# ✅ 2. Required Scopes (ADD THESE):
#      - meeting:read
#      - meeting:write  
#      - user:read

# ✅ 3. App Type:
#      Select "User-managed" (as shown in your screenshot)

# ✅ 4. App Credentials (ALREADY CONFIGURED):
#      Client ID: b_eJ9aqdTqmBgJqHUVEurA
#      Client Secret: 3qh8NQ31pnJmPMyoh7iQcC4iPcw4lTiC

# ===========================================
# HOW TO USE THE FEATURE
# ===========================================

# 1. Visit: http://localhost:3001/zoom-meetings
# 2. Click "Connect to Zoom" (first time only)
# 3. Enter Meeting ID and join
# 4. Start recording and transcription
# 5. Generate AI summary when done
# 6. Save meeting notes to your account

# ===========================================
# FEATURES INCLUDED
# ===========================================

# ✅ OAuth Integration with Zoom
# ✅ Real-time Speech Transcription
# ✅ Speaker Identification & Diarization
# ✅ Live Meeting Dashboard
# ✅ AI-powered Summaries (using your Gemini API)
# ✅ Action Item Extraction
# ✅ Meeting Notes Storage
# ✅ Export & Save Functionality