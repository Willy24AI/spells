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
      // Load common words into cache
      const { data: words, error } = await supabase
        .from('words')
        .select('*')
        .eq('is_common', true);

      if (error) throw error;

      if (words) {
        words.forEach(word => {
          this.cache.set(word.word.toLowerCase(), word);
        });
      }

      this.initialized = true;
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
        .eq('is_pangram', true)
        .order('length');

      if (error) throw error;
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
      includeVariations?: boolean;
      minFrequency?: number;
    } = {}
  ): Promise<string[]> {
    try {
      const allLetters = [centerLetter, ...outerLetters].map(l => l.toLowerCase());
      const centerLowerCase = centerLetter.toLowerCase();

      // Build query
      let query = supabase
        .from('words')
        .select('*')
        .gte('length', options.minLength || 4)
        .lte('length', options.maxLength || 15);

      if (options.minFrequency) {
        query = query.gte('frequency', options.minFrequency);
      }

      const { data: words, error } = await query;

      if (error) throw error;

      // Filter words that can be made with these letters
      const validWords = new Set<string>();

      if (words) {
        for (const word of words) {
          const normalized = word.word.toLowerCase();

          // Must contain center letter
          if (!normalized.includes(centerLowerCase)) continue;

          // Must only use allowed letters
          if (!normalized.split('').every((letter: string) => allLetters.includes(letter))) continue;

          validWords.add(normalized);

          // Add variations if enabled
          if (options.includeVariations) {
            const variations = this.generateWordVariations(
              normalized,
              centerLetter,
              outerLetters
            );
            variations.forEach(v => validWords.add(v));
          }
        }
      }

      return Array.from(validWords);
    } catch (error) {
      console.error('Error finding valid words:', error);
      return [];
    }
  }

  private generateWordVariations(
    word: string,
    centerLetter: string,
    outerLetters: string[]
  ): string[] {
    const variations = new Set<string>();
    const allLetters = [centerLetter, ...outerLetters].map(l => l.toLowerCase());

    // Common suffixes to try
    const suffixes = ['s', 'es', 'ed', 'ing', 'er'];

    for (const suffix of suffixes) {
      let variation = word;

      // Handle special cases
      if (suffix === 'ing' && word.endsWith('e')) {
        variation = word.slice(0, -1);
      }

      variation += suffix;

      // Validate variation
      if (
        variation.length >= 4 &&
        variation.includes(centerLetter.toLowerCase()) &&
        variation.split('').every((letter: string) => allLetters.includes(letter))
      ) {
        variations.add(variation);
      }
    }

    return Array.from(variations);
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
        dbQuery = dbQuery.eq('is_pangram', options.filter.isPangram);
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
      return data;
    } catch (error) {
      console.error('Error validating word:', error);
      return null;
    }
  }
}