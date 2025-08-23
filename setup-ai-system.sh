#!/bin/bash

# 🤖 AI API Management System - Setup Script
echo "🚀 Setting up AI API Management System..."

# Install required Node.js packages
echo "📦 Installing required packages..."
npm install nodemailer assemblyai @google-cloud/translate @google/generative-ai

# Create directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p backups

# Copy environment template
echo "⚙️ Setting up environment configuration..."
if [ ! -f .env.local ]; then
    cp .env.template .env.local
    echo "✅ Created .env.local from template"
    echo "⚠️  IMPORTANT: Please configure your API keys in .env.local"
else
    echo "ℹ️  .env.local already exists - skipping template copy"
fi

# Create package.json scripts if they don't exist
echo "📝 Adding package.json scripts..."
node -e "
const fs = require('fs');
const path = './package.json';
const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));

if (!pkg.scripts) pkg.scripts = {};

// Add AI system scripts
pkg.scripts['ai:test'] = 'node test-ai-system.js';
pkg.scripts['ai:health'] = 'node -e \"require(\\\"./lib/api-manager\\\").getAPIManager().getSystemHealth().then(console.log)\"';
pkg.scripts['ai:status'] = 'node -e \"require(\\\"./lib/api-manager\\\").getAPIManager().getAPIStatus().then(console.log)\"';
pkg.scripts['ai:switch'] = 'node -e \"require(\\\"./lib/api-manager\\\").getAPIManager().switchToNextAPI(process.argv[2] || \\\"assemblyai\\\").then(console.log)\"';
pkg.scripts['dev:ai'] = 'npm run dev && echo \\\"🤖 AI Dashboard: http://localhost:3000/admin/health\\\"';

fs.writeFileSync(path, JSON.stringify(pkg, null, 2));
console.log('✅ Added AI management scripts to package.json');
"

# Create initial API metrics file
echo "💾 Creating initial API metrics..."
node -e "
const fs = require('fs');
const initialMetrics = {
  'assemblyai': {
    usage: 0,
    limit: 1000000,
    resetDate: new Date().toISOString(),
    priority: 1,
    isActive: true,
    errorCount: 0,
    lastError: null
  },
  'gladia': {
    usage: 0,
    limit: 500000,
    resetDate: new Date().toISOString(),
    priority: 2,
    isActive: true,
    errorCount: 0,
    lastError: null
  },
  'gemini': {
    usage: 0,
    limit: 2000000,
    resetDate: new Date().toISOString(),
    priority: 3,
    isActive: true,
    errorCount: 0,
    lastError: null
  },
  'deepseek': {
    usage: 0,
    limit: 1500000,
    resetDate: new Date().toISOString(),
    priority: 4,
    isActive: true,
    errorCount: 0,
    lastError: null
  }
};

if (!fs.existsSync('./api-metrics.json')) {
  fs.writeFileSync('./api-metrics.json', JSON.stringify(initialMetrics, null, 2));
  console.log('✅ Created initial API metrics file');
}
"

# Run the test system
echo "🧪 Running AI system test..."
node test-ai-system.js

echo ""
echo "🎉 AI API Management System setup complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Configure your API keys in .env.local"
echo "2. Set up Gmail SMTP for email alerts"
echo "3. Start the development server: npm run dev"
echo "4. Access the AI dashboard: http://localhost:3000/admin/health"
echo ""
echo "🤖 Available Commands:"
echo "  npm run ai:test     - Test the AI system"
echo "  npm run ai:health   - Check system health"
echo "  npm run ai:status   - View API status"
echo "  npm run ai:switch   - Force API switch"
echo "  npm run dev:ai      - Start dev server with AI dashboard info"
echo ""
echo "📧 Email Alerts: ecouter.transcribe@gmail.com"
echo "🔧 Auto-Debug: Enabled"
echo "🔄 API Rotation: Enabled"
echo "📊 Health Monitoring: Active"