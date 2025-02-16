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

async function main() {
  try {
    // Read the word list file
    const filePath = path.join(__dirname, '../../data/nyt_words.txt');
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Split into words and clean
    const words = content
      .split('\n')
      .map(word => word.trim())
      .filter(word => word.length > 0);

    console.log(`Found ${words.length} words to process`);

    // Seed the dictionary
    await seedDictionary(words);

  } catch (error) {
    console.error('Error seeding words:', error);
    process.exit(1);
  }
}

main();