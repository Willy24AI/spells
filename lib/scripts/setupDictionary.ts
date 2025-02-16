// lib/scripts/setupDictionary.ts

import { parseWordList } from '../dictionary/wordListParser';
import { seedDictionary } from '../dictionary/dictionarySeeder';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const VALIDATION_QUERIES_PATH = path.join(__dirname, '../database/validationQueries.sql');

async function setupDictionary() {
  try {
    // 1. Parse word list
    console.log('Parsing word list...');
    const wordListPath = path.join(__dirname, '../../data/nyt_words.txt');
    const { words, stats } = parseWordList(wordListPath);
    
    console.log('Parsing complete:');
    console.log(`- Total words: ${stats.totalWords}`);
    console.log(`- Invalid entries: ${stats.invalidEntries.length}`);
    console.log(`- Duplicates: ${stats.duplicates.length}`);

    // 2. Seed database
    console.log('\nSeeding dictionary...');
    await seedDictionary(words);
    
    // 3. Run validation queries
    console.log('\nRunning validation...');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const validationQueries = fs.readFileSync(VALIDATION_QUERIES_PATH, 'utf8')
      .split(';')
      .filter(query => query.trim())
      .map(query => query.trim());

    console.log('\nValidation Results:');
    for (const query of validationQueries) {
      const { data, error } = await supabase.rpc('run_query', { query });
      if (error) {
        console.error(`Error running validation query: ${error.message}`);
        continue;
      }
      console.log('\n' + '-'.repeat(50));
      console.log(data);
    }

    console.log('\nDictionary setup complete!');

  } catch (error) {
    console.error('Error during dictionary setup:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  setupDictionary();
}

export { setupDictionary };