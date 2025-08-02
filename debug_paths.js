const path = require('path');
const fs = require('fs');

// Test path resolution
const testSrtPath = './uploads/captioned-videos/test.srt';
const testOutputPath = './uploads/captioned-videos/test_output.mp4';

console.log('Original SRT path:', testSrtPath);
console.log('Original output path:', testOutputPath);

const absoluteSrtPath = path.resolve(testSrtPath);
const absoluteOutputPath = path.resolve(testOutputPath);

console.log('Resolved SRT path:', absoluteSrtPath);
console.log('Resolved output path:', absoluteOutputPath);

const ffmpegSrtPath = absoluteSrtPath.replace(/\\/g, '/');
const ffmpegOutputPath = absoluteOutputPath.replace(/\\/g, '/');

console.log('FFmpeg SRT path:', ffmpegSrtPath);
console.log('FFmpeg output path:', ffmpegOutputPath);

// Test FFmpeg args
const ffmpegArgs = [
  '-i', 'test_video.mp4',
  '-vf', `subtitles=${ffmpegSrtPath}`,
  '-c:a', 'copy',
  '-y',
  ffmpegOutputPath
];

console.log('FFmpeg arguments:', ffmpegArgs);
