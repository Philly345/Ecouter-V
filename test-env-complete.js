import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

console.log('=== COMPLETE ENVIRONMENT TEST ===\n');

// Test all required environment variables
const requiredVars = [
  'MONGODB_URI',
  'ASSEMBLYAI_API_KEY',
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME',
  'R2_PUBLIC_URL',
  'JWT_SECRET',
  'GEMINI_API_KEY'
];

console.log('1. Environment Variables Check:');
let missingVars = [];
requiredVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅ SET' : '❌ MISSING';
  const preview = value ? `(${value.substring(0, 15)}...)` : '';
  console.log(`   ${varName}: ${status} ${preview}`);
  if (!value) missingVars.push(varName);
});

if (missingVars.length > 0) {
  console.log(`\n❌ Missing variables: ${missingVars.join(', ')}`);
  console.log('Please check your .env.local file\n');
} else {
  console.log('\n✅ All environment variables are set\n');
}

// Test MongoDB connection
async function testMongoDB() {
  try {
    const { connectDB } = await import('./lib/mongodb.js');
    const { db } = await connectDB();
    console.log('2. MongoDB Connection: ✅ SUCCESS');
    return true;
  } catch (error) {
    console.log('2. MongoDB Connection: ❌ FAILED');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Test R2 storage
async function testR2() {
  try {
    const { uploadFile, deleteFile } = await import('./utils/storage.js');
    
    // Create a small test buffer
    const testBuffer = Buffer.from('test file content for upload verification');
    const testFileName = `test/env-test-${Date.now()}.txt`;
    
    console.log('3. R2 Storage Test:');
    console.log('   Uploading test file...');
    
    const uploadResult = await uploadFile(testBuffer, testFileName, 'text/plain');
    
    if (uploadResult.success) {
      console.log('   ✅ Upload successful');
      console.log(`   File URL: ${uploadResult.url}`);
      
      // Clean up test file
      console.log('   Cleaning up test file...');
      const deleteResult = await deleteFile(testFileName);
      if (deleteResult.success) {
        console.log('   ✅ Cleanup successful');
      } else {
        console.log('   ⚠️ Cleanup failed (not critical)');
      }
      
      return true;
    } else {
      console.log('   ❌ Upload failed');
      console.log(`   Error: ${uploadResult.error}`);
      return false;
    }
  } catch (error) {
    console.log('3. R2 Storage Test: ❌ FAILED');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Test AssemblyAI API key
async function testAssemblyAI() {
  try {
    console.log('4. AssemblyAI API Test:');
    
    const response = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ASSEMBLYAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: 'https://example.com/test.mp3' // This will fail but test auth
      }),
    });
    
    const data = await response.json();
    
    if (response.status === 400 && data.error && data.error.includes('audio_url')) {
      console.log('   ✅ API key is valid (got expected validation error)');
      return true;
    } else if (response.status === 401) {
      console.log('   ❌ API key is invalid or missing');
      return false;
    } else {
      console.log('   ✅ API key appears valid');
      return true;
    }
  } catch (error) {
    console.log('4. AssemblyAI API Test: ❌ FAILED');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('Running comprehensive environment tests...\n');
  
  const mongoOk = await testMongoDB();
  const r2Ok = await testR2();
  const assemblyOk = await testAssemblyAI();
  
  console.log('\n=== TEST RESULTS SUMMARY ===');
  console.log(`Environment Variables: ${missingVars.length === 0 ? '✅' : '❌'}`);
  console.log(`MongoDB Connection: ${mongoOk ? '✅' : '❌'}`);
  console.log(`R2 Storage: ${r2Ok ? '✅' : '❌'}`);
  console.log(`AssemblyAI API: ${assemblyOk ? '✅' : '❌'}`);
  
  const allPassed = missingVars.length === 0 && mongoOk && r2Ok && assemblyOk;
  
  if (allPassed) {
    console.log('\n🎉 ALL TESTS PASSED! Your upload should work perfectly now.');
  } else {
    console.log('\n❌ Some tests failed. Please fix the issues above before trying to upload.');
  }
  
  console.log('\n=== NEXT STEPS ===');
  if (allPassed) {
    console.log('1. Try uploading a file through your app');
    console.log('2. Check the browser console and server logs for any remaining issues');
  } else {
    console.log('1. Fix the failing tests above');
    console.log('2. Re-run this test: node test-env-complete.js');
    console.log('3. Once all tests pass, try uploading through your app');
  }
}

runAllTests().catch(console.error);