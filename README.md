🎧 Ecouter Transcribe: Effortless AI-Powered Transcription
Ecouter Transcribe is a production-ready web application that transforms your audio and video files into accurate, insightful transcripts with the power of AI. Designed for a seamless user experience, it's your go-to solution for converting spoken content into valuable text.
✨ Features
 * Stunning User Interface: A modern homepage welcomes you with captivating animated black and white bubbles, setting the stage for a sophisticated experience.
 * Flexible Authentication: Securely log in using your Google account or a traditional email and password combination.
 * Intuitive Dashboard: Gain a clear overview of your transcription activity with a user-friendly dashboard featuring analytics, file status tracking, and storage insights.
 * Effortless Uploads & Transcription: Easily upload your audio and video files and let Ecouter Transcribe handle the rest.
 * AI-Powered Insights: Beyond just transcription, leverage Google Gemini for intelligent summaries and key insights from your transcripts.
 * Pinpoint Accuracy: Powered by AssemblyAI, Ecouter Transcribe delivers highly accurate speech-to-text conversion.
 * Robust Cloud Storage: Your uploaded files are securely stored using R2 storage.
 * Responsive & Compact Design: Enjoy a streamlined and efficient interface that looks great on any device, even at 80% zoom.
🚀 Get Started
Follow these simple steps to get Ecouter Transcribe up and running:
 * Clone the Repository & Install Dependencies:
   git clone [your-repo-link]
cd ecouter-transcribe
npm install

 * Configure API Keys: Add your essential API keys to a .env.local file. Refer to the example provided in the repository for guidance.
 * Run Locally:
   npm run dev

   Your application will be accessible at http://localhost:3000.
 * Deploy to Vercel: For production readiness, deploy your application to Vercel.
🔑 Google OAuth Redirect URIs
Ensure you configure your Google OAuth credentials with the correct redirect URIs:
 * Local Development: http://localhost:3000/api/auth/callback/google
 * Production Deployment: https://<your-vercel-domain>/api/auth/callback/google
📁 Project Structure
 * pages/: Contains all React pages, defining the user-facing interface.
 * api/: Houses Vercel serverless functions, handling backend logic and API requests.
 * public/: Stores static assets such as images and fonts.
💻 Tech Stack
Ecouter Transcribe is built with a powerful and modern tech stack:
 * Frontend: React & Tailwind CSS
 * Backend: Vercel Serverless (Node.js)
 * AI & Speech-to-Text: AssemblyAI & Google Gemini
 * Storage: R2 Storage
 * Authentication: JWT (JSON Web Tokens) for secure session handling
📝 License
This project is open-source and available under the MIT License.
