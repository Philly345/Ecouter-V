// Generate favicons from logo-new.png
const fs = require('fs');
const path = require('path');

console.log('🎨 Generating favicons from logo-new.png...');

// For now, let's copy the logo-new.png to different favicon names
// In production, you'd want to use sharp or another image processing library

const logoPath = path.join(__dirname, 'public', 'logo-new.png');
const publicDir = path.join(__dirname, 'public');

if (!fs.existsSync(logoPath)) {
  console.error('❌ logo-new.png not found in public directory');
  process.exit(1);
}

console.log('✅ Found logo-new.png');

try {
  // Read the logo file
  const logoBuffer = fs.readFileSync(logoPath);
  
  // For now, we'll copy the PNG to serve as temporary favicons
  // In production, you should resize these to proper dimensions
  
  // Copy as favicon files (temporary solution)
  fs.writeFileSync(path.join(publicDir, 'favicon-16x16.png'), logoBuffer);
  fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), logoBuffer);
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), logoBuffer);
  
  console.log('✅ Created favicon-16x16.png');
  console.log('✅ Created favicon-32x32.png'); 
  console.log('✅ Created apple-touch-icon.png');
  
  // Create a simple manifest.json for PWA
  const manifest = {
    "name": "Ecouter Transcribe",
    "short_name": "Ecouter",
    "description": "AI-powered transcription and summarization service",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#000000",
    "theme_color": "#000000",
    "icons": [
      {
        "src": "/logo-new.png",
        "sizes": "any",
        "type": "image/png",
        "purpose": "any maskable"
      },
      {
        "src": "/favicon-32x32.png", 
        "sizes": "32x32",
        "type": "image/png"
      },
      {
        "src": "/favicon-16x16.png",
        "sizes": "16x16", 
        "type": "image/png"
      },
      {
        "src": "/apple-touch-icon.png",
        "sizes": "180x180",
        "type": "image/png"
      }
    ]
  };
  
  fs.writeFileSync(
    path.join(publicDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  
  console.log('✅ Created manifest.json');
  
  console.log('\n🎉 Favicon generation complete!');
  console.log('📝 Note: For production, consider using proper image resizing tools');
  console.log('🔍 These favicons will appear in Google search results');
  
} catch (error) {
  console.error('❌ Error generating favicons:', error);
  process.exit(1);
}

module.exports = {};