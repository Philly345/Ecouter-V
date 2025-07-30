# Ecouter Transcribe - Complete Setup Guide

A production-ready AI-powered transcription web application built with React, Next.js, Tailwind CSS, and Vercel serverless functions.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
The `.env.local` file is already configured with your API keys. Make sure these services are set up:

- **AssemblyAI**: For audio/video transcription
- **Google Gemini**: For AI summaries and topic detection  
- **Google OAuth**: For authentication
- **Cloudflare R2**: For file storage
- **SMTP/Brevo**: For email sending

### 3. Google OAuth Setup
Add this redirect URI to your Google OAuth app:
- **Local Development**: `http://localhost:3000/api/auth/callback/google`
- **Production**: `https://your-vercel-domain.vercel.app/api/auth/callback/google`

### 4. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

### 5. Deploy to Vercel
```bash
npm run build
```

Then deploy to Vercel. Make sure to add all environment variables to your Vercel dashboard.

## 🎯 Features

### Frontend
- **Modern UI**: Black theme with animated floating bubbles
- **Responsive Design**: 80% zoom effect for compact look
- **Authentication**: Google OAuth + email/password
- **File Upload**: Drag & drop with progress tracking
- **Dashboard**: Analytics, recent files, storage usage
- **File Management**: Recent, Processing, Completed, Storage pages

### Backend
- **Transcription**: AssemblyAI integration with speaker ID, timestamps
- **AI Summary**: Google Gemini for summaries and topic detection
- **File Storage**: Cloudflare R2 for scalable storage
- **Email**: Password reset emails via SMTP
- **Database**: JSON file-based storage (easily replaceable)

### Security
- **JWT Authentication**: Secure token-based sessions
- **Password Hashing**: bcrypt for secure password storage
- **File Validation**: Type and size validation
- **CORS Protection**: Proper API security

## 📁 Project Structure

```
├── pages/                 # Next.js pages
│   ├── home.js           # Landing page with animated UI
│   ├── signup.js         # User registration
│   ├── login.js          # User login
│   ├── dashboard.js      # Main dashboard
│   ├── upload.js         # File upload with settings
│   └── files/            # File management pages
├── api/                  # Serverless functions
│   ├── auth/             # Authentication endpoints
│   ├── transcribe.js     # Main transcription API
│   ├── files/            # File management APIs
│   └── dashboard.js      # Dashboard data API
├── components/           # Reusable React components
├── utils/                # Utility functions
├── styles/               # CSS and Tailwind config
└── data/                 # JSON database files
```

## 🔧 Configuration

### Environment Variables
All required environment variables are in `.env.local`:

```bash
# AI Services
ASSEMBLYAI_API_KEY=your-key
GEMINI_API_KEY=your-key

# Authentication
GOOGLE_CLIENT_ID=your-id
GOOGLE_CLIENT_SECRET=your-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/callback/google
JWT_SECRET=your-secret

# Storage
R2_PUBLIC_URL=your-r2-url
R2_ACCESS_KEY_ID=your-key
R2_SECRET_ACCESS_KEY=your-secret
R2_ACCOUNT_ID=your-account
R2_BUCKET_NAME=your-bucket

# Email
SMTP_SERVER=your-smtp
SMTP_PORT=587
SMTP_LOGIN=your-login
SMTP_PASSWORD=your-password
SMTP_SENDER=your-email
```

### Supported File Formats
- **Audio**: MP3, WAV, M4A, FLAC, AAC
- **Video**: MP4, MOV, AVI, MKV, WMV
- **Limits**: 500MB max, 4 hours duration

## 🎨 UI Features

### Compact Design
- Global 80% zoom effect for desktop
- Smaller fonts and spacing
- Mobile-responsive scaling

### Animated Elements
- Floating black & white bubbles
- Gradient text animations
- Typing subtitle effect
- Smooth hover transitions

### Dark Theme
- Pure black background
- White/gray text and elements
- Subtle transparency effects
- Glowing button animations

## 🔄 Workflow

1. **User Signs Up**: Email/password or Google OAuth
2. **Upload File**: Drag & drop with transcription settings
3. **Processing**: File uploaded to R2, sent to AssemblyAI
4. **AI Analysis**: Transcript sent to Gemini for summary
5. **Results**: User can view and download completed transcriptions

## 📊 Dashboard Features

- **Analytics**: Total transcriptions, minutes used, storage
- **Recent Files**: Latest uploads with status
- **Activity Feed**: Recent transcription activity
- **Storage Bar**: Visual storage usage indicator
- **Quick Actions**: Fast access to common tasks

## 🛠 Development

### Adding New Features
1. Create new page in `pages/`
2. Add corresponding API route in `api/`
3. Update navigation in `Sidebar.js`
4. Add any new components in `components/`

### Database Migration
Currently using JSON files. To migrate to a real database:
1. Replace `utils/database.js` with your DB client
2. Update all API routes to use new database functions
3. Run migration scripts to transfer existing data

## 🚢 Deployment

### Vercel (Recommended)
1. Connect your GitHub repo to Vercel
2. Add all environment variables
3. Deploy automatically on push

### Production Checklist
- [ ] Update `GOOGLE_REDIRECT_URI` to production URL
- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Test all OAuth flows
- [ ] Verify file upload/transcription
- [ ] Check email sending
- [ ] Monitor error logs

## 🤝 Support

For issues or questions:
1. Check the console for error messages
2. Verify all environment variables are set
3. Test individual API endpoints
4. Check service status (AssemblyAI, Google, R2)

## 📝 License

MIT License - feel free to use for commercial projects.

---

**Your complete AI transcription platform is ready!** 🎉

The app includes everything you requested:
- Modern UI with floating bubbles and compact design
- Full authentication with Google OAuth
- File upload with drag & drop
- Real-time transcription progress
- AI-powered summaries and topic detection
- Complete file management system
- Dashboard analytics
- Production-ready deployment

Visit `/home` to see the landing page, then sign up to access the full application!
