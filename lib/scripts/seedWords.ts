// lib/scripts/seedWords.ts
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { seedDictionary } from '../dictionary/dictionarySeeder.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// ESM doesn't have __dirname, so we need to construct it
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// How many of the most common English words to allow. Words outside this set
// are treated as too obscure for the puzzle. Because the base dictionary
// (ENABLE) is already clean (no proper nouns/abbreviations/slang), we can use a
// generous cutoff and still avoid junk.
const COMMON_WORD_CUTOFF = 80000;

async function main() {
  try {
    // Read the base dictionary. ENABLE is a clean word-game lexicon: real words
    // only, no proper nouns, abbreviations, or contractions.
    const filePath = path.join(__dirname, '../../data/enable1.txt');
    const content = fs.readFileSync(filePath, 'utf8');

    // Split into words and clean
    const words = content
      .split('\n')
      .map(word => word.trim())
      .filter(word => word.length > 0);

    console.log(`Found ${words.length} dictionary words`);

    // Build the common-word allowlist from the frequency list (sorted by usage,
    // most common first), taking the top COMMON_WORD_CUTOFF entries.
    const freqPath = path.join(__dirname, '../../data/word_frequency.txt');
    const freqContent = fs.readFileSync(freqPath, 'utf8');
    const freqLines = freqContent.split('\n');

    const commonWords = new Set<string>();
    for (let i = 0; i < freqLines.length && commonWords.size < COMMON_WORD_CUTOFF; i++) {
      const token = freqLines[i].split('\t')[0]?.trim().toLowerCase();
      if (token) commonWords.add(token);
    }
    console.log(`Loaded top ${commonWords.size} common words as the allowlist`);

    // Fresh rebuild: clear the table, then seed only common dictionary words.
    await seedDictionary(words, { allowedWords: commonWords, fresh: true });

  } catch (error) {
    console.error('Error seeding words:', error);
    process.exit(1);
  }
}

main();