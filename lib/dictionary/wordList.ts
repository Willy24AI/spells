import { supabase } from '@/lib/db';
import type { Word, WordFilter } from '@/lib/types/dictionary';

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
      // Load words into cache
      const { data: words, error } = await supabase
        .from('words')
        .select('*');

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
    try {
      // Get all words from database
      const { data, error } = await supabase
        .from('words')
        .select('word');

      if (error) throw error;

      // Find pangrams manually to ensure accuracy
      const pangrams = (data || []).filter(({ word }) => {
        const uniqueLetters = new Set(word.toLowerCase().split(''));
        
        // Must have exactly 7 unique letters
        if (uniqueLetters.size !== 7) return false;
        
        // Must contain at least 2 vowels
        const vowels = [...uniqueLetters].filter(letter => 'aeiou'.includes(letter));
        if (vowels.length < 2) return false;
        
        // Must contain at least 3 consonants
        const consonants = [...uniqueLetters].filter(letter => !'aeiou'.includes(letter));
        if (consonants.length < 3) return false;
        
        return true;
      });

      console.log(`Found ${pangrams.length} valid pangrams`);
      return pangrams.map(p => p.word.toLowerCase());
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
      const validWords = new Set<string>();

      // Get ALL words from database without length filter first
      const { data: words, error } = await supabase
        .from('words')
        .select('word');

      if (error) throw error;

      // Filter words that can be made with these letters
      if (words) {
        for (const { word } of words) {
          const normalizedWord = word.toLowerCase();
          
          // Skip words that are too short or too long
          if (normalizedWord.length < (options.minLength || 4) || 
              normalizedWord.length > (options.maxLength || 15)) {
            continue;
          }

          // Must contain center letter
          if (!normalizedWord.includes(centerLowerCase)) {
            continue;
          }

          // Check if word only uses allowed letters
          let isValid = true;
          for (const letter of normalizedWord) {
            if (!allLetters.includes(letter)) {
              isValid = false;
              break;
            }
          }

          if (isValid) {
            validWords.add(normalizedWord);
          }
        }
      }

      const result = Array.from(validWords);
      console.log(`Found ${result.length} valid words for puzzle using letters: ${centerLetter},${outerLetters.join(',')}`);
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
        .single();

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

      const { data, error } = await dbQuery;
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