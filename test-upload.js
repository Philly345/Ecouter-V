require('dotenv').config({ path: '.env.local' });
// Simple test script to debug upload issues
console.log('Testing upload functionality...');

// Test environment variables first
const envVars = [
  'MONGODB_URI',
  'ASSEMBLYAI_API_KEY', 
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME',
  'R2_PUBLIC_URL'
];

console.log('Environment variables check:');
envVars.forEach(varName => {
  const value = process.env[varName];
  console.log(`${varName}: ${value ? 'SET' : 'MISSING'} ${value ? `(${value.substring(0, 10)}...)` : ''}`);
});

// Test MongoDB connection
async function testMongoDB() {
  try {
    const { connectDB } = require('./lib/mongodb.js');
    const { db } = await connectDB();
    console.log('✅ MongoDB connection successful');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    return false;
  }
}

// Test R2 storage
async function testR2() {
  try {
    const { uploadFile } = require('./utils/storage.js');
    // Create a small test buffer
    const testBuffer = Buffer.from('test file content');
    const result = await uploadFile(testBuffer, 'test/test.txt', 'text/plain');
    console.log('✅ R2 storage test:', result);
    return result.success;
  } catch (error) {
    console.error('❌ R2 storage test failed:', error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('\n=== Running Connection Tests ===');
  
  const mongoOk = await testMongoDB();
  const r2Ok = await testR2();
  
  console.log('\n=== Test Results ===');
  console.log(`MongoDB: ${mongoOk ? '✅' : '❌'}`);
  console.log(`R2 Storage: ${r2Ok ? '✅' : '❌'}`);
  
  if (mongoOk && r2Ok) {
    console.log('\n🎉 All tests passed! Upload should work.');
  } else {
    console.log('\n❌ Some tests failed. This might explain the upload issues.');
  }
}

runTests().catch(console.error);
