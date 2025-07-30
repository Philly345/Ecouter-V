const {onRequest} = require('firebase-functions/v2/https');
const next = require('next');

// Configure Next.js
const nextjsServer = next({
  dev: false,
  dir: '../', // Point to the main directory where pages are located
});
const nextjsHandle = nextjsServer.getRequestHandler();

// Export the Firebase function for your Next.js app
exports.nextjsFunc = onRequest(
  {
    memory: '2GiB',
    timeoutSeconds: 3600, // 60 minutes for long transcriptions
    maxInstances: 10,
    region: 'us-central1',
    // Use environment variables from .env file
    env: [
      'MONGODB_URI',
      'ASSEMBLYAI_API_KEY',
      'GEMINI_API_KEY',
      'DEEPSEEK_API_KEY',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'GOOGLE_REDIRECT_URI',
      'JWT_SECRET',
      'R2_PUBLIC_URL',
      'R2_ACCESS_KEY_ID',
      'R2_SECRET_ACCESS_KEY',
      'R2_ACCOUNT_ID',
      'R2_BUCKET_NAME',
      'MYMEMORY_EMAIL',
      'SMTP_SERVER',
      'SMTP_PORT',
      'SMTP_LOGIN',
      'SMTP_PASSWORD',
      'SMTP_SENDER'
    ]
  },
  async (req, res) => {
    await nextjsServer.prepare();
    return nextjsHandle(req, res);
  }
);
