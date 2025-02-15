// lib/db/queries.ts

import { supabase } from './index';
import type { Word } from '@/lib/types/dictionary';
import type { GeneratedPuzzle } from '@/lib/types/puzzleGenerator';
import type { Database } from '@/types/supabase';

export const queries = {
  // Puzzle Queries
  getDailyPuzzle: async (date: string) => {
    const { data, error } = await supabase
      .from('daily_puzzles')
      .select(`
        *,
        metrics:puzzle_metrics(
          times_played,
          average_score,
          highest_score,
          word_find_rates
        )
      `)
      .eq('date', date)
      .single();

    if (error) throw error;
    return data;
  },

  getAllPuzzles: async (
    options: { 
      startDate?: string; 
      endDate?: string;
      approved?: boolean;
    } = {}
  ) => {
    let query = supabase
      .from('daily_puzzles')
      .select(`
        *,
        metrics:puzzle_metrics(*)
      `)
      .order('date', { ascending: false });

    if (options.startDate) {
      query = query.gte('date', options.startDate);
    }
    if (options.endDate) {
      query = query.lte('date', options.endDate);
    }
    if (typeof options.approved !== 'undefined') {
      query = query.eq('is_approved', options.approved);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  insertPuzzle: async (puzzle: GeneratedPuzzle) => {
    const { data, error } = await supabase
      .from('daily_puzzles')
      .insert({
        date: puzzle.dateGenerated,
        center_letter: puzzle.centerLetter,
        outer_letters: puzzle.outerLetters,
        valid_words: puzzle.validWords,
        pangrams: puzzle.pangrams,
        max_score: puzzle.maxScore,
        quality_score: puzzle.qualityScore,
        word_count: puzzle.wordCount,
        word_length_distribution: puzzle.wordLengthDistribution,
        generator_version: puzzle.generatorVersion
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Dictionary Queries
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
    let dbQuery = supabase
      .from('dictionary')
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
  },

  insertWords: async (words: Partial<Word>[]) => {
    const { data, error } = await supabase
      .from('dictionary')
      .insert(words)
      .select();

    if (error) throw error;
    return data as Word[];
  },

  // Stats Queries
  getLeaderboard: async (date: string) => {
    const { data, error } = await supabase
      .from('game_stats')
      .select('*')
      .eq('date', date)
      .order('score', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data;
  },

  getUserStats: async (userId: string) => {
    const { data, error } = await supabase
      .from('game_stats')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Validation Queries
  validateWord: async (word: string) => {
    const { data, error } = await supabase
      .from('dictionary')
      .select('*')
      .eq('word', word.toLowerCase())
      .single();

    if (error) return null;
    return data as Word;
  }
};