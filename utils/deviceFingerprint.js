// Client-side device fingerprinting utility
export class DeviceFingerprinter {
  static async generateFingerprint() {
    const fingerprint = {};
    
    try {
      // Screen information
      fingerprint.screen = `${screen.width}x${screen.height}x${screen.colorDepth}`;
      fingerprint.availScreen = `${screen.availWidth}x${screen.availHeight}`;
      
      // Timezone
      fingerprint.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      fingerprint.timezoneOffset = new Date().getTimezoneOffset();
      
      // Platform and language
      fingerprint.platform = navigator.platform;
      fingerprint.language = navigator.language;
      fingerprint.languages = navigator.languages?.join(',') || '';
      
      // Hardware concurrency
      fingerprint.hardwareConcurrency = navigator.hardwareConcurrency || 0;
      
      // Memory (if available)
      if (navigator.deviceMemory) {
        fingerprint.deviceMemory = navigator.deviceMemory;
      }
      
      // WebGL fingerprint
      fingerprint.webgl = await this.getWebGLFingerprint();
      
      // Canvas fingerprint
      fingerprint.canvas = this.getCanvasFingerprint();
      
      // Audio fingerprint
      fingerprint.audio = await this.getAudioFingerprint();
      
      // Fonts
      fingerprint.fonts = await this.getFontFingerprint();
      
      // Plugins
      fingerprint.plugins = this.getPluginFingerprint();
      
      // Local storage support
      fingerprint.localStorage = this.supportsLocalStorage();
      fingerprint.sessionStorage = this.supportsSessionStorage();
      fingerprint.indexedDB = this.supportsIndexedDB();
      
      // Cookie support
      fingerprint.cookieEnabled = navigator.cookieEnabled;
      
      // Do Not Track
      fingerprint.doNotTrack = navigator.doNotTrack;
      
      // Touch support
      fingerprint.touchSupport = 'ontouchstart' in window;
      fingerprint.maxTouchPoints = navigator.maxTouchPoints || 0;
      
      // Media devices
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          fingerprint.mediaDevices = devices.length;
          fingerprint.audioInputs = devices.filter(d => d.kind === 'audioinput').length;
          fingerprint.videoInputs = devices.filter(d => d.kind === 'videoinput').length;
          fingerprint.audioOutputs = devices.filter(d => d.kind === 'audiooutput').length;
        } catch (e) {
          fingerprint.mediaDevices = 0;
        }
      }
      
      // Generate browser fingerprint hash
      const browserData = Object.values(fingerprint).join('|');
      fingerprint.browserFingerprint = await this.hashString(browserData);
      
      return fingerprint;
    } catch (error) {
      console.error('Error generating device fingerprint:', error);
      return { error: error.message };
    }
  }
  
  static async getWebGLFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (!gl) return 'no-webgl';
      
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : '';
      const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';
      
      return `${vendor}|${renderer}|${gl.getParameter(gl.VERSION)}`;
    } catch (error) {
      return 'webgl-error';
    }
  }
  
  static getCanvasFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Draw some text and shapes
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('Device fingerprinting 🔒', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Device fingerprinting 🔒', 4, 17);
      
      return canvas.toDataURL();
    } catch (error) {
      return 'canvas-error';
    }
  }
  
  static async getAudioFingerprint() {
    try {
      if (!window.AudioContext && !window.webkitAudioContext) {
        return 'no-audio-context';
      }
      
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const context = new AudioContext();
      
      // Create oscillator
      const oscillator = context.createOscillator();
      const analyser = context.createAnalyser();
      const gain = context.createGain();
      const scriptProcessor = context.createScriptProcessor(4096, 1, 1);
      
      gain.gain.value = 0; // Mute
      oscillator.type = 'triangle';
      oscillator.frequency.value = 10000;
      
      oscillator.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(gain);
      gain.connect(context.destination);
      
      oscillator.start(0);
      
      return new Promise((resolve) => {
        let sample = 0;
        scriptProcessor.onaudioprocess = function(bins) {
          if (sample++ > 10) {
            const floatFrequencyData = new Float32Array(analyser.frequencyBinCount);
            analyser.getFloatFrequencyData(floatFrequencyData);
            
            oscillator.stop();
            context.close();
            
            resolve(floatFrequencyData.slice(0, 30).join(','));
          }
        };
        
        // Fallback timeout
        setTimeout(() => {
          oscillator.stop();
          context.close();
          resolve('audio-timeout');
        }, 1000);
      });
    } catch (error) {
      return 'audio-error';
    }
  }
  
  static async getFontFingerprint() {
    try {
      const baseFonts = ['Arial', 'Verdana', 'Times New Roman', 'Courier New', 'serif', 'sans-serif', 'monospace'];
      const testString = 'mmmmmmmmmmlli';
      const testSize = '72px';
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      // Measure base fonts
      const baseSizes = {};
      baseFonts.forEach(font => {
        context.font = `${testSize} ${font}`;
        baseSizes[font] = context.measureText(testString).width;
      });
      
      // Test fonts list
      const testFonts = [
        'Arial Black', 'Arial Narrow', 'Arial Unicode MS', 'Book Antiqua', 'Bookman Old Style',
        'Calibri', 'Cambria', 'Century', 'Century Gothic', 'Comic Sans MS', 'Consolas',
        'Franklin Gothic Medium', 'Garamond', 'Georgia', 'Helvetica', 'Impact', 'Lucida Console',
        'Lucida Sans Unicode', 'Microsoft Sans Serif', 'Palatino Linotype', 'Segoe UI',
        'Tahoma', 'Times', 'Trebuchet MS', 'Verdana'
      ];
      
      const availableFonts = [];
      
      testFonts.forEach(font => {
        let detected = false;
        baseFonts.forEach(baseFont => {
          context.font = `${testSize} ${font}, ${baseFont}`;
          const size = context.measureText(testString).width;
          if (size !== baseSizes[baseFont]) {
            detected = true;
          }
        });
        if (detected) {
          availableFonts.push(font);
        }
      });
      
      return availableFonts.join(',');
    } catch (error) {
      return 'font-error';
    }
  }
  
  static getPluginFingerprint() {
    try {
      const plugins = [];
      for (let i = 0; i < navigator.plugins.length; i++) {
        const plugin = navigator.plugins[i];
        plugins.push(`${plugin.name}|${plugin.filename}|${plugin.description}`);
      }
      return plugins.join(';');
    } catch (error) {
      return 'plugin-error';
    }
  }
  
  static supportsLocalStorage() {
    try {
      return typeof Storage !== 'undefined' && localStorage;
    } catch (e) {
      return false;
    }
  }
  
  static supportsSessionStorage() {
    try {
      return typeof Storage !== 'undefined' && sessionStorage;
    } catch (e) {
      return false;
    }
  }
  
  static supportsIndexedDB() {
    try {
      return !!window.indexedDB;
    } catch (e) {
      return false;
    }
  }
  
  static async hashString(str) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(str);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      // Fallback for older browsers
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return hash.toString(16);
    }
  }
}