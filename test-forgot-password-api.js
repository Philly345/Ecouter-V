// Test the actual forgot password API endpoint
console.log('🧪 Testing Forgot Password API Endpoint...');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function testForgotPasswordAPI() {
  try {
    console.log('🚀 Starting Next.js dev server check...');
    
    // First check if server is running
    let serverRunning = false;
    try {
      const healthCheck = await fetch('http://localhost:3000/api/auth/forgot-password', {
        method: 'GET' // Should return 405 Method Not Allowed
      });
      serverRunning = true;
      console.log('✅ Next.js server is running');
    } catch (error) {
      console.log('❌ Next.js server is not running');
      console.log('💡 Please start it with: npm run dev');
      return;
    }

    // Test the forgot password endpoint
    console.log('📧 Testing forgot password request...');
    
    const response = await fetch('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'phillyrick34@gmail.com'
      }),
    });

    const result = await response.json();
    
    console.log('📋 API Response:');
    console.log('Status Code:', response.status);
    console.log('Response Body:', JSON.stringify(result, null, 2));
    
    if (response.ok && result.success) {
      console.log('✅ Forgot password request successful!');
      console.log('📧 Password reset email should be sent to: phillyrick34@gmail.com');
      console.log('');
      console.log('🔍 Email Delivery Checklist:');
      console.log('1. ✓ Check Gmail SPAM/JUNK folder');
      console.log('2. ✓ Check Gmail PROMOTIONS tab');
      console.log('3. ✓ Search for "Reset" or "Ecouter" in Gmail');
      console.log('4. ✓ Check if Gmail is filtering emails from no-reply@ecouter.systems');
      console.log('5. ✓ Look for emails from Brevo/Sendinblue');
      console.log('');
      console.log('📱 Gmail Tips:');
      console.log('- Open Gmail on desktop (better spam folder access)');
      console.log('- Check "All Mail" folder');
      console.log('- Look for sender: no-reply@ecouter.systems');
      
      // Try with support email too
      console.log('');
      console.log('🔄 Testing with support email...');
      const supportResponse = await fetch('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'ecouter.transcribe@gmail.com'
        }),
      });

      const supportResult = await supportResponse.json();
      console.log('Support email response:', supportResult);
      
    } else {
      console.log('❌ Forgot password request failed');
      console.log('Error:', result.error || 'Unknown error');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('');
      console.log('🚨 Server Connection Error:');
      console.log('Your Next.js development server is not running.');
      console.log('');
      console.log('🚀 To start the server:');
      console.log('1. Open a new terminal');
      console.log('2. Navigate to your project folder');
      console.log('3. Run: npm run dev');
      console.log('4. Wait for "ready - started server on 0.0.0.0:3000"');
      console.log('5. Then run this test again');
    }
  }
}

testForgotPasswordAPI().then(() => {
  console.log('');
  console.log('🏁 Forgot password API test completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});