// lib/services/puzzleService.ts

import { supabase } from '@/lib/db';
import { queries } from '@/lib/db/queries';
import { cacheService } from './cacheService';
import { WordList } from '@/lib/dictionary/wordList';
import { PuzzleGenerator } from '@/lib/puzzleGenerator/generator';
import type { GeneratedPuzzle, PuzzleStage } from '@/lib/types/puzzleGenerator';

interface DatabasePuzzle {
  id: string;
  date: string;
  center_letter: string;
  outer_letters: string[];
  valid_words: string[];
  pangrams: string[];
  max_score: number;
  quality_score: number;
  word_count: number;
  average_word_length: number;
  word_length_distribution: Record<number, number>;
  generator_version: string;
  created_at: string;
  stage: number;
}

class PuzzleService {
  private generator: PuzzleGenerator | null = null;
  private initialized = false;

  constructor() {
    this.initializeService();
  }

  private async initializeService() {
    const wordList = new WordList();
    await wordList.initialize();
    this.generator = new PuzzleGenerator(wordList);
    this.initialized = true;
  }


  async generatePuzzle(targetDate?: string): Promise<GeneratedPuzzle> {
    await this.ensureInitialized();
    if (!this.generator) {
      throw new Error('Puzzle generator not initialized');
    }

    const date = targetDate || new Date().toISOString().split('T')[0];
    return this.generator.generatePuzzle(date);
  }

  async getPuzzle(date: string): Promise<GeneratedPuzzle | null> {
    try {
      // Check cache first
      const cached = cacheService.getPuzzle(date);
      if (cached) return cached;

      const { data: puzzle } = await supabase
        .from('daily_puzzles')
        .select('*')
        .eq('date', date)
        .single();

      if (!puzzle) return null;

      // Convert database puzzle to GeneratedPuzzle format
      const result: GeneratedPuzzle = {
        id: puzzle.id,
        centerLetter: puzzle.center_letter,
        outerLetters: puzzle.outer_letters,
        validWords: puzzle.valid_words,
        pangrams: puzzle.pangrams,
        maxScore: puzzle.max_score,
        qualityScore: puzzle.quality_score,
        wordCount: puzzle.word_count,
        commonWordCount: this.calculateCommonWordCount(puzzle.valid_words),
        shortWordPercentage: this.calculateShortWordPercentage(puzzle.valid_words),
        averageWordLength: puzzle.average_word_length,
        wordLengthDistribution: puzzle.word_length_distribution,
        difficulty: this.calculateDifficulty(puzzle.quality_score),
        stage: puzzle.stage as PuzzleStage,
        metrics: {
          wordCount: puzzle.word_count,
          uniqueLetters: 7,
          pangramCount: puzzle.pangrams.length,
          averageWordLength: puzzle.average_word_length,
          commonWordPercentage: this.calculateCommonWordPercentage(puzzle.valid_words),
          difficultyScore: puzzle.quality_score,
          qualityScore: puzzle.quality_score,
          wordFamilyCount: this.calculateWordFamilyCount(puzzle.valid_words)
        },
        dateGenerated: puzzle.created_at,
        generatorVersion: puzzle.generator_version,
        date: puzzle.date
      };

      cacheService.setPuzzle(date, result);
      return result;
    } catch (error) {
      console.error('Error fetching puzzle:', error);
      return null;
    }
  }

  async savePuzzle(puzzle: GeneratedPuzzle) {
    try {
      if (!puzzle.date) {
        throw new Error('Puzzle date is required');
      }

     // Convert GeneratedPuzzle to database format
     const dbPuzzle: Partial<DatabasePuzzle> = {
      id: puzzle.id,
      date: puzzle.date,
      center_letter: puzzle.centerLetter,
      outer_letters: puzzle.outerLetters,
      valid_words: puzzle.validWords,
      pangrams: puzzle.pangrams,
      max_score: puzzle.maxScore,
      quality_score: puzzle.qualityScore,
      word_count: puzzle.wordCount,
      average_word_length: puzzle.averageWordLength,
      word_length_distribution: puzzle.wordLengthDistribution,
      generator_version: puzzle.generatorVersion,
      stage: puzzle.stage
    };

    const { data, error } = await supabase
      .from('daily_puzzles')
      .upsert(dbPuzzle, {
        onConflict: 'date'
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error saving puzzle:', error);
    return { data: null, error };
  }
}

  private calculateCommonWordCount(words: string[]): number {
    if (!Array.isArray(words)) return 0;
    return words.filter(word => word.length <= 6).length;
  }

  private calculateShortWordPercentage(words: string[]): number {
    if (!Array.isArray(words) || words.length === 0) return 0;
    const shortWords = words.filter(word => word.length <= 5);
    return (shortWords.length / words.length) * 100;
  }

  private calculateCommonWordPercentage(words: string[]): number {
    if (!Array.isArray(words) || words.length === 0) return 0;
    const commonWords = this.calculateCommonWordCount(words);
    return (commonWords / words.length) * 100;
  }

  private calculateWordFamilyCount(words: string[]): number {
    const families = new Set<string>();
    for (const word of words) {
      const root = this.getWordRoot(word);
      families.add(root);
    }
    return families.size;
  }

  private getWordRoot(word: string): string {
    const commonSuffixes = ['s', 'es', 'ed', 'ing', 'er', 'ers', 'est'];
    let root = word.toLowerCase();
    for (const suffix of commonSuffixes) {
      if (root.endsWith(suffix)) {
        // Special handling for -ing
        if (suffix === 'ing' && root.endsWith('ing')) {
          if (root.endsWith('ying')) {
            return root.slice(0, -4) + 'y';
          }
          return root.slice(0, -3) + 'e';
        }
        root = root.slice(0, -suffix.length);
        break;
      }
    }
    return root;
  }

  private calculateDifficulty(qualityScore: number): 'easy' | 'medium' | 'hard' {
    if (qualityScore < 60) return 'easy';
    if (qualityScore < 80) return 'medium';
    return 'hard';
  }

  private async ensureInitialized() {
    if (!this.initialized) {
      await this.initializeService();
    }
  }
}