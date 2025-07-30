// Test script to check API endpoints
// Run this with: node test-api.js

const https = require('https');

const domain = 'kilo-jf4curww4-lowkeyphilly17-9752s-projects.vercel.app';

function testEndpoint(path, method = 'GET') {
  return new Promise((resolve) => {
    const options = {
      hostname: domain,
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        error: error.message
      });
    });

    req.end();
  });
}

async function runTests() {
  console.log('Testing API endpoints...\n');

  // Test home page
  console.log('1. Testing home page...');
  const home = await testEndpoint('/');
  console.log(`Status: ${home.status || 'Error'}`);
  if (home.error) console.log(`Error: ${home.error}`);
  console.log('');

  // Test API endpoint
  console.log('2. Testing transcribe API (should return 405 for GET)...');
  const api = await testEndpoint('/api/transcribe');
  console.log(`Status: ${api.status || 'Error'}`);
  if (api.error) console.log(`Error: ${api.error}`);
  else {
    try {
      const response = JSON.parse(api.body);
      console.log(`Response: ${JSON.stringify(response)}`);
    } catch (e) {
      console.log(`Body: ${api.body.substring(0, 200)}...`);
    }
  }
  console.log('');

  // Test with POST (should return auth error)
  console.log('3. Testing transcribe API with POST (should return auth error)...');
  const apiPost = await testEndpoint('/api/transcribe', 'POST');
  console.log(`Status: ${apiPost.status || 'Error'}`);
  if (apiPost.error) console.log(`Error: ${apiPost.error}`);
  else {
    try {
      const response = JSON.parse(apiPost.body);
      console.log(`Response: ${JSON.stringify(response)}`);
    } catch (e) {
      console.log(`Body: ${apiPost.body.substring(0, 200)}...`);
    }
  }
}

runTests().catch(console.error);
