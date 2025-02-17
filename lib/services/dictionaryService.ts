// lib/services/dictionaryService.ts

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
    const { data, error } = await supabase
      .from('words')
      .select('word')
      .eq('is_pangram', true);

    if (error) throw error;
    return (data || []).map(p => p.word.toLowerCase());
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
    const allLetters = [centerLetter, ...outerLetters].map(l => l.toLowerCase());
    const validWords = new Set<string>();

    // Query base words
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

    // Process words and variations
    for (const { word } of words || []) {
      const normalizedWord = word.toLowerCase();
      
      if (filters.validateForPuzzle(normalizedWord, centerLetter, outerLetters)) {
        validWords.add(normalizedWord);

        // Add variations if enabled
        if (options.includeVariations) {
          this.generateWordVariations(
            normalizedWord, 
            centerLetter, 
            outerLetters
          ).forEach(v => validWords.add(v));
        }
      }
    }

    return Array.from(validWords);
  }

  private generateWordVariations(
    word: string,
    centerLetter: string,
    outerLetters: string[]
  ): string[] {
    const variations = new Set<string>();
    const transforms = [
      (w: string) => w + 's',
      (w: string) => w + 'es',
      (w: string) => w + 'ed',
      (w: string) => w + 'ing',
      (w: string) => w.endsWith('e') ? w.slice(0, -1) + 'ing' : w + 'ing',
      (w: string) => w + 'er',
      (w: string) => w + 'ers'
    ];

    transforms.forEach(transform => {
      const variation = transform(word);
      if (filters.validateForPuzzle(variation, centerLetter, outerLetters)) {
        variations.add(variation);
      }
    });

    return Array.from(variations);
  }

  async getWordMetadata(word: string): Promise<WordMetadata | null> {
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
  }

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
          is_common: meta.commonWord,
          points: meta.points,
          word_family: meta.wordFamily,
          letter_count: meta.letterCount,
          unique_letters: meta.uniqueLetters,
          vowel_count: meta.vowelCount,
          consonant_count: meta.consonantCount,
          frequency: 0 // Initial frequency
        };
      });

      try {
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
      } catch (error) {
        results.errors.push(`Batch ${i}-${i + batchSize}: ${error}`);
        results.skipped += batch.length;
      }
    }

    // Update cache with new words
    await this.refreshCache();

    return results;
  }

  async deleteWords(words: string[]): Promise<{
    deleted: number;
    errors: string[];
  }> {
    const results = {
      deleted: 0,
      errors: [] as string[]
    };

    const { error } = await supabase
      .from('words')
      .delete()
      .in('word', words.map(w => w.toLowerCase()));

    if (error) {
      results.errors.push(error.message);
    } else {
      results.deleted = words.length;
      // Clear these words from cache
      words.forEach(word => this.cache.delete(word.toLowerCase()));
    }

    return results;
  }

  async getStats(): Promise<DictionaryStats> {
    if (this.stats) return this.stats;

    const { data, error } = await supabase
      .from('words')
      .select(`
        id,
        length,
        is_pangram,
        is_common,
        points
      `);

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
  }

  async refreshCache(): Promise<void> {
    this.cache.clear();
    this.stats = null;

    const { data } = await supabase
      .from('words')
      .select('*');

    if (data) {
      data.forEach(word => this.cache.set(word.word, word));
    }
  }

  async validateWord(
    word: string,
    centerLetter: string,
    outerLetters: string[]
  ): Promise<ValidationResult> {
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

    // Validate for puzzle
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
  }
}

export const dictionaryService = new DictionaryService();