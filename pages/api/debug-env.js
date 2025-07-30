export default function handler(req, res) {
  // Only allow in development or with a specific debug key for security
  const debugKey = req.query.debug;
  if (debugKey !== 'check123') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Check which environment variables are available
  const envCheck = {
    MONGODB_URI: !!process.env.MONGODB_URI,
    ASSEMBLYAI_API_KEY: !!process.env.ASSEMBLYAI_API_KEY,
    R2_ACCOUNT_ID: !!process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: !!process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: !!process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME: !!process.env.R2_BUCKET_NAME,
    R2_PUBLIC_URL: !!process.env.R2_PUBLIC_URL,
    JWT_SECRET: !!process.env.JWT_SECRET,
    GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
  };

  // Show first few characters of some values for verification
  const partialValues = {
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID ? process.env.R2_ACCOUNT_ID.substring(0, 4) + '...' : 'undefined',
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME || 'undefined',
    MONGODB_URI: process.env.MONGODB_URI ? 'mongodb+srv://...' : 'undefined',
  };

  res.status(200).json({
    message: 'Environment variables check',
    available: envCheck,
    partialValues,
    timestamp: new Date().toISOString()
  });
}
