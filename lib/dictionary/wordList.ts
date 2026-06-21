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
      // Supabase/PostgREST caps a single select() at 1000 rows. The dictionary
      // has hundreds of thousands of words, so we must paginate to load them all.
      const PAGE_SIZE = 1000;
      let from = 0;

      while (true) {
        // Retry each page a few times so a single transient network blip during
        // a large paginated load doesn't abort the whole dictionary fetch.
        let words: any[] | null = null;
        let lastError: unknown = null;
        for (let attempt = 0; attempt < 4; attempt++) {
          const { data, error } = await supabase
            .from('words')
            .select('*')
            .order('word', { ascending: true })
            .range(from, from + PAGE_SIZE - 1);

          if (!error) {
            words = data;
            lastError = null;
            break;
          }
          lastError = error;
          await new Promise(resolve => setTimeout(resolve, 300 * (attempt + 1)));
        }

        if (lastError) throw lastError;
        if (!words || words.length === 0) break;

        for (const word of words) {
          const wordEntry: Word = {
            id: word.id,
            word: word.word.toLowerCase(),
            points: word.points,
            isPangram: word.is_pangram,
            length: word.length,
            created_at: word.created_at
          };
          this.cache.set(wordEntry.word, wordEntry);
        }

        if (words.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
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
      await this.initialize();

      // Memoize: the dictionary doesn't change within a process lifetime.
      if (this.pangrams) return this.pangrams;

      // Find pangrams from the in-memory cache to ensure accuracy.
      const pangrams: string[] = [];
      for (const word of this.cache.keys()) {
        const uniqueLetters = new Set<string>(word.split(''));

        // Must have exactly 7 unique letters
        if (uniqueLetters.size !== 7) continue;

        // Must contain at least 2 vowels
        const vowels = [...uniqueLetters].filter(letter => 'aeiou'.includes(letter));
        if (vowels.length < 2) continue;

        // Must contain at least 3 consonants
        const consonants = [...uniqueLetters].filter(letter => !'aeiou'.includes(letter));
        if (consonants.length < 3) continue;

        pangrams.push(word);
      }

      this.pangrams = pangrams;
      console.log(`Found ${pangrams.length} valid pangrams`);
      return pangrams;
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
      await this.initialize();

      const allLetters = new Set([centerLetter, ...outerLetters].map(l => l.toLowerCase()));
      const centerLowerCase = centerLetter.toLowerCase();
      const minLength = options.minLength || 4;
      const maxLength = options.maxLength || 15;
      const validWords: string[] = [];

      // Filter the in-memory dictionary for words buildable from these letters.
      for (const normalizedWord of this.cache.keys()) {
        // Skip words that are too short or too long
        if (normalizedWord.length < minLength || normalizedWord.length > maxLength) {
          continue;
        }

        // Must contain center letter
        if (!normalizedWord.includes(centerLowerCase)) {
          continue;
        }

        // Check if word only uses allowed letters
        let isValid = true;
        for (const letter of normalizedWord) {
          if (!allLetters.has(letter)) {
            isValid = false;
            break;
          }
        }

        if (isValid) {
          validWords.push(normalizedWord);
        }
      }

      return validWords;
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