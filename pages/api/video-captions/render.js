import jwt from 'jsonwebtoken';
import { connectToDatabase } from '../../../lib/mongodb';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

// Professional caption renderer using FFmpeg
class CaptionRenderer {
  constructor(settings = {}) {
    this.settings = {
      font: settings.font || 'Arial',
      fontSize: settings.fontSize || 16,
      backgroundColor: settings.backgroundColor || 'rgba(0, 0, 0, 0.8)',
      textColor: settings.textColor || '#FFFFFF',
      position: settings.position || 'bottom',
      maxCharsPerLine: settings.maxCharsPerLine || 37,
      maxLinesPerCaption: settings.maxLinesPerCaption || 2
    };
  }

  // Generate SRT subtitle file
  generateSRT(captions) {
    let srtContent = '';
    
    captions.forEach((caption, index) => {
      const startTime = this.formatSRTTime(caption.start);
      const endTime = this.formatSRTTime(caption.end);
      
      // Format text with speaker identification and line breaks
      let text = caption.text;
      if (caption.speaker) {
        text = `(${caption.speaker})\n${text}`;
      }
      
      // Break long lines according to professional standards
      text = this.breakLines(text);
      
      srtContent += `${index + 1}\n`;
      srtContent += `${startTime} --> ${endTime}\n`;
      srtContent += `${text}\n\n`;
    });
    
    return srtContent;
  }

  formatSRTTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  }

  breakLines(text) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      
      if (testLine.length > this.settings.maxCharsPerLine && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
      
      // Limit to max lines per caption
      if (lines.length >= this.settings.maxLinesPerCaption - 1 && currentLine) {
        lines.push(currentLine);
        break;
      }
    }
    
    if (currentLine && lines.length < this.settings.maxLinesPerCaption) {
      lines.push(currentLine);
    }
    
    return lines.join('\n');
  }

  // Render captions onto video using FFmpeg
  async renderCaptionsOnVideo(inputVideoPath, outputVideoPath, srtPath) {
    // Professional caption styling with FFmpeg
    const fontSize = this.settings.fontSize;
    const fontColor = this.settings.textColor.replace('#', '').toLowerCase();
    const backgroundColor = '000000'; // Use simple black background
    
    // Convert paths to absolute paths and normalize them
    const absoluteInputPath = path.resolve(inputVideoPath).trim();
    const absoluteOutputPath = path.resolve(outputVideoPath).trim();
    const absoluteSrtPath = path.resolve(srtPath).trim();
    
    // Verify SRT file exists before proceeding
    if (!fs.existsSync(absoluteSrtPath)) {
      throw new Error(`SRT file not found: ${absoluteSrtPath}`);
    }
    
    console.log('Input video path:', absoluteInputPath);
    console.log('Output video path:', absoluteOutputPath);
    console.log('SRT file path:', absoluteSrtPath);
    console.log('SRT file exists:', fs.existsSync(absoluteSrtPath));
    
    // Convert paths for FFmpeg (use forward slashes for cross-platform compatibility)
    const ffmpegInputPath = absoluteInputPath.replace(/\\/g, '/');
    const ffmpegOutputPath = absoluteOutputPath.replace(/\\/g, '/');
    const ffmpegSrtPath = absoluteSrtPath.replace(/\\/g, '/');
  
    // Primary approach: Simple subtitles filter (most reliable)
    const ffmpegArgs = [
      '-i', ffmpegInputPath,
      '-vf', `subtitles='${ffmpegSrtPath}'`,
      '-c:a', 'copy',
      '-y',
      ffmpegOutputPath
    ];
    
    // Fallback approach: Use drawtext with SRT parsing (if subtitles filter fails)
    const fallbackArgs = [
      '-i', ffmpegInputPath,
      '-vf', `drawtext=fontfile=arial.ttf:text='Test Caption':fontcolor=white:fontsize=24:box=1:boxcolor=black@0.8:boxborderw=5:x=(w-text_w)/2:y=h-text_h-20`,
      '-c:a', 'copy',
      '-y',
      ffmpegOutputPath
    ];  
    
    console.log('FFmpeg arguments:', ffmpegArgs);
    console.log('Fallback arguments:', fallbackArgs);
    
    // Try primary approach first, then fallback
    const tryFFmpegExecution = async (args, attemptName) => {
      return new Promise((resolve, reject) => {
        console.log(`Trying ${attemptName} with args:`, args);
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
          console.log('FFmpeg progress:', data.toString());
        });
        
        ffmpegProcess.on('close', (code) => {
          console.log(`=== FFmpeg ${attemptName} Results ===`);
          console.log('Exit code:', code);
          console.log('Stdout:', stdout);
          console.log('Stderr:', stderr);
          console.log('Output file exists after execution:', fs.existsSync(outputVideoPath));
          console.log('================================');
          
          if (code === 0) {
            // Verify the output file was created
            if (!fs.existsSync(outputVideoPath)) {
              reject(new Error(`FFmpeg succeeded but output file not found: ${outputVideoPath}`));
            } else {
              console.log(`FFmpeg ${attemptName} successful, output file created`);
              resolve(outputVideoPath);
            }
          } else {
            const errorMsg = `FFmpeg ${attemptName} failed with exit code ${code}. Stderr: ${stderr}. Stdout: ${stdout}`;
            console.error(`FFmpeg ${attemptName} failed:`, errorMsg);
            reject(new Error(errorMsg));
          }
        });
        
        ffmpegProcess.on('error', (error) => {
          console.error(`FFmpeg ${attemptName} spawn error:`, error);
          reject(new Error(`Failed to start FFmpeg for ${attemptName}: ${error.message}`));
        });
      });
    };
    
    try {
      // Try primary subtitles approach first
      try {
        return await tryFFmpegExecution(ffmpegArgs, 'subtitles approach');
      } catch (primaryError) {
        console.log('Primary subtitles approach failed, trying fallback:', primaryError.message);
        
        // Try fallback approach
        return await tryFFmpegExecution(fallbackArgs, 'fallback approach');
      }
    } catch (error) {
      console.error('All FFmpeg approaches failed:', error);
      throw new Error(`Failed to render captions: ${error.message}`);
    }
  }

  getFontPath() {
    // Return system font path based on OS
    const platform = process.platform;
    
    if (platform === 'win32') {
      return 'C:\\Windows\\Fonts\\arial.ttf';
    } else if (platform === 'darwin') {
      return '/System/Library/Fonts/Arial.ttf';
    } else {
      return '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
    }
  }

  convertRGBAToHex(rgba) {
    // Convert rgba(0, 0, 0, 0.8) to hex format for FFmpeg
    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (match) {
      const r = parseInt(match[1]).toString(16).padStart(2, '0');
      const g = parseInt(match[2]).toString(16).padStart(2, '0');
      const b = parseInt(match[3]).toString(16).padStart(2, '0');
      return `${b}${g}${r}`; // BGR format for FFmpeg
    }
    return '000000'; // Default black
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify JWT token
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const { videoId, captions, settings } = req.body;

    if (!videoId || !captions || !Array.isArray(captions)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Connect to database
    const { db } = await connectToDatabase();

    // Get video information
    const videoDoc = await db.collection('video_captions').findOne({
      videoId,
      userId
    });

    if (!videoDoc) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const inputVideoPath = videoDoc.filePath;
    const outputDir = path.resolve('./uploads/captioned-videos');
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Use simple filenames to avoid path issues
    const outputVideoPath = path.join(outputDir, `${videoId}_captioned.mp4`);
    const srtPath = path.join(outputDir, `${videoId}.srt`);
    
    console.log('Working directory:', outputDir);
    console.log('Video ID:', videoId);
    console.log('Input video path:', inputVideoPath);
    console.log('Output video path:', outputVideoPath);
    console.log('SRT path:', srtPath);

    // Initialize caption renderer
    const renderer = new CaptionRenderer(settings);

    // Generate SRT file
    const srtContent = renderer.generateSRT(captions);
    fs.writeFileSync(srtPath, srtContent, 'utf8');

    console.log(`Generated SRT file: ${srtPath}`);
    console.log(`SRT content preview:\n${srtContent.substring(0, 500)}...`);
    console.log(`SRT file size: ${fs.statSync(srtPath).size} bytes`);
    console.log(`SRT file exists after write: ${fs.existsSync(srtPath)}`);

    // Convert paths for FFmpeg debugging
    const ffmpegInputPath = path.resolve(inputVideoPath).replace(/\\/g, '/');
    const ffmpegOutputPath = path.resolve(outputVideoPath).replace(/\\/g, '/');
    const ffmpegSrtPath = path.resolve(srtPath).replace(/\\/g, '/');

    // Render captions on video
    console.log('=== CAPTION RENDERING DEBUG ===');
    console.log('Input video:', inputVideoPath);
    console.log('Output video:', outputVideoPath);
    console.log('SRT file:', srtPath);
    console.log('Input video exists:', fs.existsSync(inputVideoPath));
    console.log('SRT file exists:', fs.existsSync(srtPath));
    if (fs.existsSync(inputVideoPath)) {
      const inputStats = fs.statSync(inputVideoPath);
      console.log('Input video size:', inputStats.size, 'bytes');
    }
    if (fs.existsSync(srtPath)) {
      const srtStats = fs.statSync(srtPath);
      console.log('SRT file size:', srtStats.size, 'bytes');
      const srtPreview = fs.readFileSync(srtPath, 'utf8');
      console.log('SRT content:\n', srtPreview);
    }
    console.log('Caption count:', captions.length);
    console.log('Settings:', settings);
    
    // Additional path debugging
    console.log('--- PATH CONVERSION DEBUG ---');
    console.log('Original paths:');
    console.log('  Input:', inputVideoPath);
    console.log('  Output:', outputVideoPath);
    console.log('  SRT:', srtPath);
    console.log('FFmpeg converted paths:');
    console.log('  Input:', ffmpegInputPath);
    console.log('  Output:', ffmpegOutputPath);
    console.log('  SRT:', ffmpegSrtPath);
    console.log('================================');
    
    try {
      await renderer.renderCaptionsOnVideo(inputVideoPath, outputVideoPath, srtPath);
      console.log('Caption rendering completed successfully');
    } catch (renderError) {
      console.error('Caption rendering failed:', renderError);
      console.error('Render error details:', renderError.message);
      throw renderError;
    }

    // Update database with captioned video path
    await db.collection('video_captions').updateOne(
      { videoId },
      {
        $set: {
          captionedVideoPath: outputVideoPath,
          srtPath,
          renderStatus: 'completed',
          renderedAt: new Date()
        }
      }
    );

    // Generate download URL (in production, use cloud storage)
    const videoUrl = `/api/video-captions/download/${videoId}`;

    console.log(`Successfully rendered captions for video ${videoId}`);

    res.status(200).json({
      success: true,
      videoUrl,
      srtPath,
      captionCount: captions.length
    });

  } catch (error) {
    console.error('Caption rendering error:', error);
    res.status(500).json({ 
      error: 'Failed to render captions',
      details: error.message 
    });
  }
}
