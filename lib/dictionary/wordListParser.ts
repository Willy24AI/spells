// PDF Word List Parser
import fs from 'fs';
import path from 'path';

interface ParsedWords {
  words: string[];
  stats: {
    totalWords: number;
    invalidEntries: string[];
    duplicates: string[];
  };
}

export function parseWordList(filePath: string): ParsedWords {
  // Read file content
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Split into lines and process
  const lines = content.split('\n');
  
  const result: ParsedWords = {
    words: [],
    stats: {
      totalWords: 0,
      invalidEntries: [],
      duplicates: []
    }
  };

  const seenWords = new Set<string>();
  
  // Process each line
  for (const line of lines) {
    // Skip empty lines and headers
    if (!line.trim() || line.includes('Note:') || line.includes('Words of the Day')) {
      continue;
    }

    // Clean and normalize the word
    const word = line.trim()
      .toLowerCase()
      // Remove any trailing punctuation or notes
      .replace(/[^a-z\-]/g, '')
      // Handle special cases like hyphenated words
      .replace(/\-/g, '');

    // Validate word
    if (!word) continue;
    
    if (!/^[a-z]+$/.test(word)) {
      result.stats.invalidEntries.push(line.trim());
      continue;
    }

    // Check for duplicates
    if (seenWords.has(word)) {
      result.stats.duplicates.push(word);
      continue;
    }

    seenWords.add(word);
    result.words.push(word);
  }

  result.stats.totalWords = result.words.length;

  return result;
}

// Example usage:
if (require.main === module) {
  const filePath = path.join(__dirname, 'nyt_words.txt');
  const parsed = parseWordList(filePath);
  
  console.log(`Processed ${parsed.stats.totalWords} valid words`);
  console.log(`Found ${parsed.stats.invalidEntries.length} invalid entries`);
  console.log(`Found ${parsed.stats.duplicates.length} duplicates`);
  
  // Output validation report
  fs.writeFileSync(
    path.join(__dirname, 'word_list_report.json'),
    JSON.stringify({
      stats: parsed.stats,
      sampleWords: parsed.words.slice(0, 20),
      invalidEntries: parsed.stats.invalidEntries,
      duplicates: parsed.stats.duplicates
    }, null, 2)
  );
}