// lib/scripts/processWordList.ts
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface WordEntry {
  id: string;
  word: string;
  points: number;
  is_pangram: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  length: number;
  created_at?: string;
}

interface ProcessingStats {
  totalWords: number;
  validWords: number;
  pangrams: number;
  byLength: Record<number, number>;
  byDifficulty: Record<string, number>;
}

class WordProcessor {
  private stats: ProcessingStats = {
    totalWords: 0,
    validWords: 0,
    pangrams: 0,
    byLength: {},
    byDifficulty: {
      easy: 0,
      medium: 0,
      hard: 0
    }
  };

  // Basic word validation
  private isValidWord(word: string): boolean {
    // Convert to lowercase
    word = word.toLowerCase();

    // Must be at least 4 letters
    if (word.length < 4) return false;

    // Must contain only letters
    if (!/^[a-z]+$/.test(word)) return false;

    // Must contain at least one vowel
    if (!/[aeiou]/.test(word)) return false;

    // Must not be too long
    if (word.length > 15) return false;

    return true;
  }

  // Calculate points for a word
  private calculatePoints(word: string, isPangram: boolean): number {
    // 1 point for 4-letter words, word length for longer words
    const basePoints = word.length === 4 ? 1 : word.length;
    // Add 7 bonus points for pangrams
    return isPangram ? basePoints + 7 : basePoints;
  }

  // Check if word is a pangram (uses exactly 7 different letters)
  private isPangram(word: string): boolean {
    return new Set(word.toLowerCase()).size === 7;
  }

  // Determine word difficulty
  private getDifficulty(word: string, isPangram: boolean): 'easy' | 'medium' | 'hard' {
    if (isPangram) return 'hard';
    if (word.length <= 5) return 'easy';
    if (word.length <= 7) return 'medium';
    return 'hard';
  }

  // Process a single word
  private processWord(word: string): WordEntry | null {
    this.stats.totalWords++;

    if (!this.isValidWord(word)) {
      return null;
    }

    const processedWord = word.toLowerCase();
    const isPangram = this.isPangram(processedWord);
    const difficulty = this.getDifficulty(processedWord, isPangram);
    const points = this.calculatePoints(processedWord, isPangram);

    // Update stats
    this.stats.validWords++;
    if (isPangram) this.stats.pangrams++;
    this.stats.byLength[processedWord.length] = (this.stats.byLength[processedWord.length] || 0) + 1;
    this.stats.byDifficulty[difficulty]++;

    return {
      id: uuidv4(),
      word: processedWord,
      points,
      is_pangram: isPangram,
      difficulty,
      length: processedWord.length,
      created_at: new Date().toISOString()
    };
  }

  // Process entire word list file
  async processFile(filePath: string): Promise<void> {
    console.log('Starting word list processing...');
    
    const fileContent = await fs.promises.readFile(filePath, 'utf-8');
    const words = fileContent.split('\n').map(line => line.trim());
    
    const validWords: WordEntry[] = [];
    const batchSize = 1000; // Process in batches to avoid memory issues

    for (const word of words) {
      const processedWord = this.processWord(word);
      if (processedWord) {
        validWords.push(processedWord);
        
        // When we reach batch size, insert into database
        if (validWords.length === batchSize) {
          await this.insertWords(validWords);
          validWords.length = 0; // Clear array
        }
      }
    }

    // Insert any remaining words
    if (validWords.length > 0) {
      await this.insertWords(validWords);
    }

    console.log('Processing complete!');
    console.log('Stats:', this.stats);
  }

  // Insert words into database
  private async insertWords(words: WordEntry[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('words')
        .upsert(words, {
          onConflict: 'word',
          ignoreDuplicates: true
        });

      if (error) throw error;
      
      console.log(`Inserted ${words.length} words`);
    } catch (error) {
      console.error('Error inserting words:', error);
      throw error;
    }
  }
}

// Main execution
async function main() {
  try {
    const processor = new WordProcessor();
    const filePath = path.join(process.cwd(), 'data', 'wordlist.txt');
    await processor.processFile(filePath);
  } catch (error) {
    console.error('Error processing word list:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { WordProcessor };