// Generate ICO favicon from logo-new.png
const fs = require('fs');
const path = require('path');
const toIco = require('to-ico');

async function generateIcoFavicon() {
  console.log('🔧 Converting PNG to ICO favicon...');
  
  try {
    const logoPath = path.join(__dirname, 'public', 'logo-new.png');
    const logoBuffer = fs.readFileSync(logoPath);
    
    // Generate ICO file with multiple sizes
    const icoBuffer = await toIco([logoBuffer], {
      resize: true,
      sizes: [16, 32, 48]
    });
    
    // Save as favicon.ico
    fs.writeFileSync(path.join(__dirname, 'public', 'favicon.ico'), icoBuffer);
    
    console.log('✅ Created favicon.ico from logo-new.png');
    console.log('🎯 Favicon is now ready for Google search results!');
    
    return true;
  } catch (error) {
    console.error('❌ Error creating ICO favicon:', error);
    
    // Fallback: copy the PNG as ICO (browsers will handle it)
    console.log('🔄 Using PNG fallback for favicon.ico...');
    const logoBuffer = fs.readFileSync(path.join(__dirname, 'public', 'logo-new.png'));
    fs.writeFileSync(path.join(__dirname, 'public', 'favicon.ico'), logoBuffer);
    
    console.log('✅ Fallback favicon.ico created');
    return false;
  }
}

generateIcoFavicon();