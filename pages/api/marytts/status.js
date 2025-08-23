// MaryTTS Status Check API
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if MaryTTS server is running
    const maryUrl = 'http://localhost:59125/version';
    
    const response = await fetch(maryUrl, {
      method: 'GET',
      timeout: 5000
    });

    if (response.ok) {
      const version = await response.text();
      
      // Also check available voices
      const voicesResponse = await fetch('http://localhost:59125/voices', {
        timeout: 5000
      });
      
      let voices = [];
      if (voicesResponse.ok) {
        const voicesText = await voicesResponse.text();
        voices = voicesText.split('\n').filter(line => line.trim());
      }

      res.status(200).json({
        available: true,
        version: version.trim(),
        voices,
        server: 'http://localhost:59125'
      });
      
    } else {
      throw new Error('MaryTTS server not responding');
    }

  } catch (error) {
    // MaryTTS not available
    res.status(200).json({
      available: false,
      error: error.message,
      installInstructions: {
        title: 'Install MaryTTS for High-Quality Voices',
        steps: [
          '1. Download MaryTTS from GitHub releases',
          '2. Extract to your desired location',
          '3. Run: ./bin/marytts-server (Linux/Mac) or bin\\marytts-server.bat (Windows)',
          '4. Server will start on http://localhost:59125',
          '5. Refresh this page to enable high-quality TTS'
        ],
        benefits: [
          '🎤 Professional voice quality',
          '🔒 Local processing (privacy)',
          '💰 No API costs',
          '🎛️ Voice customization options'
        ]
      }
    });
  }
}

export const config = {
  api: {
    externalResolver: true,
  },
}