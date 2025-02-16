// lib/db/queries.ts
import { supabase } from './index';
import type { Database } from '@/types/supabase';

interface Word {
  id?: string;
  word: string;
  points: number;
  isPangram: boolean;
  length?: number;
  created_at?: string;
}

interface GeneratedPuzzle {
  id: string;
  centerLetter: string;
  outerLetters: string[];
  validWords: string[];
  pangrams: string[];
  maxScore: number;
  qualityScore: number;
  wordCount: number;
  averageWordLength: number;
  wordLengthDistribution: Record<number, number>;
  dateGenerated: string;
  generatorVersion: string;
}

export const queries = {
  // Puzzle Queries
  getDailyPuzzle: async (date: string) => {
    const { data, error } = await supabase
      .from('daily_puzzles')
      .select('*')
      .eq('date', date)
      .single();

    if (error) throw error;
    
    if (data) {
      return {
        id: data.id,
        centerLetter: data.center_letter,
        outerLetters: data.outer_letters,
        validWords: data.valid_words,
        pangrams: data.pangrams,
        maxScore: data.max_score,
        qualityScore: Number(data.quality_score),
        wordCount: data.word_count,
        averageWordLength: Number(data.average_word_length),
        wordLengthDistribution: data.word_length_distribution,
        dateGenerated: data.created_at,
        generatorVersion: data.generator_version
      } as GeneratedPuzzle;
    }
    
    return null;
  },

  getAllPuzzles: async (
    options: { 
      startDate?: string; 
      endDate?: string;
    } = {}
  ) => {
    let query = supabase
      .from('daily_puzzles')
      .select('*')
      .order('date', { ascending: false });

    if (options.startDate) {
      query = query.gte('date', options.startDate);
    }
    if (options.endDate) {
      query = query.lte('date', options.endDate);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data.map(record => ({
      id: record.id,
      centerLetter: record.center_letter,
      outerLetters: record.outer_letters,
      validWords: record.valid_words,
      pangrams: record.pangrams,
      maxScore: record.max_score,
      qualityScore: Number(record.quality_score),
      wordCount: record.word_count,
      averageWordLength: Number(record.average_word_length),
      wordLengthDistribution: record.word_length_distribution,
      dateGenerated: record.created_at,
      generatorVersion: record.generator_version
    } as GeneratedPuzzle));
  },

  insertPuzzle: async (puzzle: GeneratedPuzzle) => {
    try {
      const formattedDate = new Date(puzzle.dateGenerated).toISOString().split('T')[0];
      
      // Format puzzle data
      const formattedPuzzle = {
        id: puzzle.id,
        date: formattedDate,
        center_letter: puzzle.centerLetter,
        outer_letters: puzzle.outerLetters,
        valid_words: puzzle.validWords,
        pangrams: puzzle.pangrams,
        max_score: Math.round(puzzle.maxScore),
        quality_score: Number(puzzle.qualityScore.toFixed(2)),
        word_count: Math.round(puzzle.wordCount),
        average_word_length: Number(puzzle.averageWordLength.toFixed(2)),
        word_length_distribution: puzzle.wordLengthDistribution,
        generator_version: puzzle.generatorVersion || '1.0.0'
      };

      // Try to get existing puzzle for this date
      const { data: existing } = await supabase
        .from('daily_puzzles')
        .select('id')
        .eq('date', formattedDate)
        .single();

      if (existing) {
        // Update existing puzzle
        const { data, error } = await supabase
          .from('daily_puzzles')
          .update(formattedPuzzle)
          .eq('date', formattedDate)
          .select()
          .single();

        if (error) {
          console.error('Update error details:', {
            error,
            formattedValues: {
              quality_score: formattedPuzzle.quality_score,
              max_score: formattedPuzzle.max_score,
              word_count: formattedPuzzle.word_count,
              average_word_length: formattedPuzzle.average_word_length
            }
          });
          throw error;
        }

        return data;
      } else {
        // Insert new puzzle
        const { data, error } = await supabase
          .from('daily_puzzles')
          .insert(formattedPuzzle)
          .select()
          .single();

        if (error) {
          console.error('Insert error details:', {
            error,
            formattedValues: {
              quality_score: formattedPuzzle.quality_score,
              max_score: formattedPuzzle.max_score,
              word_count: formattedPuzzle.word_count,
              average_word_length: formattedPuzzle.average_word_length
            }
          });
          throw error;
        }

        return data;
      }
    } catch (error) {
      console.error('Failed to insert/update puzzle:', error);
      throw error;
    }
  },

  checkExistingPuzzles: async (dates: string[]) => {
    try {
      const { data, error } = await supabase
        .from('daily_puzzles')
        .select('date')
        .in('date', dates);

      if (error) throw error;
      
      return new Set(data?.map(p => p.date) || []);
    } catch (error) {
      console.error('Failed to check existing puzzles:', error);
      throw error;
    }
  },

  // Word Dictionary Queries
  getWords: async (
    options: {
      minLength?: number;
      maxLength?: number;
      isPangram?: boolean;
      limit?: number;
      offset?: number;
    } = {}
  ) => {
    try {
      let query = supabase
        .from('words')
        .select('*');

      if (options.minLength) {
        query = query.gte('length', options.minLength);
      }
      if (options.maxLength) {
        query = query.lte('length', options.maxLength);
      }
      if (typeof options.isPangram !== 'undefined') {
        query = query.eq('is_pangram', options.isPangram);
      }

      query = query
        .range(options.offset || 0, (options.offset || 0) + (options.limit || 50) - 1)
        .order('word');

      const { data, error } = await query;
      if (error) throw error;
      return data as Word[];
    } catch (error) {
      console.error('Failed to get words:', error);
      throw error;
    }
  },

  searchWords: async (
    query: string,
    options: {
      limit?: number;
      offset?: number;
      minLength?: number;
      maxLength?: number;
      isPangram?: boolean;
    } = {}
  ) => {
    try {
      let dbQuery = supabase
        .from('words')
        .select('*')
        .ilike('word', `%${query}%`);

      if (options.minLength) {
        dbQuery = dbQuery.gte('length', options.minLength);
      }
      if (options.maxLength) {
        dbQuery = dbQuery.lte('length', options.maxLength);
      }
      if (typeof options.isPangram !== 'undefined') {
        dbQuery = dbQuery.eq('is_pangram', options.isPangram);
      }

      dbQuery = dbQuery
        .range(options.offset || 0, (options.offset || 0) + (options.limit || 50) - 1)
        .order('word');

      const { data, error } = await dbQuery;
      if (error) throw error;
      return data as Word[];
    } catch (error) {
      console.error('Failed to search words:', error);
      throw error;
    }
  },

  insertWords: async (words: Array<{ word: string; points: number; isPangram?: boolean }>) => {
    try {
      const { data, error } = await supabase
        .from('words')
        .insert(words.map(word => ({
          word: word.word.toLowerCase(),
          points: Math.round(word.points),
          is_pangram: word.isPangram ?? false
        })))
        .select();

      if (error) throw error;
      return data as Word[];
    } catch (error) {
      console.error('Failed to insert words:', error);
      throw error;
    }
  },

  // Game Stats Queries
  getLeaderboard: async (date: string) => {
    try {
      const { data, error } = await supabase
        .from('game_stats')
        .select('*')
        .eq('date', date)
        .order('score', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get leaderboard:', error);
      throw error;
    }
  },

  getUserStats: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('game_stats')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get user stats:', error);
      throw error;
    }
  },

  validateWord: async (word: string) => {
    try {
      const { data, error } = await supabase
        .from('words')
        .select('*')
        .eq('word', word.toLowerCase())
        .single();

      if (error) return null;
      return data as Word;
    } catch (error) {
      console.error('Failed to validate word:', error);
      return null;
    }
  },

  recordGameStats: async (
    userId: string,
    date: string,
    score: number,
    wordsFound: number
  ) => {
    try {
      const { data, error } = await supabase
        .from('game_stats')
        .insert({
          user_id: userId,
          date: date,
          score: Math.round(score),
          words_found: Math.round(wordsFound)
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to record game stats:', error);
      throw error;
    }
  }
};