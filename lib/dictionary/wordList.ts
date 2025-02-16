import { supabase } from '@/lib/db';
import { metadata } from './metadata';
import { filters } from './filters';
import { validation } from './validation';
import type { WordMetadata } from './metadata';

export interface SimplifiedWordMetadata {
  word: string;
  length: number;
  isPangram: boolean;
  points: number;
}

export class WordList {
  private cache: Map<string, SimplifiedWordMetadata>;

  constructor() {
    this.cache = new Map();
  }

  /**
   * Initialize the word list
   */
  async initialize() {
    const { data: words } = await supabase
      .from('words')
      .select('*');
    
    if (words) {
      for (const word of words) {
        this.cache.set(word.word, {
          word: word.word,
          length: word.length,
          isPangram: word.is_pangram,
          points: word.points
        });
      }
    }
  }

  /**
   * Add a new word to the dictionary
   */
  async addWord(word: string): Promise<boolean> {
    const validationResult = validation.validateDictionaryWord(word);
    if (!validationResult.isValid) {
      return false;
    }

    const fullMetadata = metadata.calculateWordMetadata(word);

    const { error } = await supabase
      .from('words')
      .insert({
        word: word.toLowerCase(),
        length: word.length,
        points: fullMetadata.points,
        is_pangram: fullMetadata.isPangram
      });

    if (error) {
      console.error('Error adding word:', error);
      return false;
    }

    this.cache.set(word.toLowerCase(), {
      word: word.toLowerCase(),
      length: word.length,
      isPangram: fullMetadata.isPangram,
      points: fullMetadata.points
    });
    
    return true;
  }

  /**
   * Batch import words
   */
  async importWords(words: string[]): Promise<{
    added: number;
    skipped: number;
    errors: number;
  }> {
    let added = 0;
    let skipped = 0;
    let errors = 0;

    const batchSize = 100;
    for (let i = 0; i < words.length; i += batchSize) {
      const batch = words.slice(i, i + batchSize);
      const validWords = batch.filter(word => filters.applyAll(word));

      if (validWords.length > 0) {
        const wordData = validWords.map(word => {
          const fullMetadata = metadata.calculateWordMetadata(word);
          return {
            word: word.toLowerCase(),
            length: word.length,
            points: fullMetadata.points,
            is_pangram: fullMetadata.isPangram
          };
        });

        const { error } = await supabase
          .from('words')
          .insert(wordData);

        if (error) {
          console.error('Batch import error:', error);
          errors += batch.length;
        } else {
          added += validWords.length;
          skipped += batch.length - validWords.length;

          validWords.forEach(word => {
            const fullMetadata = metadata.calculateWordMetadata(word);
            this.cache.set(word.toLowerCase(), {
              word: word.toLowerCase(),
              length: word.length,
              isPangram: fullMetadata.isPangram,
              points: fullMetadata.points
            });
          });
        }
      } else {
        skipped += batch.length;
      }
    }

    return { added, skipped, errors };
  }

  /**
   * Find pangrams in the dictionary
   */
  async findPangrams(): Promise<string[]> {
    const { data: pangrams } = await supabase
      .from('words')
      .select('word')
      .eq('is_pangram', true);

    return pangrams?.map(p => p.word) || [];
  }

  /**
   * Find all valid words for a puzzle
   */
  async findValidWords(
    centerLetter: string,
    outerLetters: string[]
  ): Promise<string[]> {
    const allLetters = [centerLetter, ...outerLetters].map(l => l.toLowerCase());
    
    // Check cache first
    const cachedWords = Array.from(this.cache.entries())
      .filter(([word]) => 
        metadata.isValidForPuzzle(word, centerLetter, outerLetters)
      )
      .map(([word]) => word);

    if (cachedWords.length > 0) {
      return cachedWords;
    }

    // Query database if cache misses
    const { data: words } = await supabase
      .from('words')
      .select('word');

    return words
      ?.map(w => w.word)
      .filter(word => 
        metadata.isValidForPuzzle(word, centerLetter, outerLetters)
      ) || [];
  }

  /**
   * Get word metadata
   */
  async getWordMetadata(word: string): Promise<SimplifiedWordMetadata | null> {
    const cached = this.cache.get(word.toLowerCase());
    if (cached) {
      return cached;
    }

    const { data } = await supabase
      .from('words')
      .select('*')
      .eq('word', word.toLowerCase())
      .single();

    if (!data) {
      return null;
    }

    const simplified: SimplifiedWordMetadata = {
      word: data.word,
      length: data.length,
      isPangram: data.is_pangram,
      points: data.points
    };

    this.cache.set(word.toLowerCase(), simplified);
    return simplified;
  }
}