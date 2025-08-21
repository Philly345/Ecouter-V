const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

// Test MaryTTS functionality
async function testMaryTTS() {
  console.log('🎤 Testing MaryTTS implementation...');
  console.log('🔧 Detected platform:', process.platform);
  
  try {
    // Test HTTP API
    await testMaryTTSHTTP();
  } catch (error) {
    console.log('🌐 MaryTTS HTTP API not available, checking command-line...');
    
    try {
      await testMaryTTSCommand();
    } catch (cmdError) {
      console.log('🖥️ MaryTTS command-line not available');
      await provideMaryTTSInstallInstructions();
    }
  }
}

async function testMaryTTSHTTP() {
  console.log('🌐 Testing MaryTTS HTTP API...');
  
  const maryUrl = 'http://localhost:59125/process';
  const params = new URLSearchParams({
    INPUT_TYPE: 'TEXT',
    OUTPUT_TYPE: 'AUDIO',
    AUDIO: 'WAVE',
    LOCALE: 'en_US',
    VOICE: 'cmu-slt-hsmm',
    INPUT_TEXT: 'Hello, this is a test of MaryTTS'
  });
  
  try {
    const response = await fetch(`${maryUrl}?${params}`);
    
    if (response.ok) {
      console.log('✅ MaryTTS HTTP API is working!');
      console.log('📊 Available at: http://localhost:59125');
      return true;
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.log('❌ MaryTTS HTTP API failed:', error.message);
    throw error;
  }
}

async function testMaryTTSCommand() {
  console.log('🖥️ Testing MaryTTS command-line...');
  
  const command = process.platform === 'win32' 
    ? 'mary-client.bat --help'
    : 'mary-client --help';
  
  try {
    const { stdout, stderr } = await execAsync(command);
    console.log('✅ MaryTTS command-line is available!');
    console.log('📋 Command output preview:', stdout.substring(0, 200) + '...');
    return true;
  } catch (error) {
    console.log('❌ MaryTTS command-line failed:', error.message);
    throw error;
  }
}

async function provideMaryTTSInstallInstructions() {
  console.log('\n📋 MaryTTS Installation Instructions:');
  console.log('=====================================');
  
  if (process.platform === 'win32') {
    console.log('🪟 Windows Installation:');
    console.log('1. Download MaryTTS from: https://github.com/marytts/marytts/releases');
    console.log('2. Extract to C:\\marytts\\');
    console.log('3. Add C:\\marytts\\bin to your PATH');
    console.log('4. Run: marytts-server.bat');
    console.log('5. Server will be available at http://localhost:59125');
  } else if (process.platform === 'linux') {
    console.log('🐧 Linux Installation:');
    console.log('1. sudo apt-get update');
    console.log('2. sudo apt-get install openjdk-8-jdk');
    console.log('3. wget https://github.com/marytts/marytts/releases/download/v5.2/marytts-5.2.zip');
    console.log('4. unzip marytts-5.2.zip && cd marytts-5.2');
    console.log('5. ./bin/marytts-server');
  } else if (process.platform === 'darwin') {
    console.log('🍎 macOS Installation:');
    console.log('1. brew install openjdk@8');
    console.log('2. Download MaryTTS from GitHub releases');
    console.log('3. Extract and run: ./bin/marytts-server');
  }
  
  console.log('\n🎵 Alternative: Use Enhanced Text-Only Mode');
  console.log('- Your system will provide comprehensive TTS instructions');
  console.log('- Includes voice guidance for Edge Read Aloud, Google Translate TTS');
  console.log('- Works immediately without any installation');
  
  console.log('\n🚀 MaryTTS Benefits:');
  console.log('- ✅ High-quality voices (cmu-slt-hsmm, cmu-bdl-hsmm)');
  console.log('- ✅ Local processing (privacy-focused)');
  console.log('- ✅ No API costs or limits');
  console.log('- ✅ Cross-platform support');
  console.log('- ✅ Open-source and customizable');
}

// Run the test
testMaryTTS().then(() => {
  console.log('✅ MaryTTS test completed!');
}).catch((error) => {
  console.log('ℹ️  MaryTTS testing finished - see instructions above');
});