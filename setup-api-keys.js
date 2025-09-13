#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Ecouter API Key Setup Assistant\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
const envExists = fs.existsSync(envPath);

console.log(`📁 Environment file status: ${envExists ? '✅ Found' : '❌ Missing'}`);

if (!envExists) {
  console.log('\n📝 Creating .env.local file...');
  
  // Create basic .env.local with OpenRouter key placeholder
  const envContent = `# Ecouter Environment Configuration
# Created by setup assistant

# AI Chat Configuration (Required for Chat with AI feature)
# Get your free API key from: https://openrouter.ai/keys
OPENROUTER_API_KEY=your-openrouter-key-here

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/ecouter

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random

# Next.js Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Email Configuration (optional)
EMAIL_SERVICE_ENABLED=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
`;

  try {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env.local file successfully!');
  } catch (error) {
    console.error('❌ Failed to create .env.local file:', error.message);
    process.exit(1);
  }
}

console.log('\n🔧 Next Steps:');
console.log('');
console.log('1. 🌐 Go to https://openrouter.ai/keys');
console.log('2. 📝 Create a free account (they give $5 free credits!)');
console.log('3. 🔑 Generate an API key');
console.log('4. 📋 Copy the key (starts with "sk-or-v1-...")');
console.log('5. ✏️  Edit .env.local and replace "your-openrouter-key-here" with your actual key');
console.log('6. 🔄 Restart your development server');
console.log('');
console.log('💡 Example .env.local line:');
console.log('   OPENROUTER_API_KEY=sk-or-v1-1234567890abcdef...');
console.log('');
console.log('🆓 Free Models Available:');
console.log('   • openai/gpt-oss-20b:free (default)');
console.log('   • microsoft/wizardlm-2-8x22b:free');
console.log('   • google/gemma-7b-it:free');
console.log('   • And many more!');
console.log('');
console.log('❓ Need help? Check the docs at https://openrouter.ai/docs');
console.log('');

// Check current status
setTimeout(() => {
  console.log('🔍 Current Status Check:');
  
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const hasValidKey = content.includes('OPENROUTER_API_KEY=sk-or-v1-') && 
                       !content.includes('your-openrouter-key-here');
    
    if (hasValidKey) {
      console.log('✅ OpenRouter API key appears to be configured!');
      console.log('🎉 You should be able to use Chat with AI now.');
    } else {
      console.log('⚠️  Please edit .env.local and add your OpenRouter API key.');
    }
  }
}, 1000);