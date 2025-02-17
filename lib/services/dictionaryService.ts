import { supabase } from '@/lib/db';
import { metadata } from '@/lib/dictionary/metadata';
import { filters } from '@/lib/dictionary/filters';
import type { 
  Word, 
  WordFilter,
  WordMetadata,
  DictionaryStats,
  ValidationResult
} from '@/lib/types/dictionary';

class DictionaryService {
  private cache: Map<string, Word>;
  private stats: DictionaryStats | null;

  constructor() {
    this.cache = new Map();
    this.stats = null;
  }

  async findPangrams(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('words')
        .select('word')
        .eq('is_pangram', true)
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
      const validWords = new Set<string>();

      // Query words from database
      let query = supabase
        .from('words')
        .select('word')
        .gte('length', options.minLength || 4)
        .lte('length', options.maxLength || 15);

      if (options.minFrequency) {
        query = query.gte('frequency', options.minFrequency);
      }

      const { data: words, error } = await query;
      if (error) throw error;

      // Filter words that can be made with these letters
      if (words) {
        for (const { word } of words) {
          const normalizedWord = word.toLowerCase();

          // Must contain center letter
          if (!normalizedWord.includes(centerLowerCase)) continue;

          // Must only use allowed letters
          if (!normalizedWord.split('').every((letter: string) => allLetters.includes(letter))) continue;

          validWords.add(normalizedWord);
        }
      }

      const result = Array.from(validWords);
      console.log(`Found ${result.length} valid words for the puzzle`);
      return result;
    } catch (error) {
      console.error('Error finding valid words:', error);
      return [];
    }
  }

  async getWordMetadata(word: string): Promise<WordMetadata | null> {
    try {
      // Check cache first
      const cached = this.cache.get(word.toLowerCase());
      if (cached) {
        return metadata.calculateWordMetadata(cached.word);
      }

      const { data, error } = await supabase
        .from('words')
        .select('*')
        .eq('word', word.toLowerCase())
        .single();

      if (error || !data) return null;

      const meta = metadata.calculateWordMetadata(data.word);
      this.cache.set(data.word, data);
      
      return meta;
    } catch (error) {
      console.error('Error getting word metadata:', error);
      return null;
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
      const { limit = 100, offset = 0, filter } = options;

      let dbQuery = supabase
        .from('words')
        .select('*')
        .ilike('word', `%${query}%`)
        .range(offset, offset + limit - 1);

      if (filter?.minLength) {
        dbQuery = dbQuery.gte('length', filter.minLength);
      }
      if (filter?.maxLength) {
        dbQuery = dbQuery.lte('length', filter.maxLength);
      }

      const { data, error } = await dbQuery;
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error searching words:', error);
      return [];
    }
  }

  async addWords(words: string[]): Promise<{
    added: number;
    skipped: number;
    errors: string[];
  }> {
    const results = {
      added: 0,
      skipped: 0,
      errors: [] as string[]
    };

    try {
      // Filter invalid words
      const validWords = words.filter(word => 
        filters.applyAll(word, {
          minLength: 4,
          checkProperNouns: true,
          requireVowels: true
        })
      );

      // Process in batches
      const batchSize = 100;
      for (let i = 0; i < validWords.length; i += batchSize) {
        const batch = validWords.slice(i, i + batchSize);
        const wordData = batch.map(word => {
          const meta = metadata.calculateWordMetadata(word);
          return {
            word: meta.word,
            length: meta.length,
            is_pangram: meta.isPangram7,
            points: meta.points,
            letter_count: meta.letterCount,
            unique_letters: meta.uniqueLetters,
            vowel_count: meta.vowelCount,
            consonant_count: meta.consonantCount,
            frequency: 0
          };
        });

        const { error } = await supabase
          .from('words')
          .upsert(wordData, {
            onConflict: 'word',
            ignoreDuplicates: true
          });

        if (error) {
          results.errors.push(`Batch ${i}-${i + batchSize}: ${error.message}`);
          results.skipped += batch.length;
        } else {
          results.added += batch.length;
        }
      }

      // Update cache
      await this.refreshCache();
      return results;
    } catch (error) {
      console.error('Error adding words:', error);
      results.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return results;
    }
  }

  async deleteWords(words: string[]): Promise<{
    deleted: number;
    errors: string[];
  }> {
    const results = {
      deleted: 0,
      errors: [] as string[]
    };

    try {
      const { error } = await supabase
        .from('words')
        .delete()
        .in('word', words.map(w => w.toLowerCase()));

      if (error) {
        results.errors.push(error.message);
      } else {
        results.deleted = words.length;
        // Clear cache for deleted words
        words.forEach(word => this.cache.delete(word.toLowerCase()));
      }

      return results;
    } catch (error) {
      console.error('Error deleting words:', error);
      results.errors.push(error instanceof Error ? error.message : 'Unknown error');
      return results;
    }
  }

  async getStats(): Promise<DictionaryStats> {
    if (this.stats) return this.stats;

    try {
      const { data, error } = await supabase
        .from('words')
        .select('id, length, is_pangram, points');

      if (error) throw error;

      const stats: DictionaryStats = {
        totalWords: data.length,
        averageLength: 0,
        pangrams: 0,
        wordLengthDistribution: {},
        totalPoints: 0
      };

      data.forEach(word => {
        stats.averageLength += word.length;
        if (word.is_pangram) stats.pangrams++;
        stats.wordLengthDistribution[word.length] = 
          (stats.wordLengthDistribution[word.length] || 0) + 1;
        stats.totalPoints += word.points;
      });

      stats.averageLength /= data.length;
      this.stats = stats;

      return stats;
    } catch (error) {
      console.error('Error getting stats:', error);
      throw error;
    }
  }

  async refreshCache(): Promise<void> {
    this.cache.clear();
    this.stats = null;

    try {
      const { data } = await supabase
        .from('words')
        .select('*');

      if (data) {
        data.forEach(word => this.cache.set(word.word, word));
      }
      console.log(`Cache refreshed with ${data?.length || 0} words`);
    } catch (error) {
      console.error('Error refreshing cache:', error);
    }
  }

  async validateWord(
    word: string,
    centerLetter: string,
    outerLetters: string[]
  ): Promise<ValidationResult> {
    try {
      const normalizedWord = word.toLowerCase();
      
      // Basic validation first
      if (!filters.applyAll(normalizedWord)) {
        return {
          isValid: false,
          error: 'Word does not meet basic criteria'
        };
      }

      // Check if word exists in dictionary
      const { data } = await supabase
        .from('words')
        .select('*')
        .eq('word', normalizedWord)
        .single();

      if (!data) {
        return {
          isValid: false,
          error: 'Word not found in dictionary'
        };
      }

      // Validate for puzzle letters
      if (!filters.validateForPuzzle(normalizedWord, centerLetter, outerLetters)) {
        return {
          isValid: false,
          error: 'Word cannot be formed with given letters'
        };
      }

      return {
        isValid: true,
        metadata: metadata.calculateWordMetadata(normalizedWord)
      };
    } catch (error) {
      console.error('Error validating word:', error);
      return {
        isValid: false,
        error: 'Error validating word'
      };
    }
  }
}

export const dictionaryService = new DictionaryService();