# Ecouter Transcribe

Production-ready AI-powered transcription web app.

## Features
- Modern homepage with animated black & white bubbles
- Google OAuth and email/password authentication
- Dashboard with analytics, file status, storage
- Upload and transcribe audio/video files
- AI-powered transcript summaries and insights via Google Gemini
- AssemblyAI for accurate speech-to-text transcription
- R2 storage for uploads
- Responsive, compact UI (80% zoomed-out look)

## Setup
1. Clone repo and install dependencies:
   ```bash
   npm install
   ```
2. Add your API keys to `.env.local` (see example in repo)
3. Run locally:
   ```bash
   npm run dev
   ```
4. Deploy to Vercel for production

## Google OAuth Redirect URI
- Local: `http://localhost:3000/api/auth/callback/google`
- Production: `https://<your-vercel-domain>/api/auth/callback/google`

## Folder Structure
- `pages/` - React pages
- `api/` - Vercel serverless functions
- `public/` - Static assets

## Tech Stack
- React, Tailwind CSS
- Vercel serverless (Node.js)
- AssemblyAI, Gemini AI
- R2 storage
- JWT session handling

## License
MIT
