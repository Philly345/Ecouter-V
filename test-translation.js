// Test translation functionality directly
// Use global fetch (Node 18+) or fallback

// Copy translation constants and functions for testing
const SUPPORTED_LANGUAGES = {
  'en': 'English',
  'es': 'Spanish', 
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ru': 'Russian',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh': 'Chinese (Simplified)'
};

async function translateText(text, fromLang = 'en', toLang = 'fr') {
  try {
    if (fromLang === toLang) return text;
    if (!text || text.trim().length < 2) return text;

    const params = new URLSearchParams({
      q: text.trim(),
      langpair: `${fromLang}|${toLang}`,
      de: 'ecouter@example.com'
    });

    const response = await fetch(`https://api.mymemory.translated.net/get?${params}`, {
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
    return text;
  }
}

function detectLanguage(text) {
  if (!text || text.trim().length < 10) return 'en';
  
  const lowerText = text.toLowerCase();
  
  const patterns = {
    'fr': /\b(le|la|les|de|du|des|et|est|une|un|dans|pour|avec|sur|par|ce|qui|que|dont|où|comme|mais|ou|donc|car|ni|très|plus|moins|bien|mal|tout|tous|toute|toutes|bonjour|merci|oui|non)\b/gi,
    'es': /\b(el|la|los|las|de|del|y|es|una|un|en|para|con|por|que|se|te|me|le|lo|no|sí|muy|más|menos|bien|mal|todo|todos|toda|todas|hola|gracias)\b/gi,
    'de': /\b(der|die|das|den|dem|des|und|ist|eine|ein|in|für|mit|von|zu|auf|bei|nach|über|unter|vor|hinter|neben|zwischen|durch|gegen|ohne|um|seit|während|wegen|trotz|statt|anstatt|außer|bis|hallo|danke|ja|nein|sehr|mehr|weniger|gut|schlecht)\b/gi,
    'it': /\b(il|la|lo|gli|le|di|del|della|delle|dei|degli|e|è|una|un|in|per|con|da|su|tra|fra|che|si|ti|mi|ci|vi|li|le|ne|non|sì|molto|più|meno|bene|male|tutto|tutti|tutta|tutte|ciao|grazie)\b/gi,
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
  
  return maxMatches >= 3 ? detectedLang : 'en';
}

async function testTranslation() {
  console.log('🌍 Testing MyMemory Translation API...');
  
  const testCases = [
    {
      text: 'Hello, how are you today?',
      from: 'en',
      to: 'fr',
      expected: 'French translation'
    },
    {
      text: 'The weather is beautiful today.',
      from: 'en',
      to: 'es',
      expected: 'Spanish translation'
    },
    {
      text: 'I love programming in JavaScript.',
      from: 'en',
      to: 'de',
      expected: 'German translation'
    },
    {
      text: 'This is a test of the translation system.',
      from: 'en',
      to: 'it',
      expected: 'Italian translation'
    }
  ];
  
  console.log('\n📋 Supported Languages:');
  console.log(`Total: ${Object.keys(SUPPORTED_LANGUAGES).length} languages`);
  Object.entries(SUPPORTED_LANGUAGES).slice(0, 10).forEach(([code, name]) => {
    console.log(`  ${code}: ${name}`);
  });
  console.log('  ... and more\n');
  
  for (const testCase of testCases) {
    try {
      console.log(`🔄 Testing: "${testCase.text}"`);
      console.log(`   ${SUPPORTED_LANGUAGES[testCase.from]} → ${SUPPORTED_LANGUAGES[testCase.to]}`);
      
      const result = await translateText(testCase.text, testCase.from, testCase.to);
      
      console.log(`✅ Result: "${result}"`);
      console.log('');
      
      // Small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Translation failed:`, error.message);
      console.log('');
    }
  }
  
  // Test language detection
  console.log('🔍 Testing Language Detection:');
  const detectionTests = [
    'Hello, how are you today?',
    'Bonjour, comment allez-vous?',
    'Hola, ¿cómo está usted?',
    'Guten Tag, wie geht es Ihnen?',
    'Ciao, come stai oggi?',
    'Привет, как дела сегодня?'
  ];
  
  for (const text of detectionTests) {
    const detected = detectLanguage(text);
    console.log(`"${text}" → Detected: ${detected} (${SUPPORTED_LANGUAGES[detected]})`);
  }
  
  console.log('\n✅ Translation testing completed!');
}

testTranslation().catch(console.error);