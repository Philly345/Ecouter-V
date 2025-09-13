// Test script to check API key configuration
console.log('🔍 Checking API Key Configuration...\n');

// Check for OpenRouter API key
const openRouterKey = process.env.OPENROUTER_API_KEY;
const openAIKey = process.env.OPENAI_API_KEY;

console.log('Environment Variables Status:');
console.log('├─ OPENROUTER_API_KEY:', openRouterKey ? '✅ Found' : '❌ Missing');
console.log('├─ OPENAI_API_KEY:', openAIKey ? '✅ Found' : '❌ Missing');

if (openRouterKey) {
  console.log('├─ OpenRouter Key Preview:', openRouterKey.substring(0, 8) + '...' + openRouterKey.slice(-4));
}

if (openAIKey) {
  console.log('├─ OpenAI Key Preview:', openAIKey.substring(0, 8) + '...' + openAIKey.slice(-4));
}

console.log('\n🔧 Configuration Instructions:');
console.log('');

if (!openRouterKey && !openAIKey) {
  console.log('❌ No API keys found! You need to set up an OpenRouter API key.');
  console.log('');
  console.log('📝 To fix this:');
  console.log('1. Go to https://openrouter.ai/keys');
  console.log('2. Create a free account and generate an API key');
  console.log('3. Add to your .env.local file:');
  console.log('   OPENROUTER_API_KEY=sk-or-v1-your-key-here');
  console.log('4. Restart your development server');
} else if (!openRouterKey && openAIKey) {
  console.log('⚠️  Only OpenAI key found. The chat feature uses OpenRouter.');
  console.log('');
  console.log('📝 To fix this:');
  console.log('1. Go to https://openrouter.ai/keys');
  console.log('2. Create a free account and generate an API key');
  console.log('3. Add to your .env.local file:');
  console.log('   OPENROUTER_API_KEY=sk-or-v1-your-key-here');
  console.log('4. Restart your development server');
  console.log('');
  console.log('💡 Note: OpenRouter provides free models that work great for chat!');
} else if (openRouterKey) {
  console.log('✅ OpenRouter API key found! Chat should work properly.');
  console.log('');
  console.log('🔍 If you\'re still getting errors:');
  console.log('1. Make sure your OpenRouter account has credits');
  console.log('2. Check if the key is valid at https://openrouter.ai/keys');
  console.log('3. Restart your development server');
}

console.log('');
console.log('🆓 Free Models Available on OpenRouter:');
console.log('├─ openai/gpt-oss-20b:free (currently used)');
console.log('├─ microsoft/wizardlm-2-8x22b:free');
console.log('├─ google/gemma-7b-it:free');
console.log('└─ And many more at https://openrouter.ai/models');

console.log('');
console.log('💡 Pro Tip: OpenRouter offers $5 free credits for new users!');