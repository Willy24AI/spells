// lib/dictionary/dictionarySeeder.ts
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { filters } from './filters';

// Load environment variables
dotenv.config();

// Define WordMetadata interface
interface WordMetadata {
  word: string;
  length: number;
  letters: string[];
  uniqueLetters: string[];
  letterCount: Record<string, number>;
  isPangram: boolean;
  vowelCount: number;
  consonantCount: number;
}

interface WordEntry {
  word: string;
  length: number;
  letters: string[];
  unique_letters: string[];
  letter_count: Record<string, number>;
  is_pangram: boolean;
  vowel_count: number;
  consonant_count: number;
  points: number;
  difficulty: 'easy' | 'normal' | 'hard';
}

// Metadata calculation functions
const metadata = {
  calculateWordMetadata(word: string): WordMetadata {
    const normalizedWord = word.toLowerCase();
    const letters = normalizedWord.split('');
    const uniqueLetters = Array.from(new Set(letters));
    
    // Calculate letter frequency
    const letterCount = letters.reduce((acc, letter) => {
      acc[letter] = (acc[letter] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Count vowels and consonants
    const vowels = ['a', 'e', 'i', 'o', 'u'];
    const vowelCount = letters.filter(l => vowels.includes(l)).length;
    const consonantCount = letters.length - vowelCount;

    // Single definition for pangrams - exactly 7 unique letters
    const isPangram = uniqueLetters.length === 7;

    return {
      word: normalizedWord,
      length: normalizedWord.length,
      letters,
      uniqueLetters,
      letterCount,
      isPangram,
      vowelCount,
      consonantCount
    };
  }
};

// Initialize Supabase client with error handling.
// Seeding writes to the `words` table, which is protected by RLS, so we must use
// the SERVICE ROLE key (this is a trusted server-side script) to bypass it.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Process raw words from NYT list. When `allowedWords` is provided, only words
// present in that set (e.g. the most common English words) are kept.
async function processWordList(
  rawWords: string[],
  allowedWords?: Set<string>
): Promise<WordEntry[]> {
  const processedWords: WordEntry[] = [];

  for (const word of rawWords) {
    const lower = word.toLowerCase();

    // Keep only common words when an allowlist is supplied
    if (allowedWords && !allowedWords.has(lower)) {
      continue;
    }

    // Basic validation
    if (!filters.applyAll(word, {
      minLength: 4,
      checkProperNouns: true,
      requireVowels: true
    })) {
      continue;
    }

    // Calculate word metadata
    const meta = metadata.calculateWordMetadata(word.toLowerCase());
    
    // Calculate difficulty
    const difficulty = calculateDifficulty(meta);

    // Calculate base points
    const points = calculatePoints(meta);

    processedWords.push({
      word: meta.word,
      length: meta.length,
      letters: meta.letters,
      unique_letters: meta.uniqueLetters,
      letter_count: meta.letterCount,
      is_pangram: meta.isPangram,
      vowel_count: meta.vowelCount,
      consonant_count: meta.consonantCount,
      points,
      difficulty
    });
  }

  return processedWords;
}

function calculateDifficulty(meta: WordMetadata): 'easy' | 'normal' | 'hard' {
  const complexityScore = 
    // Length factor
    (meta.length - 4) * 2 +
    // Unique letters factor  
    meta.uniqueLetters.length * 1.5 +
    // Uncommon letters factor
    countUncommonLetters(meta.letters) * 3;

  if (complexityScore < 8) return 'easy';
  if (complexityScore < 15) return 'normal';
  return 'hard';
}

function calculatePoints(meta: WordMetadata): number {
  let points = meta.length === 4 ? 1 : meta.length;
  if (meta.isPangram) points += 7; // Pangram bonus
  return points;
}

function countUncommonLetters(letters: string[]): number {
  const uncommonLetters = new Set(['j', 'q', 'x', 'z']);
  return letters.filter(l => uncommonLetters.has(l)).length;
}

// Batch insert words into database
async function seedDatabase(words: WordEntry[]) {
  const batchSize = 1000; // PostgREST accepts large bulk upserts; fewer round-trips
  let done = 0;
  for (let i = 0; i < words.length; i += batchSize) {
    const batch = words.slice(i, i + batchSize);
    const { error } = await supabase
      .from('words')
      .upsert(batch, {
        onConflict: 'word',
        ignoreDuplicates: true
      });

    if (error) {
      console.error(`Error inserting batch starting at ${i}:`, error.message);
    } else {
      done += batch.length;
      if (done % 20000 === 0 || done === words.length) {
        console.log(`Seeded ${done}/${words.length} words`);
      }
    }
  }
}

// Remove all existing words so the table can be rebuilt cleanly.
async function clearWords() {
  console.log('Clearing existing words...');
  const { error } = await supabase
    .from('words')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // matches every row

  if (error) {
    console.error('Error clearing words table:', error.message);
    throw error;
  }
  console.log('Words table cleared.');
}

// Main seeding function
export async function seedDictionary(
  wordsList: string[],
  options: { allowedWords?: Set<string>; fresh?: boolean } = {}
) {
  try {
    if (options.fresh) {
      await clearWords();
    }

    console.log('Processing words...');
    const processedWords = await processWordList(wordsList, options.allowedWords);

    console.log(`Processed ${processedWords.length} valid words`);
    console.log('Seeding database...');

    await seedDatabase(processedWords);
    
    console.log('Dictionary seeding complete!');
    
    // Log statistics
    const stats = {
      total: processedWords.length,
      pangrams: processedWords.filter(w => w.is_pangram).length,
      byDifficulty: {
        easy: processedWords.filter(w => w.difficulty === 'easy').length,
        normal: processedWords.filter(w => w.difficulty === 'normal').length,
        hard: processedWords.filter(w => w.difficulty === 'hard').length
      }
    };
    
    console.log('Dictionary Statistics:', stats);
    
  } catch (error) {
    console.error('Error seeding dictionary:', error);
    throw error;
  }
}