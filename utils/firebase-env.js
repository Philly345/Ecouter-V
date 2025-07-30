// Firebase environment variables helper
const functions = require('firebase-functions');

// Helper function to get environment variables from Firebase config
function getEnvVar(path, fallback = null) {
  if (process.env.NODE_ENV === 'development') {
    // In development, use process.env (from .env.local)
    const envMap = {
      'mongodb.uri': process.env.MONGODB_URI,
      'assemblyai.api_key': process.env.ASSEMBLYAI_API_KEY,
      'gemini.api_key': process.env.GEMINI_API_KEY,
      'deepseek.api_key': process.env.DEEPSEEK_API_KEY,
      'google.client_id': process.env.GOOGLE_CLIENT_ID,
      'google.client_secret': process.env.GOOGLE_CLIENT_SECRET,
      'google.redirect_uri': process.env.GOOGLE_REDIRECT_URI,
      'jwt.secret': process.env.JWT_SECRET,
      'r2.public_url': process.env.R2_PUBLIC_URL,
      'r2.access_key_id': process.env.R2_ACCESS_KEY_ID,
      'r2.secret_access_key': process.env.R2_SECRET_ACCESS_KEY,
      'r2.account_id': process.env.R2_ACCOUNT_ID,
      'r2.bucket_name': process.env.R2_BUCKET_NAME,
      'smtp.server': process.env.SMTP_SERVER,
      'smtp.port': process.env.SMTP_PORT,
      'smtp.login': process.env.SMTP_LOGIN,
      'smtp.password': process.env.SMTP_PASSWORD,
      'smtp.sender': process.env.SMTP_SENDER,
      'mymemory.email': process.env.MYMEMORY_EMAIL,
    };
    return envMap[path] || fallback;
  } else {
    // In production, use Firebase functions config
    const config = functions.config();
    const parts = path.split('.');
    let value = config;
    for (const part of parts) {
      value = value?.[part];
    }
    return value || fallback;
  }
}

module.exports = { getEnvVar };
