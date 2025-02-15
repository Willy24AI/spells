import { supabase } from '@/lib/db';
import type { 
  Word, 
  WordFilter, 
  WordMetadata,
  DictionaryStats,
  ImportResult,
  ValidationResult
} from '@/lib/types/dictionary';
import { filters } from '@/lib/dictionary/filters';
import { metadata } from '@/lib/dictionary/metadata';
import { PostgrestError } from '@supabase/supabase-js';

type DictionaryRow = {
  length: number;
  is_pangram: boolean;
  letter_count: Record<string, number>;
};

class DictionaryService {
  private cache: Map<string, Word>;
  private stats: DictionaryStats | null;

  constructor() {
    this.cache = new Map();
    this.stats = null;
  }

  /**
   * Search for words in the dictionary
   */
  async searchWords(
    query: string,
    options: {
      limit?: number;
      offset?: number;
      filter?: WordFilter;
    } = {}
  ): Promise<Word[]> {
    const { limit = 100, offset = 0, filter } = options;

    let dbQuery = supabase
      .from('dictionary')
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

    return data as Word[];
  }

  /**
   * Add new words to the dictionary
   */
  async importWords(words: string[]): Promise<ImportResult> {
    const result: ImportResult = {
      added: 0,
      skipped: 0,
      errors: []
    };

    // Process in batches
    const batchSize = 100;
    for (let i = 0; i < words.length; i += batchSize) {
      const batch = words.slice(i, i + batchSize);
      
      // Filter and prepare words
      const validWords = batch.filter(word => {
        try {
          return filters.applyAll(word);
        } catch (err) {
          const error = err as Error;
          result.errors.push(`Error processing ${word}: ${error.message}`);
          return false;
        }
      });

      // Calculate metadata and prepare for insertion
      const wordData = validWords.map(word => {
        const meta = metadata.calculateWordMetadata(word);
        const { word: _, ...metaWithoutWord } = meta;
        return {
          word: word.toLowerCase(),
          ...metaWithoutWord
        };
      });

      // Insert into database
      const { error } = await supabase
        .from('dictionary')
        .upsert(wordData, {
          onConflict: 'word',
          ignoreDuplicates: true
        });

      if (error) {
        result.errors.push(`Batch insert error: ${(error as PostgrestError).message}`);
        result.skipped += batch.length;
      } else {
        result.added += wordData.length;
        result.skipped += batch.length - wordData.length;

        // Update cache for successful insertions
        wordData.forEach(word => {
          this.cache.set(word.word, word as Word);
        });
      }
    }

    // Invalidate stats after import
    this.stats = null;

    return result;
  }

  /**
   * Validate a word for dictionary inclusion
   */
  validateWord(word: string, filter?: WordFilter): ValidationResult {
    try {
      const normalizedWord = word.toLowerCase();
      
      // Apply filters
      const filterResult = filters.applyAll(normalizedWord, filter);
      if (!filterResult) {
        return {
          isValid: false,
          error: 'Word does not meet filter criteria'
        };
      }

      // Calculate metadata
      const wordMetadata = metadata.calculateWordMetadata(normalizedWord);

      return {
        isValid: true,
        metadata: wordMetadata
      };
    } catch (err) {
      const error = err as Error;
      return {
        isValid: false,
        error: error.message
      };
    }
  }

  /**
   * Get dictionary statistics
   */
  async getStats(): Promise<DictionaryStats> {
    // Return cached stats if available
    if (this.stats) return this.stats;

    const { data, error } = await supabase
      .from('dictionary')
      .select('length, is_pangram, letter_count');

    if (error) throw error;
    if (!data) throw new Error('No data returned from database');

    // Calculate statistics
    const stats: DictionaryStats = {
      totalWords: data.length,
      averageLength: 0,
      pangrams: 0,
      wordLengthDistribution: {},
      letterFrequency: {}
    };

    let totalLength = 0;
    data.forEach((word: DictionaryRow) => {
      totalLength += word.length;
      stats.wordLengthDistribution[word.length] = 
        (stats.wordLengthDistribution[word.length] || 0) + 1;
      
      if (word.is_pangram) stats.pangrams++;

      // Aggregate letter frequency
      Object.entries(word.letter_count).forEach(([letter, count]) => {
        stats.letterFrequency[letter] = 
          (stats.letterFrequency[letter] || 0) + (count as number);
      });
    });

    stats.averageLength = totalLength / data.length;

    // Cache the results
    this.stats = stats;
    return stats;
  }

  /**
   * Clear the service cache
   */
  clearCache(): void {
    this.cache.clear();
    this.stats = null;
  }
}

// Export a singleton instance
export const dictionaryService = new DictionaryService();