// Test the specific forgot password endpoint with full console monitoring
console.log('🧪 Testing Forgot Password API with Console Monitoring...');

require('dotenv').config({ path: '.env.local' });

async function testForgotPasswordAPI() {
  try {
    console.log('📧 Making request to forgot password API...');
    console.log('📍 Watch your Next.js terminal for environment variable logs');
    console.log('');

    const response = await fetch('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'phillyrick34@gmail.com'
      }),
    });

    console.log('📊 Response Status:', response.status);
    const data = await response.json();
    console.log('📋 Response Data:', data);

    if (response.ok && data.success) {
      console.log('');
      console.log('✅ API call successful!');
      console.log('');
      console.log('🔍 Now check your Next.js server terminal for:');
      console.log('1. "Processing forgot password request for: phillyrick34@gmail.com"');
      console.log('2. Environment variable checks (JWT_SECRET, SMTP_SERVER, etc.)');
      console.log('3. "User found" or "User not found"');
      console.log('4. "Reset token generated"');
      console.log('5. "SMTP connection verified"');
      console.log('6. "Password reset email sent successfully"');
      console.log('');
      console.log('📧 If you see "Message ID:" and "SMTP Response:", the email was sent!');
      console.log('📱 Check your Gmail inbox for the password reset email');
    } else {
      console.log('❌ API call failed');
      console.log('Check your Next.js server terminal for error messages');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('');
    console.log('🚨 Make sure your Next.js server is running with: npm run dev');
  }
}

testForgotPasswordAPI();