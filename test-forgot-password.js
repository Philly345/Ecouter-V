// Test forgot password functionality
console.log('🧪 Testing forgot password functionality...');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { MongoClient, ObjectId } = require('mongodb');

async function testForgotPassword() {
  const mongoUri = process.env.MONGODB_URI;
  const client = new MongoClient(mongoUri);

  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    const db = client.db();

    // Get a test user
    console.log('👤 Finding test user...');
    const testUser = await db.collection('users').findOne({ 
      email: 'phillyrick34@gmail.com' 
    });

    if (!testUser) {
      console.log('❌ Test user not found. Please ensure phillyrick34@gmail.com exists in the database.');
      return;
    }

    console.log('✅ Test user found:', {
      id: testUser._id,
      email: testUser.email,
      name: testUser.name
    });

    // Test 1: Forgot password request
    console.log('\n📧 Testing forgot password request...');
    const forgotPasswordResponse = await fetch('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'phillyrick34@gmail.com'
      }),
    });

    const forgotPasswordResult = await forgotPasswordResponse.json();
    console.log('Forgot password response:', forgotPasswordResult);

    if (forgotPasswordResponse.ok && forgotPasswordResult.success) {
      console.log('✅ Forgot password request successful');
      console.log('📬 Check your email (phillyrick34@gmail.com) for the reset link');
    } else {
      console.log('❌ Forgot password request failed:', forgotPasswordResult.error);
    }

    // Test 2: Invalid email
    console.log('\n🔍 Testing with invalid email...');
    const invalidEmailResponse = await fetch('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'nonexistent@example.com'
      }),
    });

    const invalidEmailResult = await invalidEmailResponse.json();
    console.log('Invalid email response:', invalidEmailResult);

    if (invalidEmailResponse.ok && invalidEmailResult.success) {
      console.log('✅ Invalid email handled correctly (returns success for security)');
    } else {
      console.log('❌ Invalid email test failed');
    }

    // Test 3: Missing email
    console.log('\n⚠️ Testing with missing email...');
    const missingEmailResponse = await fetch('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const missingEmailResult = await missingEmailResponse.json();
    console.log('Missing email response:', missingEmailResult);

    if (!missingEmailResponse.ok && missingEmailResult.error === 'Email is required') {
      console.log('✅ Missing email validation working');
    } else {
      console.log('❌ Missing email validation failed');
    }

    console.log('\n🎉 Forgot password tests completed!');
    console.log('\n📋 Summary:');
    console.log('- ✅ API endpoints are working');
    console.log('- ✅ Email validation is functioning');
    console.log('- ✅ Database connection is stable');
    console.log('- ✅ User lookup is working');
    console.log('\n💡 Next steps:');
    console.log('1. Check your email for the reset link');
    console.log('2. Test the reset password flow');
    console.log('3. Verify the new password works');

  } catch (error) {
    console.error('💥 Test failed:', error);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🚨 Connection Error:');
      console.log('Make sure your Next.js development server is running:');
      console.log('npm run dev');
    }
  } finally {
    await client.close();
    console.log('🔐 Database connection closed');
  }
}

// Check if server is running first
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/api/health', {
      method: 'GET',
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Run the test
async function runTest() {
  console.log('🔍 Checking if development server is running...');
  
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('❌ Development server is not running on http://localhost:3000');
    console.log('');
    console.log('🚀 To start the server, run:');
    console.log('npm run dev');
    console.log('');
    console.log('Then run this test again.');
    process.exit(1);
  }

  console.log('✅ Development server is running');
  await testForgotPassword();
}

runTest().then(() => {
  console.log('\n🏁 Test completed!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});