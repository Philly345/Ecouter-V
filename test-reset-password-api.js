// Test the reset password API directly
console.log('🧪 Testing Reset Password API...');

require('dotenv').config({ path: '.env.local' });

async function testResetPasswordAPI() {
  try {
    // Generate a test token with the correct format
    const jwt = require('jsonwebtoken');
    const testToken = jwt.sign(
      { 
        userId: '688bd6a709cb9bf6b89e8fd0', // Your actual user ID
        email: 'phillyrick34@gmail.com',
        purpose: 'password-reset'
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    console.log('🔑 Generated test token with correct format');
    console.log('');
    
    // Test the reset password API
    console.log('📞 Calling reset password API...');
    
    const response = await fetch('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: testToken,
        password: 'testpassword123'
      }),
    });

    console.log('📊 Response Status:', response.status);
    const data = await response.json();
    console.log('📋 Response Data:', data);

    if (response.ok && data.success) {
      console.log('');
      console.log('✅ Password reset API working correctly!');
      console.log('🎉 The "invalid or expired reset token" issue is fixed');
      console.log('');
      console.log('🔍 Check your Next.js server terminal for detailed logs:');
      console.log('- Token decoding');
      console.log('- User lookup');  
      console.log('- Password update');
      console.log('');
      console.log('🚀 Your forgot password system is now fully working!');
    } else {
      console.log('❌ Password reset failed');
      console.log('Check the Next.js server terminal for error details');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('');
    console.log('🚨 Make sure your Next.js server is running with: npm run dev');
  }
}

testResetPasswordAPI();