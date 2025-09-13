// Smart API Management System with Auto-Rotation
const nodemailer = require('nodemailer');

class SmartAPIManager {
  constructor() {
    // Prevent duplicate initialization
    if (SmartAPIManager.instance) {
      return SmartAPIManager.instance;
    }
    
    SmartAPIManager.instance = this;
    this.apis = {
      assemblyai: {
        key: process.env.ASSEMBLYAI_API_KEY,
        usage: 0,
        limit: 1000000, // Monthly limit in characters
        resetDate: new Date(),
        priority: 1,
        isActive: true,
        errorCount: 0,
        lastError: null,
        endpoint: 'https://api.assemblyai.com'
      },
      gladia: {
        key: process.env.GLADIA_API_KEY,
        usage: 0,
        limit: 500000,
        resetDate: new Date(),
        priority: 2,
        isActive: true,
        errorCount: 0,
        lastError: null,
        endpoint: 'https://api.gladia.io'
      },
      openai: {
        key: process.env.OPENAI_API_KEY,
        usage: 0,
        limit: 2000000,
        resetDate: new Date(),
        priority: 3,
        isActive: true,
        errorCount: 0,
        lastError: null,
        endpoint: 'https://openrouter.ai'
      },
      deepseek: {
        key: process.env.DEEPSEEK_API_KEY,
        usage: 0,
        limit: 1500000,
        resetDate: new Date(),
        priority: 4,
        isActive: true,
        errorCount: 0,
        lastError: null,
        endpoint: 'https://api.deepseek.com'
      }
    };
    
    this.currentAPI = 'assemblyai';
    this.alertEmail = 'ecouter.transcribe@gmail.com';
    this.debugAttempts = new Map();

    // Initialize
    if (!SmartAPIManager.initialized) {
      this.loadAPIMetrics();
      SmartAPIManager.initialized = true;
    }
  }

  // 🔍 API Usage Monitoring & Auto-Switch
  async checkAPIUsage(apiName, requestSize = 1000) {
    const api = this.apis[apiName];
    if (!api) return false;

    // Calculate usage percentage
    const usagePercent = (api.usage / api.limit) * 100;
    
    // Auto-switch if approaching limit (95%)
    if (usagePercent >= 95) {
      console.log(`⚠️ API ${apiName} at ${usagePercent.toFixed(1)}% usage - switching...`);
      await this.switchToNextAPI(apiName);
      return false;
    }

    // Update usage
    api.usage += requestSize;
    await this.saveAPIMetrics();
    
    return true;
  }

  async switchToNextAPI(currentFailedAPI = null) {
    // Get available APIs sorted by priority
    const availableAPIs = Object.entries(this.apis)
      .filter(([name, api]) => {
        if (name === currentFailedAPI) return false;
        if (!api.key) return false;
        if (!api.isActive) return false;
        
        const usagePercent = (api.usage / api.limit) * 100;
        return usagePercent < 95;
      })
      .sort((a, b) => a[1].priority - b[1].priority);

    if (availableAPIs.length === 0) {
      console.error('🚨 CRITICAL: No available APIs!');
      return null;
    }

    const [newAPIName] = availableAPIs[0];
    this.currentAPI = newAPIName;
    
    console.log(`🔄 Switched to ${newAPIName}`);
    await this.saveAPIMetrics();
    
    return newAPIName;
  }

  // 🛠️ Auto-Debug System
  async autoDebug(error, context = {}) {
    if (!error) return false;

    const errorKey = `${error.name}_${context.api || 'unknown'}`;
    const attempts = (this.debugAttempts.get(errorKey) || 0) + 1;
    
    this.debugAttempts.set(errorKey, attempts);
    
    if (attempts > 3) {
      console.error(`🚨 Auto-debug failed after 3 attempts for ${error.name}`);
      return false;
    }

    console.log(`🔧 Auto-debugging: ${error.name} (Attempt ${attempts}/3)`);

    try {
      const fixed = await this.applyAutomaticFix(error, context);
      
      if (fixed) {
        this.debugAttempts.delete(errorKey);
        console.log(`✅ Auto-fixed: ${error.name}`);
        return true;
      }
    } catch (debugError) {
      console.error(`❌ Auto-debug failed:`, debugError);
    }

    return false;
  }

  async applyAutomaticFix(error, context) {
    // API Key rotation fix
    if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
      console.log('🔑 Applying fix: API key rotation');
      const newAPI = await this.switchToNextAPI(context.api);
      return newAPI !== null;
    }

    // Rate limit fix
    if (error.message?.includes('429') || error.message?.includes('rate limit')) {
      console.log('⏱️ Applying fix: Rate limit - switching API');
      const newAPI = await this.switchToNextAPI(context.api);
      await this.wait(2000);
      return newAPI !== null;
    }

    // Network timeout fix
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      console.log('🌐 Applying fix: Network retry with delay');
      await this.wait(5000);
      return true;
    }

    // Quota exceeded fix
    if (error.message?.includes('quota') || error.message?.includes('limit exceeded')) {
      console.log('📊 Applying fix: Quota exceeded - switching API');
      const api = this.apis[context.api];
      if (api) {
        api.usage = api.limit * 0.95; // Mark as nearly full
      }
      const newAPI = await this.switchToNextAPI(context.api);
      return newAPI !== null;
    }

    return false;
  }

  // 💾 Utility Methods
  async saveAPIMetrics() {
    try {
      const fs = require('fs').promises;
      await fs.writeFile('./api-metrics.json', JSON.stringify(this.apis, null, 2));
    } catch (error) {
      console.error('Failed to save API metrics:', error);
    }
  }

  async loadAPIMetrics() {
    try {
      const fs = require('fs').promises;
      const data = await fs.readFile('./api-metrics.json', 'utf8');
      this.apis = { ...this.apis, ...JSON.parse(data) };
    } catch (error) {
      // File doesn't exist or error reading - use defaults
    }
  }

  async checkAPIResets() {
    const now = new Date();
    
    for (const [name, api] of Object.entries(this.apis)) {
      // Reset monthly (adjust based on your API billing cycles)
      if (now.getMonth() !== api.resetDate.getMonth()) {
        api.usage = 0;
        api.resetDate = now;
        api.errorCount = 0;
        api.isActive = true;
        console.log(`🔄 Reset usage for ${name}`);
      }
    }
    
    await this.saveAPIMetrics();
  }

  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 📊 Public API for integration
  async getCurrentAPI() {
    return this.currentAPI;
  }

  async getAPIStatus() {
    return this.apis;
  }

  async recordAPIError(apiName, error) {
    if (this.apis[apiName]) {
      this.apis[apiName].errorCount++;
      this.apis[apiName].lastError = error;
      
      // Auto-debug if error count is high
      if (this.apis[apiName].errorCount >= 5) {
        await this.autoDebug(error, { api: apiName });
      }
    }
  }

  async sendCriticalAlert(alertType, error, context = {}) {
    console.error(`🚨 CRITICAL ALERT [${alertType}]:`, {
      error: error.message || error,
      context,
      timestamp: new Date().toISOString()
    });
    
    // You can extend this to send actual email alerts using nodemailer
    // For now, just log the critical alert
    try {
      // Could implement email alerts here in the future
      // const transporter = nodemailer.createTransporter(...);
      // await transporter.sendMail(...);
      return true;
    } catch (alertError) {
      console.error('Failed to send critical alert:', alertError);
      return false;
    }
  }

  async saveAPIMetrics() {
    try {
      // Save metrics to file or database
      // For now, just log the current status
      console.log('📊 API Metrics saved:', Object.keys(this.apis).reduce((acc, key) => {
        acc[key] = {
          usage: this.apis[key].usage,
          errorCount: this.apis[key].errorCount,
          isActive: this.apis[key].isActive
        };
        return acc;
      }, {}));
      return true;
    } catch (error) {
      console.error('Failed to save API metrics:', error);
      return false;
    }
  }
}

// Singleton instance
let apiManager = null;
SmartAPIManager.initialized = false; // Class-level flag

function getAPIManager() {
  if (!apiManager) {
    apiManager = new SmartAPIManager();
  }
  return apiManager;
}

module.exports = { SmartAPIManager, getAPIManager };