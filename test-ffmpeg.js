const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create a simple test SRT file
const testSRT = `1
00:00:00,000 --> 00:00:03,000
This is a test caption

2
00:00:03,000 --> 00:00:06,000
Testing FFmpeg subtitle rendering

3
00:00:06,000 --> 00:00:09,000
Final test caption
`;

// Write test SRT file
const srtPath = path.join(__dirname, 'test_ffmpeg.srt');
fs.writeFileSync(srtPath, testSRT);

console.log('Created test SRT file:', srtPath);
console.log('SRT content:');
console.log(testSRT);

// Test FFmpeg subtitle rendering
async function testFFmpegSubtitles(inputVideo, outputVideo, srtFile) {
  return new Promise((resolve, reject) => {
    const args = [
      '-i', inputVideo,
      '-vf', `subtitles=${srtFile}`,
      '-c:a', 'copy',
      '-y',
      outputVideo
    ];

    console.log('FFmpeg command:', 'ffmpeg', args.join(' '));

    const ffmpegProcess = spawn('ffmpeg', args, {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    ffmpegProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    ffmpegProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      console.log('FFmpeg output:', data.toString());
    });

    ffmpegProcess.on('close', (code) => {
      console.log('=== FFmpeg Test Results ===');
      console.log('Exit code:', code);
      console.log('Output file exists:', fs.existsSync(outputVideo));
      if (fs.existsSync(outputVideo)) {
        const stats = fs.statSync(outputVideo);
        console.log('Output file size:', stats.size, 'bytes');
      }
      console.log('Stderr:', stderr);
      console.log('========================');

      if (code === 0) {
        resolve(outputVideo);
      } else {
        reject(new Error(`FFmpeg failed with code ${code}: ${stderr}`));
      }
    });

    ffmpegProcess.on('error', (error) => {
      console.error('FFmpeg spawn error:', error);
      reject(error);
    });
  });
}

// Find a test video file
const uploadsDir = path.join(__dirname, 'uploads', 'videos');
if (fs.existsSync(uploadsDir)) {
  const files = fs.readdirSync(uploadsDir);
  const videoFile = files.find(f => f.endsWith('.mp4') || f.endsWith('.mov') || f.endsWith('.avi'));
  
  if (videoFile) {
    const inputPath = path.join(uploadsDir, videoFile);
    const outputPath = path.join(__dirname, 'test_output.mp4');
    
    console.log('Testing with video:', inputPath);
    console.log('Output will be:', outputPath);
    
    testFFmpegSubtitles(inputPath, outputPath, srtPath)
      .then(() => {
        console.log('✅ FFmpeg test successful!');
        console.log('Check the output video:', outputPath);
      })
      .catch((error) => {
        console.error('❌ FFmpeg test failed:', error.message);
      });
  } else {
    console.log('No video files found in uploads directory');
    console.log('Available files:', files);
  }
} else {
  console.log('Uploads directory not found:', uploadsDir);
}
