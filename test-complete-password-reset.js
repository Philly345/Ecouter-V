// Test the complete forgot password and reset password flow
console.log('🔐 Testing Complete Password Reset Flow...');

require('dotenv').config({ path: '.env.local' });

async function testPasswordResetFlow() {
  try {
    console.log('📧 Step 1: Request password reset...');
    
    // Step 1: Request password reset
    const forgotResponse = await fetch('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'phillyrick34@gmail.com'
      }),
    });

    const forgotData = await forgotResponse.json();
    console.log('Forgot password response:', forgotData);

    if (!forgotResponse.ok || !forgotData.success) {
      console.log('❌ Failed to request password reset');
      return;
    }

    console.log('✅ Password reset email sent successfully');
    console.log('');
    console.log('📱 Now check your Gmail for the password reset email');
    console.log('🔗 Click the reset link to test the reset password page');
    console.log('');
    console.log('🧪 You can also test the reset API directly:');
    console.log('');
    
    // For testing, let's generate a test token
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
    
    console.log('🧪 Test Token (for manual testing):');
    console.log(testToken);
    console.log('');
    console.log('🔗 Test URL:');
    console.log(`https://ecoutertranscribe.tech/reset-password?token=${testToken}`);
    console.log('');
    console.log('💡 Or test the API directly with:');
    console.log(`
POST http://localhost:3000/api/auth/reset-password
Content-Type: application/json

{
  "token": "${testToken}",
  "password": "newpassword123"
}
    `);

    console.log('');
    console.log('🎯 NEXT STEPS:');
    console.log('1. Check your Gmail for the password reset email');
    console.log('2. The email link should now point to ecoutertranscribe.tech');
    console.log('3. The reset token should work correctly');
    console.log('4. Test password reset with a new password');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('');
    console.log('🚨 Make sure your Next.js server is running with: npm run dev');
  }
}

testPasswordResetFlow();