// Test favicon setup
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing favicon setup...');

const publicDir = path.join(__dirname, 'public');
const requiredFiles = [
  'favicon.ico',
  'favicon-16x16.png', 
  'favicon-32x32.png',
  'apple-touch-icon.png',
  'logo-new.png',
  'manifest.json'
];

let allGood = true;

requiredFiles.forEach(file => {
  const filePath = path.join(publicDir, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`✅ ${file} - ${(stats.size / 1024).toFixed(1)}KB`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allGood = false;
  }
});

// Check SEO component for favicon links
const seoPath = path.join(__dirname, 'components', 'SEO.js');
if (fs.existsSync(seoPath)) {
  const seoContent = fs.readFileSync(seoPath, 'utf8');
  
  if (seoContent.includes('favicon.ico') && 
      seoContent.includes('favicon-32x32.png') && 
      seoContent.includes('favicon-16x16.png') &&
      seoContent.includes('apple-touch-icon.png')) {
    console.log('✅ SEO.js - All favicon links present');
  } else {
    console.log('❌ SEO.js - Missing favicon links');
    allGood = false;
  }
} else {
  console.log('❌ SEO.js - Component not found');
  allGood = false;
}

// Check manifest.json
const manifestPath = path.join(publicDir, 'manifest.json');
if (fs.existsSync(manifestPath)) {
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (manifest.icons && manifest.icons.length > 0) {
      console.log(`✅ manifest.json - ${manifest.icons.length} icons configured`);
    } else {
      console.log('❌ manifest.json - No icons configured');
      allGood = false;
    }
  } catch (error) {
    console.log('❌ manifest.json - Invalid JSON');
    allGood = false;
  }
}

console.log('');
if (allGood) {
  console.log('🎉 Favicon setup is PERFECT!');
  console.log('🚀 Ready for deployment and Google indexing');
  console.log('');
  console.log('📱 Your new logo will appear in:');
  console.log('• Google search results');
  console.log('• Browser tabs');
  console.log('• Bookmarks');
  console.log('• Mobile home screen icons');
  console.log('• Progressive Web App icons');
} else {
  console.log('⚠️  Some issues found - please fix before deployment');
}

module.exports = { allGood };