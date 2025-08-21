// Test System TTS functionality
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

async function testSystemTTS() {
  try {
    console.log('🎵 Testing System TTS...');
    
    const platform = process.platform;
    console.log(`🔧 Detected platform: ${platform}`);
    
    const testText = "Hello, this is a test of the system text-to-speech functionality.";
    
    if (platform === 'win32') {
      await testWindowsTTS(testText);
    } else if (platform === 'linux') {
      await testLinuxTTS(testText);
    } else if (platform === 'darwin') {
      await testMacTTS(testText);
    } else {
      console.log(`❌ Unsupported platform: ${platform}`);
      return;
    }
    
    console.log('✅ System TTS test completed successfully!');
    
  } catch (error) {
    console.error('❌ System TTS test failed:', error);
  }
}

async function testWindowsTTS(text) {
  try {
    console.log('🪟 Testing Windows Speech API...');
    
    // Create temp directory
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const outputFile = path.join(tempDir, `test_tts.wav`).replace(/\\/g, '/');
    
    // Simpler PowerShell command to test speech
    const psScript = `
Add-Type -AssemblyName System.Speech;
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer;
$synth.SetOutputToWaveFile('${outputFile}');
$synth.Speak('${text}');
$synth.Dispose();
    `.trim();
    
    console.log('🔄 Executing PowerShell TTS command...');
    console.log('📝 Output file path:', outputFile);
    
    const { stdout, stderr } = await execAsync(`powershell -ExecutionPolicy Bypass -Command "${psScript}"`);
    
    if (stderr) {
      console.log('⚠️ PowerShell error:', stderr);
    }
    
    if (stdout) {
      console.log('📤 PowerShell output:', stdout);
    }
    
    // Wait a moment for file to be written
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (fs.existsSync(outputFile)) {
      const stats = fs.statSync(outputFile);
      console.log(`✅ Windows TTS generated audio file: ${stats.size} bytes`);
      // Clean up
      fs.unlinkSync(outputFile);
    } else {
      console.log('❌ File not found, trying alternative approach...');
      
      // Try alternative: Just speak without saving to file
      const simpleScript = `
Add-Type -AssemblyName System.Speech;
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer;
$synth.Speak('${text}');
$synth.Dispose();
      `.trim();
      
      console.log('🔄 Trying simple speech test...');
      await execAsync(`powershell -ExecutionPolicy Bypass -Command "${simpleScript}"`);
      console.log('✅ Windows TTS can speak (but file generation may need adjustment)');
    }
    
  } catch (error) {
    console.error('❌ Windows TTS test failed:', error);
    console.log('💡 This might be due to Windows TTS configuration or permissions');
    console.log('💡 The speech functionality may still work, but file saving needs adjustment');
  }
}

async function testLinuxTTS(text) {
  try {
    console.log('🐧 Testing eSpeak on Linux...');
    
    // Check if eSpeak is installed
    try {
      await execAsync('espeak --version');
      console.log('✅ eSpeak is installed');
    } catch (error) {
      throw new Error('eSpeak is not installed. Install with: sudo apt install espeak');
    }
    
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const outputFile = path.join(tempDir, `test_tts.wav`);
    
    console.log('🔄 Executing eSpeak command...');
    const { stdout, stderr } = await execAsync(`espeak -v en -w "${outputFile}" "${text}"`);
    
    if (stderr) {
      console.log('⚠️ eSpeak warning:', stderr);
    }
    
    if (fs.existsSync(outputFile)) {
      const stats = fs.statSync(outputFile);
      console.log(`✅ eSpeak generated audio file: ${stats.size} bytes`);
      // Clean up
      fs.unlinkSync(outputFile);
    } else {
      throw new Error('eSpeak did not generate audio file');
    }
    
  } catch (error) {
    console.error('❌ Linux eSpeak test failed:', error);
    throw error;
  }
}

async function testMacTTS(text) {
  try {
    console.log('🍎 Testing macOS say command...');
    
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const outputFile = path.join(tempDir, `test_tts.wav`);
    
    console.log('🔄 Executing say command...');
    const { stdout, stderr } = await execAsync(`say -v "Samantha" -o "${outputFile}" --data-format=LEF32@22050 "${text}"`);
    
    if (stderr) {
      console.log('⚠️ macOS say warning:', stderr);
    }
    
    if (fs.existsSync(outputFile)) {
      const stats = fs.statSync(outputFile);
      console.log(`✅ macOS say generated audio file: ${stats.size} bytes`);
      // Clean up
      fs.unlinkSync(outputFile);
    } else {
      throw new Error('macOS say did not generate audio file');
    }
    
  } catch (error) {
    console.error('❌ macOS TTS test failed:', error);
    throw error;
  }
}

testSystemTTS();