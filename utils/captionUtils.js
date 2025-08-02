// Professional Video Captioning Utilities
// Implements industry-standard captioning rules and guidelines

export class CaptionValidator {
  constructor(settings = {}) {
    this.rules = {
      maxCharsPerLine: settings.maxCharsPerLine || 37,
      maxLinesPerCaption: settings.maxLinesPerCaption || 2,
      minDisplayTime: settings.minDisplayTime || 2000, // milliseconds
      maxWordsPerMinute: settings.maxWordsPerMinute || 180,
      maxWordsPerSecond: (settings.maxWordsPerMinute || 180) / 60
    };
  }

  // Validate caption timing and content
  validateCaption(caption) {
    const errors = [];
    const warnings = [];

    // Check display time
    const displayTime = (caption.end - caption.start) * 1000;
    if (displayTime < this.rules.minDisplayTime) {
      errors.push(`Caption display time (${displayTime}ms) is less than minimum (${this.rules.minDisplayTime}ms)`);
    }

    // Check reading speed
    const wordCount = caption.text.split(' ').length;
    const readingSpeed = wordCount / (caption.end - caption.start);
    if (readingSpeed > this.rules.maxWordsPerSecond) {
      warnings.push(`Reading speed (${readingSpeed.toFixed(2)} words/sec) exceeds recommended maximum (${this.rules.maxWordsPerSecond})`);
    }

    // Check line length and count
    const lines = caption.text.split('\n');
    if (lines.length > this.rules.maxLinesPerCaption) {
      errors.push(`Caption has ${lines.length} lines, maximum is ${this.rules.maxLinesPerCaption}`);
    }

    lines.forEach((line, index) => {
      if (line.length > this.rules.maxCharsPerLine) {
        errors.push(`Line ${index + 1} has ${line.length} characters, maximum is ${this.rules.maxCharsPerLine}`);
      }
    });

    return { errors, warnings, isValid: errors.length === 0 };
  }

  // Validate entire caption set
  validateCaptions(captions) {
    const results = {
      totalCaptions: captions.length,
      validCaptions: 0,
      errors: [],
      warnings: [],
      statistics: {
        averageDisplayTime: 0,
        averageReadingSpeed: 0,
        totalDuration: 0
      }
    };

    let totalDisplayTime = 0;
    let totalWords = 0;

    captions.forEach((caption, index) => {
      const validation = this.validateCaption(caption);
      
      if (validation.isValid) {
        results.validCaptions++;
      }

      validation.errors.forEach(error => {
        results.errors.push(`Caption ${index + 1}: ${error}`);
      });

      validation.warnings.forEach(warning => {
        results.warnings.push(`Caption ${index + 1}: ${warning}`);
      });

      // Calculate statistics
      const displayTime = caption.end - caption.start;
      totalDisplayTime += displayTime;
      totalWords += caption.text.split(' ').length;
    });

    results.statistics.averageDisplayTime = totalDisplayTime / captions.length;
    results.statistics.averageReadingSpeed = totalWords / totalDisplayTime;
    results.statistics.totalDuration = captions[captions.length - 1]?.end || 0;

    return results;
  }
}

export class CaptionFormatter {
  constructor() {
    this.numberWords = {
      1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five',
      6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten'
    };

    this.soundEffects = [
      'music', 'song', 'singing', 'applause', 'clapping', 'cheering',
      'laughter', 'laughing', 'crying', 'sobbing', 'screaming', 'shouting',
      'whispering', 'breathing', 'sighing', 'coughing', 'sneezing',
      'door', 'footsteps', 'walking', 'running', 'car', 'engine',
      'phone', 'ringing', 'beeping', 'buzzing', 'clicking', 'typing',
      'wind', 'rain', 'thunder', 'explosion', 'crash', 'bang'
    ];
  }

  // Format text according to professional captioning standards
  formatCaptionText(text) {
    let formatted = text.trim();

    // 1. Handle speaker identification
    formatted = this.formatSpeakerIdentification(formatted);

    // 2. Handle sound effects
    formatted = this.formatSoundEffects(formatted);

    // 3. Handle numbers (spell out 1-10, use numerals for 11+)
    formatted = this.formatNumbers(formatted);

    // 4. Handle punctuation and pauses
    formatted = this.formatPunctuation(formatted);

    // 5. Ensure proper sentence case
    formatted = this.formatSentenceCase(formatted);

    // 6. Remove redundant information
    formatted = this.removeRedundantInfo(formatted);

    return formatted;
  }

  formatSpeakerIdentification(text) {
    // Convert speaker patterns to proper format: (Speaker Name)
    
    // Handle "Speaker: text" format
    text = text.replace(/^([A-Z][a-z]+):\s*/gm, '($1)\n');
    
    // Handle "SPEAKER NAME: text" format
    text = text.replace(/^([A-Z\s]+):\s*/gm, (match, speaker) => {
      const formatted = speaker.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
      return `(${formatted})\n`;
    });

    // Handle narrator identification
    text = text.replace(/\b(narrator|announcer|host)\b/gi, '($1)');

    return text;
  }

  formatSoundEffects(text) {
    // Put sound effects in square brackets
    this.soundEffects.forEach(effect => {
      const regex = new RegExp(`\\b${effect}\\b(?!\\])`, 'gi');
      text = text.replace(regex, `[${effect}]`);
    });

    // Handle generic sound patterns
    text = text.replace(/\b(sound of|noise of|sound|noise)\s+([a-z\s]+)/gi, '[$2]');
    
    return text;
  }

  formatNumbers(text) {
    return text.replace(/\b(\d+)\b/g, (match, num) => {
      const number = parseInt(num);
      if (number >= 1 && number <= 10) {
        return this.numberWords[number] || num;
      }
      return num;
    });
  }

  formatPunctuation(text) {
    // Add ellipses for significant pauses
    text = text.replace(/\s{3,}/g, '...');
    text = text.replace(/-{2,}/g, '...');
    
    // Ensure proper punctuation spacing
    text = text.replace(/\s+([.!?])/g, '$1');
    text = text.replace(/([.!?])\s*([A-Z])/g, '$1 $2');
    
    // Handle incomplete sentences
    text = text.replace(/\.\.\.\s*$/g, '...');
    
    return text;
  }

  formatSentenceCase(text) {
    // Ensure first letter of each sentence is capitalized
    return text.replace(/(^|[.!?]\s+)([a-z])/g, (match, punct, letter) => {
      return punct + letter.toUpperCase();
    });
  }

  removeRedundantInfo(text) {
    // Remove common redundant phrases
    const redundantPhrases = [
      /\b(you can see|as you can see|here you can see)\b/gi,
      /\b(on screen|on the screen)\b/gi,
      /\b(the text says|text reads|it says)\b/gi
    ];

    redundantPhrases.forEach(phrase => {
      text = text.replace(phrase, '');
    });

    // Clean up extra spaces
    text = text.replace(/\s+/g, ' ').trim();

    return text;
  }

  // Break text into appropriate lines
  breakIntoLines(text, maxCharsPerLine = 37, maxLines = 2) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      
      if (testLine.length > maxCharsPerLine && currentLine) {
        lines.push(currentLine);
        currentLine = word;
        
        if (lines.length >= maxLines) {
          break;
        }
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine && lines.length < maxLines) {
      lines.push(currentLine);
    }

    return lines.join('\n');
  }
}

export class SRTGenerator {
  // Generate SRT subtitle file content
  static generate(captions) {
    let srtContent = '';
    
    captions.forEach((caption, index) => {
      const startTime = this.formatSRTTime(caption.start);
      const endTime = this.formatSRTTime(caption.end);
      
      srtContent += `${index + 1}\n`;
      srtContent += `${startTime} --> ${endTime}\n`;
      srtContent += `${caption.text}\n\n`;
    });
    
    return srtContent;
  }

  static formatSRTTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  }
}

export class VTTGenerator {
  // Generate WebVTT subtitle file content
  static generate(captions) {
    let vttContent = 'WEBVTT\n\n';
    
    captions.forEach((caption, index) => {
      const startTime = this.formatVTTTime(caption.start);
      const endTime = this.formatVTTTime(caption.end);
      
      vttContent += `${index + 1}\n`;
      vttContent += `${startTime} --> ${endTime}\n`;
      vttContent += `${caption.text}\n\n`;
    });
    
    return vttContent;
  }

  static formatVTTTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }
}

// Export professional captioning standards as constants
export const CAPTIONING_STANDARDS = {
  MAX_CHARS_PER_LINE: 37,
  MAX_LINES_PER_CAPTION: 2,
  MIN_DISPLAY_TIME_MS: 2000,
  MAX_WORDS_PER_MINUTE: 180,
  MAX_WORDS_PER_SECOND: 3,
  RECOMMENDED_FONTS: ['Arial', 'Helvetica', 'Open Sans'],
  STANDARD_BACKGROUND: 'rgba(0, 0, 0, 0.8)',
  STANDARD_TEXT_COLOR: '#FFFFFF',
  STANDARD_FONT_SIZE: 16
};

export default {
  CaptionValidator,
  CaptionFormatter,
  SRTGenerator,
  VTTGenerator,
  CAPTIONING_STANDARDS
};
