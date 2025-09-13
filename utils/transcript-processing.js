/**
 * Transcript Processing Utilities
 * Handles verbatim vs non-verbatim transcript cleaning
 */

/**
 * Process transcript based on verbatim preference
 * @param {string} transcript - Raw transcript text
 * @param {boolean} isVerbatim - Whether to keep verbatim (true) or clean (false)
 * @returns {string} Processed transcript
 */
export function processTranscript(transcript, isVerbatim) {
  if (!transcript || typeof transcript !== 'string') {
    return transcript || '';
  }

  // If verbatim is requested, return as-is
  if (isVerbatim) {
    return transcript;
  }

  // Non-verbatim: Clean the transcript
  return cleanTranscript(transcript);
}

/**
 * Clean transcript by removing filler words, repetitions, and false starts
 * @param {string} transcript - Raw transcript text
 * @returns {string} Cleaned transcript
 */
export function cleanTranscript(transcript) {
  if (!transcript || typeof transcript !== 'string') {
    return transcript || '';
  }

  let cleaned = transcript;

  // Define filler words and hesitations to remove
  const fillerWords = [
    'um', 'uh', 'er', 'ah', 'mm', 'hmm', 'hm', 'mm-hmm', 'uh-huh',
    'you know', 'like', 'so', 'well', 'right', 'okay', 'ok',
    'actually', 'basically', 'literally', 'totally', 'seriously',
    'honestly', 'obviously', 'clearly', 'definitely', 'absolutely',
    'sort of', 'kind of', 'kinda', 'sorta', 'pretty much',
    'i mean', 'you see', 'you understand', 'if you will',
    'as it were', 'so to speak', 'in a sense', 'in a way'
  ];

  // Remove standalone filler words (case insensitive)
  // This regex matches filler words that are standalone (bounded by word boundaries)
  fillerWords.forEach(filler => {
    const regex = new RegExp(`\\b${filler.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    cleaned = cleaned.replace(regex, '');
  });

  // Remove repetitions (words repeated 2+ times consecutively)
  // Example: "I I I think" -> "I think"
  cleaned = cleaned.replace(/\b(\w+)(\s+\1){1,}\b/gi, '$1');

  // Remove false starts and incomplete thoughts
  // Example: "I was going to - well, I think" -> "I think"
  cleaned = cleaned.replace(/\b\w+\s*-+\s*/g, '');
  
  // Remove partial words followed by complete words
  // Example: "inter- interesting" -> "interesting"
  cleaned = cleaned.replace(/\b\w+--?\s+(\w+)/g, '$1');

  // Remove excessive stuttering
  // Example: "th-th-th-this" -> "this"
  cleaned = cleaned.replace(/\b(\w+)-(\1-)*\1\b/g, '$1');

  // Remove non-speech sounds and annotations
  // Example: "[laughs]", "(coughs)", "*sighs*"
  cleaned = cleaned.replace(/[\[\(].*?[\]\)]/g, '');
  cleaned = cleaned.replace(/\*.*?\*/g, '');

  // Clean up multiple spaces and punctuation
  cleaned = cleaned.replace(/\s{2,}/g, ' '); // Multiple spaces -> single space
  cleaned = cleaned.replace(/\s+([,.!?;:])/g, '$1'); // Space before punctuation
  cleaned = cleaned.replace(/([,.!?;:])\s*([,.!?;:])/g, '$1 $2'); // Multiple punctuation
  
  // Clean up spaces around timestamps and speaker labels
  cleaned = cleaned.replace(/\s*\[\s*(\d+:\d+:\d+)\s*\]\s*/g, ' [$1] ');
  cleaned = cleaned.replace(/\s*(Speaker\s+\d+)\s*(\d+:\d+:\d+)\s*/g, ' $1    $2    ');

  // Remove empty lines and excessive line breaks
  cleaned = cleaned.replace(/\n\s*\n/g, '\n'); // Multiple line breaks -> single
  cleaned = cleaned.replace(/^\s+|\s+$/g, ''); // Trim start/end whitespace

  // Ensure proper capitalization after cleaning
  cleaned = cleaned.replace(/([.!?]\s*)([a-z])/g, (match, punct, letter) => {
    return punct + letter.toUpperCase();
  });

  // Capitalize first letter of the entire text
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return cleaned;
}

/**
 * Clean speaker-formatted transcript while preserving speaker labels and timestamps
 * @param {string} transcript - Transcript with speaker labels
 * @param {boolean} isVerbatim - Whether to keep verbatim
 * @returns {string} Processed transcript
 */
export function processSpokenTranscript(transcript, isVerbatim) {
  if (!transcript || typeof transcript !== 'string') {
    return transcript || '';
  }

  if (isVerbatim) {
    return transcript;
  }

  // Split by lines to process each speaker segment
  const lines = transcript.split('\n');
  const processedLines = [];

  for (const line of lines) {
    // Check if line contains speaker format: "Speaker 0    00:01:23    text"
    const speakerMatch = line.match(/^(Speaker\s+\d+\s+\d+:\d+:\d+\s+)(.*)$/);
    
    if (speakerMatch) {
      const speakerInfo = speakerMatch[1];
      const spokenText = speakerMatch[2];
      
      // Clean only the spoken text part
      const cleanedText = cleanTranscript(spokenText);
      
      // Only add the line if there's actual text after cleaning
      if (cleanedText.trim()) {
        processedLines.push(speakerInfo + cleanedText);
      }
    } else if (line.trim() === '[END]' || line.trim() === '') {
      // Preserve END markers and empty lines
      processedLines.push(line);
    } else {
      // For lines without speaker format, clean normally
      const cleaned = cleanTranscript(line);
      if (cleaned.trim()) {
        processedLines.push(cleaned);
      }
    }
  }

  return processedLines.join('\n');
}

/**
 * Example usage and demonstration
 */
export function demonstrateTranscriptProcessing() {
  const sampleVerbatim = `
Speaker 0    00:01:23    Um, I think, you know, we should, uh, proceed with the proposal. Like, it's really, really important, and, um, we should start as soon as possible.
Speaker 1    00:01:45    Yeah, I mean, I I I totally agree. Uh, this is, well, this is actually pretty straightforward, you know?
Speaker 0    00:02:10    Exactly! So, um, let's just go ahead and, uh, make it happen. Actually, actually, I think we're on the right track here.
[END]
  `;

  console.log('=== VERBATIM TRANSCRIPT ===');
  console.log(processTranscript(sampleVerbatim, true));
  
  console.log('\n=== NON-VERBATIM (CLEANED) TRANSCRIPT ===');
  console.log(processTranscript(sampleVerbatim, false));

  return {
    verbatim: processTranscript(sampleVerbatim, true),
    nonVerbatim: processTranscript(sampleVerbatim, false)
  };
}