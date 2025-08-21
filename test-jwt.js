// Test JWT token to see what user ID is being used
require('dotenv').config({ path: '.env.local' });
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Create a test token like the login would
const testUserId = '688a515c0cb49c558609f783'; // The user that should have data
const testPayload = {
  userId: testUserId,
  email: 'lowkeyphilly17@gmail.com',
  name: 'Philbert Wanjiku'
};

const token = jwt.sign(testPayload, JWT_SECRET, { expiresIn: '7d' });
console.log('🔑 Generated test token:', token);

// Decode it back
const decoded = jwt.verify(token, JWT_SECRET);
console.log('🔍 Decoded token payload:', decoded);

console.log('✅ If the user is logged in with this email, the userId in JWT should be:', testUserId);
console.log('📝 Check localStorage in browser for the actual token and decode it');

console.log('\n🧪 To test this in browser console:');
console.log('1. Open browser console on the dashboard');
console.log('2. Run: localStorage.getItem("token")');
console.log('3. Copy the token and decode it at jwt.io');
console.log('4. Check if the userId matches:', testUserId);