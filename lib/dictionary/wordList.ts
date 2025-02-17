import { supabase } from '@/lib/db';
import { metadata } from './metadata';
import { filters } from './filters';
import type { Word, WordFilter } from '@/lib/types/dictionary';

export class WordList {
  private cache: Map<string, Word>;
  private initialized: boolean;

  constructor() {
    this.cache = new Map();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Load all words into cache
      const { data: words, error } = await supabase
        .from('words')
        .select('*');

      if (error) throw error;

      if (words) {
        words.forEach(word => {
          this.cache.set(word.word.toLowerCase(), word);
        });
      }

      this.initialized = true;
      console.log(`Initialized WordList with ${words?.length || 0} words`);
    } catch (error) {
      console.error('Error initializing word list:', error);
      throw error;
    }
  }

  async findPangrams(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('words')
        .select('word')
        .eq('isPangram', true)
        .order('length');

      if (error) throw error;
      console.log(`Found ${data?.length || 0} pangrams`);
      return (data || []).map(p => p.word.toLowerCase());
    } catch (error) {
      console.error('Error finding pangrams:', error);
      return [];
    }
  }

  async findValidWords(
    centerLetter: string,
    outerLetters: string[],
    options: {
      minLength?: number;
      maxLength?: number;
      minFrequency?: number;
    } = {}
  ): Promise<string[]> {
    try {
      const allLetters = [centerLetter, ...outerLetters].map(l => l.toLowerCase());
      const centerLowerCase = centerLetter.toLowerCase();

      // Query database for all potential words
      let query = supabase
        .from('words')
        .select('word, points, isPangram')
        .gte('length', options.minLength || 4)
        .lte('length', options.maxLength || 15);

      const { data: words, error } = await query;

      if (error) throw error;

      // Filter words that are valid for this puzzle
      const validWords = new Set<string>();

      if (words) {
        for (const wordData of words) {
          const word = wordData.word.toLowerCase();

          // Must contain center letter
          if (!word.includes(centerLowerCase)) continue;

          // Must only use allowed letters
          if (!this.isValidWordForLetters(word, allLetters)) continue;

          // Must be verified in our dictionary
          if (!await this.validateWord(word)) continue;

          validWords.add(word);
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

  private isValidWordForLetters(word: string, allowedLetters: string[]): boolean {
    return word.split('').every(letter => allowedLetters.includes(letter.toLowerCase()));
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
        .ilike('word', `%${query}%`)
        .range(options.offset || 0, (options.offset || 0) + (options.limit || 50) - 1);

      if (options.filter?.minLength) {
        dbQuery = dbQuery.gte('length', options.filter.minLength);
      }
      if (options.filter?.maxLength) {
        dbQuery = dbQuery.lte('length', options.filter.maxLength);
      }
      if (options.filter?.isPangram !== undefined) {
        dbQuery = dbQuery.eq('isPangram', options.filter.isPangram);
      }

      const { data, error } = await dbQuery;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching words:', error);
      return [];
    }
  }

  async validateWord(word: string): Promise<Word | null> {
    try {
      // Check cache first
      const cached = this.cache.get(word.toLowerCase());
      if (cached) return cached;

      // Query database
      const { data, error } = await supabase
        .from('words')
        .select('*')
        .eq('word', word.toLowerCase())
        .single();

      if (error) return null;
      
      // Add to cache
      if (data) {
        this.cache.set(data.word.toLowerCase(), data);
      }
      
      return data;
    } catch (error) {
      console.error('Error validating word:', error);
      return null;
    }
  }

  async getWordMetadata(word: string): Promise<{
    points: number;
    isPangram: boolean;
  } | null> {
    const wordData = await this.validateWord(word);
    if (!wordData) return null;

    return {
      points: wordData.points,
      isPangram: wordData.isPangram
    };
  }

  async clearCache() {
    this.cache.clear();
    this.initialized = false;
    console.log('WordList cache cleared');
  }
}