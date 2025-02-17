import { supabase } from '@/lib/db';
import type { Word, WordFilter } from '@/lib/types/dictionary';

// Helper type for database response
interface WordRow {
  id: string;
  word: string;
  points: number;
  is_pangram: boolean;
  length?: number;
  created_at?: string;
  [key: string]: any;
}

export interface WordListOptions {
  minLength?: number;
  maxLength?: number;
  minFrequency?: number;
}

export class WordList {
  private cache: Map<string, Word>;
  private initialized: boolean;
  private pangrams: string[] | null = null;

  constructor() {
    this.cache = new Map();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Load all words into cache without limit
      const { data: words, error } = await supabase
        .from('words')
        .select('*') as { data: WordRow[] | null, error: any };

      if (error) throw error;

      if (words) {
        words.forEach(word => {
          const wordEntry: Word = {
            id: word.id,
            word: word.word.toLowerCase(),
            points: word.points,
            isPangram: word.is_pangram,
            length: word.length,
            created_at: word.created_at
          };
          this.cache.set(wordEntry.word, wordEntry);
        });
      }

      this.initialized = true;
      console.log(`Initialized WordList with ${this.cache.size} words`);
    } catch (error) {
      console.error('Error initializing word list:', error);
      throw error;
    }
  }

  async findPangrams(): Promise<string[]> {
    if (this.pangrams !== null) {
      return this.pangrams;
    }

    try {
      const { data, error } = await supabase
        .from('words')
        .select('word, length')
        .eq('is_pangram', true) as { data: { word: string, length: number }[] | null, error: any };

      if (error) throw error;

      // Additional validation to ensure words have 7 unique letters
      const validPangrams = (data || []).filter(p => {
        const uniqueLetters = new Set(p.word.toLowerCase().split(''));
        return uniqueLetters.size === 7;
      });

      console.log(`Found ${validPangrams.length} pangrams`);
      this.pangrams = validPangrams.map(p => p.word.toLowerCase());
      return this.pangrams;
    } catch (error) {
      console.error('Error finding pangrams:', error);
      return [];
    }
  }

  async findValidWords(
    centerLetter: string,
    outerLetters: string[],
    options: WordListOptions = {}
  ): Promise<string[]> {
    const {
      minLength = 4,
      maxLength = 8,
      minFrequency = 0
    } = options;

    try {
      await this.initialize();

      const allLetters = [centerLetter, ...outerLetters].map(l => l.toLowerCase());
      const centerLowerCase = centerLetter.toLowerCase();
      const validWords = new Set<string>();

      // Get all potential words from dictionary without limit
      const { data: dictWords, error } = await supabase
        .from('words')
        .select('word')
        .gte('length', minLength)
        .lte('length', maxLength) as { data: { word: string }[] | null, error: any };

      if (error) throw error;

      // Filter words based on letter requirements
      if (dictWords) {
        for (const { word } of dictWords) {
          const normalizedWord = word.toLowerCase();

          // Must contain center letter
          if (!normalizedWord.includes(centerLowerCase)) continue;

          // Must only use allowed letters
          if (!normalizedWord.split('').every(letter => allLetters.includes(letter))) continue;

          validWords.add(normalizedWord);
        }
      }

      const result = Array.from(validWords);
      console.log(`Found ${result.length} valid words for puzzle`);
      return result;
    } catch (error) {
      console.error('Error finding valid words:', error);
      return [];
    }
  }

  async validateWord(word: string): Promise<boolean> {
    try {
      // Check cache first
      if (this.cache.has(word.toLowerCase())) {
        return true;
      }

      // Query database if not in cache
      const { data, error } = await supabase
        .from('words')
        .select('*')
        .eq('word', word.toLowerCase())
        .single() as { data: WordRow | null, error: any };

      if (error || !data) {
        return false;
      }

      // Add to cache
      const wordEntry: Word = {
        id: data.id,
        word: data.word.toLowerCase(),
        points: data.points,
        isPangram: data.is_pangram,
        length: data.length,
        created_at: data.created_at
      };
      this.cache.set(wordEntry.word, wordEntry);
      return true;
    } catch (error) {
      console.error('Error validating word:', error);
      return false;
    }
  }

  async searchWords(
    query: string,
    options: {
      limit?: number;
      offset?: number;
      filter?: WordFilter;
    } = {}
  ): Promise<Word[]> {
    try {
      let dbQuery = supabase
        .from('words')
        .select('*')
        .ilike('word', `%${query}%`);

      if (options.filter?.minLength) {
        dbQuery = dbQuery.gte('length', options.filter.minLength);
      }
      if (options.filter?.maxLength) {
        dbQuery = dbQuery.lte('length', options.filter.maxLength);
      }
      if (options.limit) {
        dbQuery = dbQuery.range(options.offset || 0, (options.offset || 0) + options.limit - 1);
      }

      const { data, error } = await dbQuery as { data: WordRow[] | null, error: any };
      if (error) throw error;

      return (data || []).map(row => ({
        id: row.id,
        word: row.word.toLowerCase(),
        points: row.points,
        isPangram: row.is_pangram,
        length: row.length,
        created_at: row.created_at
      }));
    } catch (error) {
      console.error('Error searching words:', error);
      return [];
    }
  }

  async getWordMetadata(word: string): Promise<Word | null> {
    try {
      // Check cache first
      const cached = this.cache.get(word.toLowerCase());
      if (cached) return cached;

      // Query database
      const { data, error } = await supabase
        .from('words')
        .select('*')
        .eq('word', word.toLowerCase())
        .single() as { data: WordRow | null, error: any };

      if (error || !data) return null;

      const wordEntry: Word = {
        id: data.id,
        word: data.word.toLowerCase(),
        points: data.points,
        isPangram: data.is_pangram,
        length: data.length,
        created_at: data.created_at
      };

      // Add to cache
      this.cache.set(wordEntry.word, wordEntry);
      return wordEntry;
    } catch (error) {
      console.error('Error getting word metadata:', error);
      return null;
    }
  }

  getWordCount(): number {
    return this.cache.size;
  }

  async clearCache() {
    this.cache.clear();
    this.initialized = false;
    this.pangrams = null;
    console.log('WordList cache cleared');
  }
}