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

// MYMEMORY Translation API (Free, more reliable than Google Translate)
export async function translateText(text, targetLanguage, sourceLanguage = 'en') {
  // Only skip translation if source and target are the same
  if (targetLanguage === sourceLanguage) {
    console.log(`⏭️ Skipping translation: source and target are both ${sourceLanguage}`);
    return text; // No translation needed
  }

  try {
    console.log(`🌐 Starting translation from ${sourceLanguage} to ${targetLanguage}`);
    
    // Split long text into chunks (MYMEMORY has a limit of ~500 characters per request)
    const chunks = splitTextIntoChunks(text, 450);
    const translatedChunks = [];
    
    // Get email from environment for MYMEMORY API (improves rate limits)
    const email = process.env.MYMEMORY_EMAIL || '';
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`🔄 Translating chunk ${i + 1}/${chunks.length} (${chunk.length} chars)`);
      
      let success = false;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (!success && attempts < maxAttempts) {
        attempts++;
        
        try {
          // Build MYMEMORY API URL
          let url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=${sourceLanguage}|${targetLanguage}`;
          
          // Add email if available (increases daily quota)
          if (email) {
            url += `&de=${encodeURIComponent(email)}`;
          }
          
          const response = await fetch(url);
          
          if (response.ok) {
            const data = await response.json();
            
            // Check for rate limit in response
            if (data && data.responseStatus === 429) {
              console.log(`Rate limit hit for chunk ${i + 1}, attempt ${attempts}/${maxAttempts}`);
              if (attempts < maxAttempts) {
                const waitTime = Math.min(2000 * attempts, 8000); // 2s, 4s, 8s
                console.log(`⏳ Waiting ${waitTime}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
              }
            }
            
            // MYMEMORY returns: { responseData: { translatedText: "..." }, responseStatus: 200 }
            if (data && data.responseData && data.responseData.translatedText) {
              const translatedText = data.responseData.translatedText;
              translatedChunks.push(translatedText);
              console.log(`✅ Chunk ${i + 1} translated successfully`);
              success = true;
            } else {
              console.warn('Unexpected MYMEMORY response format:', data);
              translatedChunks.push(chunk); // Use original text if format is unexpected
              success = true;
            }
          } else if (response.status === 429) {
            console.log(`Rate limit hit for chunk ${i + 1}, attempt ${attempts}/${maxAttempts}`);
            if (attempts < maxAttempts) {
              const waitTime = Math.min(2000 * attempts, 8000);
              console.log(`⏳ Waiting ${waitTime}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue;
            }
          } else {
            console.warn('MYMEMORY request failed:', response.status, response.statusText);
            break; // Exit retry loop and try fallback
          }
        } catch (fetchError) {
          console.error(`Translation attempt ${attempts} failed:`, fetchError);
          if (attempts >= maxAttempts) break;
        }
      }
      
      // If all attempts failed, try Google Translate fallback
      if (!success) {
        try {
          console.log('🔄 Trying Google Translate fallback...');
          const googleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLanguage}&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(chunk)}`;
          const googleResponse = await fetch(googleUrl);
          
          if (googleResponse.ok) {
            const googleData = await googleResponse.json();
            if (googleData && googleData[0] && Array.isArray(googleData[0])) {
              const translatedText = googleData[0].map(segment => segment[0]).join('');
              translatedChunks.push(translatedText);
              console.log(`✅ Chunk ${i + 1} translated with Google fallback`);
            } else {
              console.warn(`Google fallback returned unexpected format for chunk ${i + 1}`);
              translatedChunks.push(chunk);
            }
          } else {
            console.warn(`Google fallback failed with status ${googleResponse.status} for chunk ${i + 1}`);
            translatedChunks.push(chunk);
          }
        } catch (fallbackError) {
          console.warn('Google Translate fallback also failed:', fallbackError);
          translatedChunks.push(chunk); // Use original text if both fail
        }
      }
      
      // Add delay to respect rate limits
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Increased delay
      }
    }

    const finalTranslation = translatedChunks.join(' ');
    console.log(`✅ Translation completed: ${text.length} chars -> ${finalTranslation.length} chars`);
    return finalTranslation;
    
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

// Get our language code from AssemblyAI language code
export function getLanguageCodeFromAssemblyCode(assemblyCode) {
    // AssemblyAI might return a regional code like 'en_us', so we take the base 'en'
    const baseCode = assemblyCode.split('_')[0];
    const language = SUPPORTED_LANGUAGES.find(lang => lang.assemblyCode === baseCode);
    if (language) {
        return language.code;
    }
    // If we can't find a direct match for the assembly code, try matching the base code itself
    const fallbackLanguage = SUPPORTED_LANGUAGES.find(lang => lang.code === baseCode);
    return fallbackLanguage?.code || 'en'; // Default to 'en' if no match is found
}
