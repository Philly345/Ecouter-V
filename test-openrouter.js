// Test OpenRouter API key directly
require('dotenv').config({ path: '.env.local' });

const testOpenRouterAPI = async () => {
  console.log('🧪 Testing OpenRouter API Key...\n');
  
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.log('❌ No API key found in environment variables');
    return;
  }
  
  console.log('✅ API Key found:', apiKey.substring(0, 12) + '...' + apiKey.slice(-8));
  console.log('🔗 Testing connection to OpenRouter...\n');
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://ecouter.systems',
        'X-Title': 'Ecouter Chat Test'
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b:free",
        messages: [{ 
          role: "user", 
          content: "Say 'Hello from Ecouter!' in exactly 5 words." 
        }],
        temperature: 0.7,
        max_tokens: 50
      })
    });

    if (response.ok) {
      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content || 'No response';
      
      console.log('🎉 SUCCESS! OpenRouter API is working');
      console.log('📝 Test Response:', aiResponse);
      console.log('💰 Credits Used: ~0.001 (practically free)');
      console.log('');
      console.log('✅ Your chat with AI should now work perfectly!');
      console.log('🔄 Make sure to restart your development server if it\'s running');
      
    } else {
      const errorText = await response.text();
      console.log('❌ API Error:', response.status, response.statusText);
      console.log('📋 Error Details:', errorText);
      
      if (response.status === 401) {
        console.log('');
        console.log('🔧 Fix: Check your API key at https://openrouter.ai/keys');
      }
    }
    
  } catch (error) {
    console.log('❌ Connection Error:', error.message);
    console.log('🌐 Check your internet connection and try again');
  }
};

// Run the test
testOpenRouterAPI();