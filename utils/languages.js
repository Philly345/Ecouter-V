// Comprehensive language support for transcription and translation
export const SUPPORTED_LANGUAGES = [
  // Major Languages with AssemblyAI Support
  { code: 'en', name: 'English', assemblyCode: 'en' },
  { code: 'es', name: 'Spanish', assemblyCode: 'es' },
  { code: 'fr', name: 'French', assemblyCode: 'fr' },
  { code: 'de', name: 'German', assemblyCode: 'de' },
  { code: 'it', name: 'Italian', assemblyCode: 'it' },
  { code: 'pt', name: 'Portuguese', assemblyCode: 'pt' },
  { code: 'nl', name: 'Dutch', assemblyCode: 'nl' },
  { code: 'ja', name: 'Japanese', assemblyCode: 'ja' },
  { code: 'zh', name: 'Chinese (Simplified)', assemblyCode: 'zh' },
  { code: 'ko', name: 'Korean', assemblyCode: 'ko' },
  { code: 'hi', name: 'Hindi', assemblyCode: 'hi' },
  { code: 'ru', name: 'Russian', assemblyCode: 'ru' },
  { code: 'ar', name: 'Arabic', assemblyCode: 'ar' },
  { code: 'tr', name: 'Turkish', assemblyCode: 'tr' },
  { code: 'pl', name: 'Polish', assemblyCode: 'pl' },
  { code: 'sv', name: 'Swedish', assemblyCode: 'sv' },
  { code: 'no', name: 'Norwegian', assemblyCode: 'no' },
  { code: 'da', name: 'Danish', assemblyCode: 'da' },
  { code: 'fi', name: 'Finnish', assemblyCode: 'fi' },
  { code: 'uk', name: 'Ukrainian', assemblyCode: 'uk' },
  { code: 'cs', name: 'Czech', assemblyCode: 'cs' },
  { code: 'sk', name: 'Slovak', assemblyCode: 'sk' },
  { code: 'hu', name: 'Hungarian', assemblyCode: 'hu' },
  { code: 'ro', name: 'Romanian', assemblyCode: 'ro' },
  { code: 'bg', name: 'Bulgarian', assemblyCode: 'bg' },
  { code: 'hr', name: 'Croatian', assemblyCode: 'hr' },
  { code: 'sl', name: 'Slovenian', assemblyCode: 'sl' },
  { code: 'sr', name: 'Serbian', assemblyCode: 'sr' },
  { code: 'et', name: 'Estonian', assemblyCode: 'et' },
  { code: 'lv', name: 'Latvian', assemblyCode: 'lv' },
  { code: 'lt', name: 'Lithuanian', assemblyCode: 'lt' },
  { code: 'el', name: 'Greek', assemblyCode: 'el' },
  { code: 'he', name: 'Hebrew', assemblyCode: 'he' },
  { code: 'th', name: 'Thai', assemblyCode: 'th' },
  { code: 'vi', name: 'Vietnamese', assemblyCode: 'vi' },
  { code: 'id', name: 'Indonesian', assemblyCode: 'id' },
  { code: 'ms', name: 'Malay', assemblyCode: 'ms' },
  { code: 'tl', name: 'Filipino', assemblyCode: 'tl' },
  
  // Additional World Languages (using English transcription + translation)
  { code: 'af', name: 'Afrikaans', assemblyCode: 'en', needsTranslation: true },
  { code: 'sq', name: 'Albanian', assemblyCode: 'en', needsTranslation: true },
  { code: 'am', name: 'Amharic', assemblyCode: 'en', needsTranslation: true },
  { code: 'hy', name: 'Armenian', assemblyCode: 'en', needsTranslation: true },
  { code: 'az', name: 'Azerbaijani', assemblyCode: 'en', needsTranslation: true },
  { code: 'eu', name: 'Basque', assemblyCode: 'en', needsTranslation: true },
  { code: 'be', name: 'Belarusian', assemblyCode: 'en', needsTranslation: true },
  { code: 'bn', name: 'Bengali', assemblyCode: 'en', needsTranslation: true },
  { code: 'bs', name: 'Bosnian', assemblyCode: 'en', needsTranslation: true },
  { code: 'ca', name: 'Catalan', assemblyCode: 'en', needsTranslation: true },
  { code: 'ceb', name: 'Cebuano', assemblyCode: 'en', needsTranslation: true },
  { code: 'ny', name: 'Chichewa', assemblyCode: 'en', needsTranslation: true },
  { code: 'co', name: 'Corsican', assemblyCode: 'en', needsTranslation: true },
  { code: 'cy', name: 'Welsh', assemblyCode: 'en', needsTranslation: true },
  { code: 'eo', name: 'Esperanto', assemblyCode: 'en', needsTranslation: true },
  { code: 'fa', name: 'Persian', assemblyCode: 'en', needsTranslation: true },
  { code: 'fy', name: 'Frisian', assemblyCode: 'en', needsTranslation: true },
  { code: 'gl', name: 'Galician', assemblyCode: 'en', needsTranslation: true },
  { code: 'ka', name: 'Georgian', assemblyCode: 'en', needsTranslation: true },
  { code: 'gu', name: 'Gujarati', assemblyCode: 'en', needsTranslation: true },
  { code: 'ht', name: 'Haitian Creole', assemblyCode: 'en', needsTranslation: true },
  { code: 'ha', name: 'Hausa', assemblyCode: 'en', needsTranslation: true },
  { code: 'haw', name: 'Hawaiian', assemblyCode: 'en', needsTranslation: true },
  { code: 'hmn', name: 'Hmong', assemblyCode: 'en', needsTranslation: true },
  { code: 'is', name: 'Icelandic', assemblyCode: 'en', needsTranslation: true },
  { code: 'ig', name: 'Igbo', assemblyCode: 'en', needsTranslation: true },
  { code: 'ga', name: 'Irish', assemblyCode: 'en', needsTranslation: true },
  { code: 'jw', name: 'Javanese', assemblyCode: 'en', needsTranslation: true },
  { code: 'kn', name: 'Kannada', assemblyCode: 'en', needsTranslation: true },
  { code: 'kk', name: 'Kazakh', assemblyCode: 'en', needsTranslation: true },
  { code: 'km', name: 'Khmer', assemblyCode: 'en', needsTranslation: true },
  { code: 'rw', name: 'Kinyarwanda', assemblyCode: 'en', needsTranslation: true },
  { code: 'ku', name: 'Kurdish', assemblyCode: 'en', needsTranslation: true },
  { code: 'ky', name: 'Kyrgyz', assemblyCode: 'en', needsTranslation: true },
  { code: 'lo', name: 'Lao', assemblyCode: 'en', needsTranslation: true },
  { code: 'la', name: 'Latin', assemblyCode: 'en', needsTranslation: true },
  { code: 'lb', name: 'Luxembourgish', assemblyCode: 'en', needsTranslation: true },
  { code: 'mk', name: 'Macedonian', assemblyCode: 'en', needsTranslation: true },
  { code: 'mg', name: 'Malagasy', assemblyCode: 'en', needsTranslation: true },
  { code: 'ml', name: 'Malayalam', assemblyCode: 'en', needsTranslation: true },
  { code: 'mt', name: 'Maltese', assemblyCode: 'en', needsTranslation: true },
  { code: 'mi', name: 'Maori', assemblyCode: 'en', needsTranslation: true },
  { code: 'mr', name: 'Marathi', assemblyCode: 'en', needsTranslation: true },
  { code: 'mn', name: 'Mongolian', assemblyCode: 'en', needsTranslation: true },
  { code: 'my', name: 'Myanmar (Burmese)', assemblyCode: 'en', needsTranslation: true },
  { code: 'ne', name: 'Nepali', assemblyCode: 'en', needsTranslation: true },
  { code: 'or', name: 'Odia', assemblyCode: 'en', needsTranslation: true },
  { code: 'ps', name: 'Pashto', assemblyCode: 'en', needsTranslation: true },
  { code: 'pa', name: 'Punjabi', assemblyCode: 'en', needsTranslation: true },
  { code: 'sm', name: 'Samoan', assemblyCode: 'en', needsTranslation: true },
  { code: 'gd', name: 'Scots Gaelic', assemblyCode: 'en', needsTranslation: true },
  { code: 'st', name: 'Sesotho', assemblyCode: 'en', needsTranslation: true },
  { code: 'sn', name: 'Shona', assemblyCode: 'en', needsTranslation: true },
  { code: 'sd', name: 'Sindhi', assemblyCode: 'en', needsTranslation: true },
  { code: 'si', name: 'Sinhala', assemblyCode: 'en', needsTranslation: true },
  { code: 'so', name: 'Somali', assemblyCode: 'en', needsTranslation: true },
  { code: 'su', name: 'Sundanese', assemblyCode: 'en', needsTranslation: true },
  { code: 'sw', name: 'Swahili', assemblyCode: 'en', needsTranslation: true },
  { code: 'tg', name: 'Tajik', assemblyCode: 'en', needsTranslation: true },
  { code: 'ta', name: 'Tamil', assemblyCode: 'en', needsTranslation: true },
  { code: 'tt', name: 'Tatar', assemblyCode: 'en', needsTranslation: true },
  { code: 'te', name: 'Telugu', assemblyCode: 'en', needsTranslation: true },
  { code: 'tk', name: 'Turkmen', assemblyCode: 'en', needsTranslation: true },
  { code: 'ur', name: 'Urdu', assemblyCode: 'en', needsTranslation: true },
  { code: 'ug', name: 'Uyghur', assemblyCode: 'en', needsTranslation: true },
  { code: 'uz', name: 'Uzbek', assemblyCode: 'en', needsTranslation: true },
  { code: 'xh', name: 'Xhosa', assemblyCode: 'en', needsTranslation: true },
  { code: 'yi', name: 'Yiddish', assemblyCode: 'en', needsTranslation: true },
  { code: 'yo', name: 'Yoruba', assemblyCode: 'en', needsTranslation: true },
  { code: 'zu', name: 'Zulu', assemblyCode: 'en', needsTranslation: true },
];

// Get AssemblyAI language code from our language code
export function getAssemblyLanguageCode(languageCode) {
  const language = SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode);
  return language?.assemblyCode || 'en';
}

// Get available AssemblyAI features for a specific language
export function getAvailableFeatures(languageCode) {
  const assemblyCode = getAssemblyLanguageCode(languageCode);
  
  // Features available by language (based on AssemblyAI documentation)
  const featureSupport = {
    // Full feature support (English and major languages)
    'en': {
      auto_chapters: true,
      speaker_labels: true,
      filter_profanity: true,
      punctuate: true,
      format_text: true,
      sentiment_analysis: true,
      entity_detection: true,
      summarization: true
    },
    'es': {
      auto_chapters: false,
      speaker_labels: true,
      filter_profanity: true,
      punctuate: true,
      format_text: true,
      sentiment_analysis: false,
      entity_detection: false,
      summarization: false
    },
    'fr': {
      auto_chapters: false,
      speaker_labels: true,
      filter_profanity: true,
      punctuate: true,
      format_text: true,
      sentiment_analysis: false,
      entity_detection: false,
      summarization: false
    },
    'de': {
      auto_chapters: false,
      speaker_labels: true,
      filter_profanity: true,
      punctuate: true,
      format_text: true,
      sentiment_analysis: false,
      entity_detection: false,
      summarization: false
    },
    'it': {
      auto_chapters: false,
      speaker_labels: true,
      filter_profanity: true,
      punctuate: true,
      format_text: true,
      sentiment_analysis: false,
      entity_detection: false,
      summarization: false
    },
    'pt': {
      auto_chapters: false,
      speaker_labels: true,
      filter_profanity: true,
      punctuate: true,
      format_text: true,
      sentiment_analysis: false,
      entity_detection: false,
      summarization: false
    },
    'nl': {
      auto_chapters: false,
      speaker_labels: true,
      filter_profanity: true,
      punctuate: true,
      format_text: true,
      sentiment_analysis: false,
      entity_detection: false,
      summarization: false
    }
  };
  
  // Default features for languages not explicitly listed
  const defaultFeatures = {
    auto_chapters: false,
    speaker_labels: true,
    filter_profanity: false,
    punctuate: true,
    format_text: true,
    sentiment_analysis: false,
    entity_detection: false,
    summarization: false
  };
  
  return featureSupport[assemblyCode] || defaultFeatures;
}

// Check if language needs translation after transcription
export function languageNeedsTranslation(languageCode) {
  const language = SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode);
  return language?.needsTranslation || false;
}

// Get language name from code
export function getLanguageName(languageCode) {
  const language = SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode);
  return language?.name || 'English';
}

// Google Translate API (Free, no API key required)
export async function translateText(text, targetLanguage, sourceLanguage = 'en') {
  if (targetLanguage === sourceLanguage || targetLanguage === 'en') {
    return text; // No translation needed
  }

  try {
    // Split long text into chunks (Google Translate works better with smaller chunks)
    const chunks = splitTextIntoChunks(text, 3000);
    const translatedChunks = [];

    for (const chunk of chunks) {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLanguage}&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(chunk)}`;
      
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        
        // Google Translate returns an array structure
        // data[0] contains translation segments
        if (data && data[0] && Array.isArray(data[0])) {
          const translatedText = data[0].map(segment => segment[0]).join('');
          translatedChunks.push(translatedText);
        } else {
          console.warn('Unexpected Google Translate response format');
          translatedChunks.push(chunk); // Use original text if format is unexpected
        }
      } else {
        console.warn('Google Translate request failed:', response.status);
        translatedChunks.push(chunk); // Use original text if request fails
      }
      
      // Add small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return translatedChunks.join(' ');
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original text if translation fails
  }
}

// Helper function to split text into manageable chunks
function splitTextIntoChunks(text, maxChunkSize) {
  if (text.length <= maxChunkSize) {
    return [text];
  }

  const chunks = [];
  let currentChunk = '';
  const sentences = text.split(/[.!?]+/);

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += sentence + '.';
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// Language code mapping for AI summary generation
export function getLanguageForAI(languageCode) {
  const languageNames = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'nl': 'Dutch',
    'ja': 'Japanese',
    'zh': 'Chinese',
    'ko': 'Korean',
    'hi': 'Hindi',
    'ru': 'Russian',
    'ar': 'Arabic',
    'tr': 'Turkish',
    'pl': 'Polish',
    'sv': 'Swedish',
    'no': 'Norwegian',
    'da': 'Danish',
    'fi': 'Finnish',
    'uk': 'Ukrainian',
    'cs': 'Czech',
    'sk': 'Slovak',
    'hu': 'Hungarian',
    'ro': 'Romanian',
    'bg': 'Bulgarian',
    'hr': 'Croatian',
    'sl': 'Slovenian',
    'sr': 'Serbian',
    'et': 'Estonian',
    'lv': 'Latvian',
    'lt': 'Lithuanian',
    'el': 'Greek',
    'he': 'Hebrew',
    'th': 'Thai',
    'vi': 'Vietnamese',
    'id': 'Indonesian',
    'ms': 'Malay',
    'tl': 'Filipino',
    'af': 'Afrikaans',
    'sq': 'Albanian',
    'am': 'Amharic',
    'hy': 'Armenian',
    'az': 'Azerbaijani',
    'eu': 'Basque',
    'be': 'Belarusian',
    'bn': 'Bengali',
    'bs': 'Bosnian',
    'ca': 'Catalan',
    'ceb': 'Cebuano',
    'ny': 'Chichewa',
    'co': 'Corsican',
    'cy': 'Welsh',
    'eo': 'Esperanto',
    'fa': 'Persian',
    'fy': 'Frisian',
    'gl': 'Galician',
    'ka': 'Georgian',
    'gu': 'Gujarati',
    'ht': 'Haitian Creole',
    'ha': 'Hausa',
    'haw': 'Hawaiian',
    'hmn': 'Hmong',
    'is': 'Icelandic',
    'ig': 'Igbo',
    'ga': 'Irish',
    'jw': 'Javanese',
    'kn': 'Kannada',
    'kk': 'Kazakh',
    'km': 'Khmer',
    'rw': 'Kinyarwanda',
    'ku': 'Kurdish',
    'ky': 'Kyrgyz',
    'lo': 'Lao',
    'la': 'Latin',
    'lb': 'Luxembourgish',
    'mk': 'Macedonian',
    'mg': 'Malagasy',
    'ml': 'Malayalam',
    'mt': 'Maltese',
    'mi': 'Maori',
    'mr': 'Marathi',
    'mn': 'Mongolian',
    'my': 'Myanmar (Burmese)',
    'ne': 'Nepali',
    'or': 'Odia',
    'ps': 'Pashto',
    'pa': 'Punjabi',
    'sm': 'Samoan',
    'gd': 'Scots Gaelic',
    'st': 'Sesotho',
    'sn': 'Shona',
    'sd': 'Sindhi',
    'si': 'Sinhala',
    'so': 'Somali',
    'su': 'Sundanese',
    'sw': 'Swahili',
    'tg': 'Tajik',
    'ta': 'Tamil',
    'tt': 'Tatar',
    'te': 'Telugu',
    'tk': 'Turkmen',
    'ur': 'Urdu',
    'ug': 'Uyghur',
    'uz': 'Uzbek',
    'xh': 'Xhosa',
    'yi': 'Yiddish',
    'yo': 'Yoruba',
    'zu': 'Zulu',
  };
  
  return languageNames[languageCode] || 'English';
}
