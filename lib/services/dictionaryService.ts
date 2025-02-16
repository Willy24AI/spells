// lib/services/dictionaryService.ts
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
    return data?.map(p => p.word) || [];
  }

  async findValidWords(
    centerLetter: string,
    outerLetters: string[]
  ): Promise<string[]> {
    const allLetters = [centerLetter, ...outerLetters].map(l => l.toLowerCase());
    
    const { data, error } = await supabase
      .from('words')
      .select('word');

    if (error) throw error;

    return (data || [])
      .map(w => w.word)
      .filter(word => {
        const lowercaseWord = word.toLowerCase();
        return lowercaseWord.includes(centerLetter.toLowerCase()) &&
          lowercaseWord.split('').every((letter: string) => 
            allLetters.includes(letter)
          );
      });
  }

  async getWordMetadata(word: string): Promise<WordMetadata | null> {
    const cached = this.cache.get(word.toLowerCase());
    if (cached) {
      return {
        length: cached.length,
        isPangram: cached.isPangram,
        points: cached.points
      };
    }

    const { data, error } = await supabase
      .from('words')
      .select('*')
      .eq('word', word.toLowerCase())
      .single();

    if (error || !data) return null;

    return {
      length: data.length,
      isPangram: data.is_pangram,
      points: data.points
    };
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

    return (data || []).map(dbWord => ({
      id: dbWord.id,
      word: dbWord.word,
      length: dbWord.length,
      isPangram: dbWord.is_pangram,
      points: dbWord.points,
      createdAt: dbWord.created_at
    }));
  }

  // ... rest of the class implementation remains the same
}

export const dictionaryService = new DictionaryService();