// Translation utilities using MyMemory API
const MYMEMORY_API_URL = 'https://api.mymemory.translated.net/get';

// Language mapping for MyMemory API
export const SUPPORTED_LANGUAGES = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh': 'Chinese (Simplified)',
  'ar': 'Arabic',
  'hi': 'Hindi',
  'tr': 'Turkish',
  'pl': 'Polish',
  'nl': 'Dutch',
  'sv': 'Swedish',
  'da': 'Danish',
  'no': 'Norwegian',
  'fi': 'Finnish',
  'cs': 'Czech',
  'hu': 'Hungarian',
  'ro': 'Romanian',
  'bg': 'Bulgarian',
  'hr': 'Croatian',
  'sk': 'Slovak',
  'sl': 'Slovenian',
  'et': 'Estonian',
  'lv': 'Latvian',
  'lt': 'Lithuanian',
  'mt': 'Maltese',
  'el': 'Greek',
  'th': 'Thai',
  'vi': 'Vietnamese',
  'id': 'Indonesian',
  'ms': 'Malay',
  'tl': 'Filipino',
  'he': 'Hebrew',
  'fa': 'Persian',
  'ur': 'Urdu',
  'bn': 'Bengali',
  'ta': 'Tamil',
  'te': 'Telugu',
  'ml': 'Malayalam',
  'kn': 'Kannada',
  'gu': 'Gujarati',
  'pa': 'Punjabi',
  'mr': 'Marathi',
  'ne': 'Nepali',
  'si': 'Sinhala',
  'my': 'Myanmar',
  'km': 'Khmer',
  'lo': 'Lao',
  'ka': 'Georgian',
  'am': 'Amharic',
  'sw': 'Swahili',
  'zu': 'Zulu',
  'af': 'Afrikaans',
  'sq': 'Albanian',
  'az': 'Azerbaijani',
  'be': 'Belarusian',
  'bs': 'Bosnian',
  'eu': 'Basque',
  'gl': 'Galician',
  'is': 'Icelandic',
  'ga': 'Irish',
  'mk': 'Macedonian',
  'cy': 'Welsh',
  'eo': 'Esperanto'
};

// Speech Recognition language mapping for Web Speech API
export const SPEECH_RECOGNITION_LANGUAGES = {
  'en': 'en-US',
  'es': 'es-ES',
  'fr': 'fr-FR',
  'de': 'de-DE',
  'it': 'it-IT',
  'pt': 'pt-PT',
  'ru': 'ru-RU',
  'ja': 'ja-JP',
  'ko': 'ko-KR',
  'zh': 'zh-CN',
  'ar': 'ar-SA',
  'hi': 'hi-IN',
  'tr': 'tr-TR',
  'pl': 'pl-PL',
  'nl': 'nl-NL',
  'sv': 'sv-SE',
  'da': 'da-DK',
  'no': 'nb-NO',
  'fi': 'fi-FI',
  'cs': 'cs-CZ',
  'hu': 'hu-HU',
  'ro': 'ro-RO',
  'bg': 'bg-BG',
  'hr': 'hr-HR',
  'sk': 'sk-SK',
  'sl': 'sl-SI',
  'et': 'et-EE',
  'lv': 'lv-LV',
  'lt': 'lt-LT',
  'el': 'el-GR',
  'th': 'th-TH',
  'vi': 'vi-VN',
  'id': 'id-ID',
  'ms': 'ms-MY',
  'he': 'he-IL',
  'fa': 'fa-IR',
  'ur': 'ur-PK',
  'bn': 'bn-BD',
  'ta': 'ta-IN',
  'te': 'te-IN',
  'ml': 'ml-IN',
  'kn': 'kn-IN',
  'gu': 'gu-IN',
  'pa': 'pa-IN',
  'mr': 'mr-IN',
  'ne': 'ne-NP',
  'si': 'si-LK',
  'my': 'my-MM',
  'km': 'km-KH',
  'lo': 'lo-LA',
  'ka': 'ka-GE',
  'am': 'am-ET',
  'sw': 'sw-TZ',
  'zu': 'zu-ZA',
  'af': 'af-ZA'
};

/**
 * Translate text using MyMemory API
 * @param {string} text - Text to translate
 * @param {string} fromLang - Source language code (e.g., 'en')
 * @param {string} toLang - Target language code (e.g., 'fr')
 * @returns {Promise<string>} - Translated text
 */
export async function translateText(text, fromLang = 'en', toLang = 'fr') {
  try {
    // Skip translation if source and target are the same
    if (fromLang === toLang) {
      return text;
    }

    // Skip translation for very short text
    if (!text || text.trim().length < 2) {
      return text;
    }

    const params = new URLSearchParams({
      q: text.trim(),
      langpair: `${fromLang}|${toLang}`,
      de: 'ecouter@example.com' // Email for better rate limits
    });

    const response = await fetch(`${MYMEMORY_API_URL}?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'EcouterApp/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.responseStatus === 200 && data.responseData) {
      const translatedText = data.responseData.translatedText;
      
      // MyMemory sometimes returns "PLEASE SELECT TWO DIFFERENT LANGUAGES" or similar errors
      if (translatedText.includes('PLEASE SELECT') || translatedText.includes('DIFFERENT LANGUAGES')) {
        console.warn('Translation service returned error message, using original text');
        return text;
      }
      
      return translatedText;
    } else {
      throw new Error('Invalid translation response');
    }
    
  } catch (error) {
    console.error('Translation error:', error);
    // Return original text on error
    return text;
  }
}

/**
 * Batch translate multiple texts
 * @param {Array} texts - Array of texts to translate
 * @param {string} fromLang - Source language code
 * @param {string} toLang - Target language code
 * @returns {Promise<Array>} - Array of translated texts
 */
export async function batchTranslate(texts, fromLang = 'en', toLang = 'fr') {
  const translations = [];
  
  for (const text of texts) {
    try {
      const translated = await translateText(text, fromLang, toLang);
      translations.push(translated);
      
      // Add small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Batch translation error for text:', text, error);
      translations.push(text); // Use original text on error
    }
  }
  
  return translations;
}

/**
 * Get the speech recognition language code for Web Speech API
 * @param {string} langCode - Language code (e.g., 'en', 'fr')
 * @returns {string} - Speech recognition language code (e.g., 'en-US', 'fr-FR')
 */
export function getSpeechRecognitionLanguage(langCode) {
  return SPEECH_RECOGNITION_LANGUAGES[langCode] || 'en-US';
}

/**
 * Auto-detect language of text (simple heuristic)
 * @param {string} text - Text to analyze
 * @returns {string} - Detected language code
 */
export function detectLanguage(text) {
  if (!text || text.trim().length < 10) {
    return 'en'; // Default to English for short texts
  }
  
  const lowerText = text.toLowerCase();
  
  // Simple keyword-based detection
  const patterns = {
    'fr': /\b(le|la|les|de|du|des|et|est|une|un|dans|pour|avec|sur|par|ce|qui|que|dont|où|comme|mais|ou|donc|car|ni|très|plus|moins|bien|mal|tout|tous|toute|toutes|bonjour|merci|oui|non|peut|être|avoir|faire|aller|voir|savoir|pouvoir|vouloir|devoir|venir|partir|prendre|donner|mettre|dire|croire|penser|trouver|chercher|regarder|écouter|parler|demander|répondre|aimer|détester)\b/gi,
    'es': /\b(el|la|los|las|de|del|y|es|una|un|en|para|con|por|que|se|te|me|le|lo|no|sí|muy|más|menos|bien|mal|todo|todos|toda|todas|hola|gracias|puede|ser|tener|hacer|ir|ver|saber|poder|querer|deber|venir|partir|tomar|dar|poner|decir|creer|pensar|encontrar|buscar|mirar|escuchar|hablar|preguntar|responder|amar|odiar)\b/gi,
    'de': /\b(der|die|das|den|dem|des|und|ist|eine|ein|in|für|mit|von|zu|auf|bei|nach|über|unter|vor|hinter|neben|zwischen|durch|gegen|ohne|um|seit|während|wegen|trotz|statt|anstatt|außer|bis|entlang|gegenüber|gemäß|laut|entsprechend|zufolge|dank|kraft|mangels|mittels|namens|seitens|zwecks|hallo|danke|ja|nein|sehr|mehr|weniger|gut|schlecht|alle|ganz|können|sein|haben|werden|machen|gehen|sehen|wissen|wollen|sollen|müssen|dürfen|mögen|kommen|geben|nehmen|sagen|denken|finden|suchen|schauen|hören|sprechen|fragen|antworten|lieben|hassen)\b/gi,
    'it': /\b(il|la|lo|gli|le|di|del|della|delle|dei|degli|e|è|una|un|in|per|con|da|su|tra|fra|che|si|ti|mi|ci|vi|li|le|ne|non|sì|molto|più|meno|bene|male|tutto|tutti|tutta|tutte|ciao|grazie|può|essere|avere|fare|andare|vedere|sapere|potere|volere|dovere|venire|partire|prendere|dare|mettere|dire|credere|pensare|trovare|cercare|guardare|sentire|parlare|domandare|rispondere|amare|odiare)\b/gi,
    'pt': /\b(o|a|os|as|de|do|da|dos|das|e|é|uma|um|em|para|com|por|que|se|te|me|lhe|lhes|não|sim|muito|mais|menos|bem|mal|todo|todos|toda|todas|olá|obrigado|obrigada|pode|ser|ter|fazer|ir|ver|saber|poder|querer|dever|vir|partir|tomar|dar|pôr|dizer|crer|pensar|encontrar|procurar|olhar|ouvir|falar|perguntar|responder|amar|odiar)\b/gi,
    'ru': /\b(и|в|не|на|я|быть|тот|он|оно|она|они|а|то|всё|так|его|но|да|ты|к|у|же|вы|за|бы|по|только|её|мне|было|вот|от|меня|ещё|нет|о|из|ему|теперь|когда|даже|ну|вдруг|ли|если|уже|или|ни|где|очень|там|что|это|как|для|что-то|кто-то|сейчас|здесь|может|могу|можно|нужно|надо|хочу|хочет|хотим|знаю|знает|знаем|думаю|думает|думаем|люблю|любит|любим|работаю|работает|работаем|живу|живет|живем|говорю|говорит|говорим|понимаю|понимает|понимаем)\b/gi
  };
  
  let maxMatches = 0;
  let detectedLang = 'en';
  
  for (const [lang, pattern] of Object.entries(patterns)) {
    const matches = (lowerText.match(pattern) || []).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      detectedLang = lang;
    }
  }
  
  // Require at least 3 matches for non-English detection
  return maxMatches >= 3 ? detectedLang : 'en';
}

export default {
  translateText,
  batchTranslate,
  getSpeechRecognitionLanguage,
  detectLanguage,
  SUPPORTED_LANGUAGES,
  SPEECH_RECOGNITION_LANGUAGES
};