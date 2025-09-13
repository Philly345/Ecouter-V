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