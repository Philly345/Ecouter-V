#!/usr/bin/env node

// Production startup script for AI Health Monitoring System
console.log('🚀 Starting AI Health Monitoring System - Production Mode');
console.log('📅 Date:', new Date().toLocaleString());
console.log('');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Verify required environment variables
const requiredEnvVars = [
  'SMTP_SERVER',
  'SMTP_LOGIN', 
  'SMTP_PASSWORD',
  'SMTP_SENDER',
  'ASSEMBLYAI_API_KEY',
  'GLADIA_API_KEY',
  'GEMINI_API_KEY',
  'DEEPSEEK_API_KEY'
];

console.log('🔍 Checking environment configuration...');
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.log('');
  console.log('🔧 Please add these to your .env.local file on the server');
  process.exit(1);
}

console.log('✅ Environment configuration complete');
console.log('');

// Initialize the AI management system
const { getAPIManager } = require('./lib/api-manager.cjs');

async function startProductionSystem() {
  try {
    console.log('🤖 Initializing AI API Management System...');
    
    // Get the API manager (this will start the scheduler automatically)
    const apiManager = getAPIManager();
    
    console.log('✅ AI system initialized successfully');
    console.log('📧 Email reports will be sent to: ecouter.transcribe@gmail.com');
    console.log('');
    console.log('🕐 Scheduled health checks:');
    console.log('   • 12:00 AM - Midnight health check');
    console.log('   • 12:20 AM - Post-midnight API verification');
    console.log('   • 7:00 AM - Morning system status');
    console.log('   • 10:00 AM - Mid-morning update');
    console.log('   • 12:00 PM - Noon checkpoint');
    console.log('   • 3:00 PM - Afternoon review');
    console.log('   • 10:00 PM - Evening summary');
    console.log('');
    
    // Send startup notification
    try {
      await apiManager.sendInfoAlert(
        'PRODUCTION_SYSTEM_STARTED',
        `AI Health Monitoring System started in production mode at ${new Date().toLocaleString()}`
      );
      console.log('📧 Production startup notification sent');
    } catch (emailError) {
      console.warn('⚠️ Could not send startup notification:', emailError.message);
    }
    
    console.log('🎉 System is now running in production mode!');
    console.log('🔄 The system will continue monitoring and sending reports automatically');
    console.log('📊 View health dashboard at: /admin/health');
    console.log('');
    console.log('💡 To stop the system: Ctrl+C or kill this process');
    
    // Keep the process alive
    process.on('SIGINT', async () => {
      console.log('');
      console.log('🛑 Received shutdown signal...');
      
      try {
        await apiManager.sendInfoAlert(
          'PRODUCTION_SYSTEM_STOPPED', 
          `AI Health Monitoring System stopped at ${new Date().toLocaleString()}`
        );
        console.log('📧 Shutdown notification sent');
      } catch (error) {
        console.warn('⚠️ Could not send shutdown notification');
      }
      
      console.log('✅ AI Health Monitoring System stopped gracefully');
      process.exit(0);
    });
    
    // Log system health every hour in production
    setInterval(async () => {
      const health = await apiManager.getSystemHealth();
      console.log(`🕐 ${new Date().toLocaleString()} - System Health: ${health.status}`);
    }, 3600000); // Every hour
    
  } catch (error) {
    console.error('❌ Failed to start production system:', error);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('1. Check environment variables in .env.local');
    console.log('2. Verify SMTP credentials are correct');
    console.log('3. Ensure all API keys are valid');
    console.log('4. Check internet connectivity');
    process.exit(1);
  }
}

// Handle uncaught exceptions gracefully
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.log('🔄 System will attempt to continue...');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
  console.log('🔄 System will attempt to continue...');
});

// Start the production system
startProductionSystem();