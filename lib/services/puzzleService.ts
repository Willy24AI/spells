import { supabase } from '@/lib/db';
import { queries } from '@/lib/db/queries';
import { cacheService } from './cacheService';
import { WordList } from '@/lib/dictionary/wordList';
import { PuzzleGenerator } from '@/lib/puzzleGenerator/generator';
import type { GeneratedPuzzle, PuzzleStage } from '@/lib/types/puzzleGenerator';

class PuzzleService {
  private generator: PuzzleGenerator | null = null;
  private initialized = false;

  constructor() {
    this.initializeService();
  }

  private async initializeService() {
    try {
      const wordList = new WordList();
      await wordList.initialize();
      this.generator = new PuzzleGenerator(wordList);
      this.initialized = true;
      console.log('PuzzleService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize PuzzleService:', error);
      throw error;
    }
  }

  async generatePuzzle(targetDate?: string): Promise<GeneratedPuzzle> {
    await this.ensureInitialized();
    if (!this.generator) {
      throw new Error('Puzzle generator not initialized');
    }

    const date = targetDate || new Date().toISOString().split('T')[0];
    console.log(`Generating puzzle for date: ${date}`);

    // Try multiple times to get a high-quality puzzle
    const attempts = 3;
    let bestPuzzle: GeneratedPuzzle | null = null;
    let maxWordCount = 0;

    for (let i = 0; i < attempts; i++) {
      const puzzle = await this.generator.generatePuzzle(date);
      
      // Verify words exist in dictionary
      const { data: dictWords } = await supabase
        .from('words')
        .select('word')
        .in('word', puzzle.validWords);
      
      const validDictionaryWords = new Set(dictWords?.map(d => d.word.toLowerCase()) || []);
      
      // Filter valid words and update counts
      const validWords = puzzle.validWords.filter(word => 
        validDictionaryWords.has(word.toLowerCase())
      );
      const pangrams = puzzle.pangrams.filter(word => 
        validDictionaryWords.has(word.toLowerCase())
      );

      if (validWords.length > maxWordCount) {
        maxWordCount = validWords.length;
        bestPuzzle = {
          ...puzzle,
          validWords,
          pangrams,
          wordCount: validWords.length
        };
      }
    }

    if (!bestPuzzle) {
      throw new Error('Failed to generate valid puzzle');
    }

    return bestPuzzle;
  }

  async savePuzzle(puzzle: GeneratedPuzzle) {
    try {
      if (!puzzle.date) {
        throw new Error('Puzzle date is required');
      }

      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.user?.id) {
        throw new Error('User must be authenticated to create puzzles');
      }

      // Calculate word length distribution
      const wordLengthDistribution = puzzle.validWords.reduce((acc: Record<number, number>, word: string) => {
        acc[word.length] = (acc[word.length] || 0) + 1;
        return acc;
      }, {});

      // Convert to database format
      const dbPuzzle = {
        date: puzzle.date,
        center_letter: puzzle.centerLetter,
        outer_letters: puzzle.outerLetters,
        valid_words: puzzle.validWords,
        pangrams: puzzle.pangrams,
        max_score: puzzle.maxScore,
        quality_score: puzzle.qualityScore,
        word_count: puzzle.wordCount,
        average_word_length: puzzle.averageWordLength,
        word_length_distribution: wordLengthDistribution,
        generator_version: puzzle.generatorVersion || '2.0.0',
        stage: puzzle.stage,
        created_by: session.session.user.id
      };

      const { data, error } = await supabase
        .from('daily_puzzles')
        .upsert(dbPuzzle, {
          onConflict: 'date'
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving puzzle:', error);
        throw error;
      }

      // Update cache
      if (data) {
        cacheService.setPuzzle(puzzle.date, puzzle);
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error saving puzzle:', error);
      return { data: null, error };
    }
  }

  async getPuzzle(date: string): Promise<GeneratedPuzzle | null> {
    try {
      // Check cache first
      const cached = cacheService.getPuzzle(date);
      if (cached) return cached;

      console.log(`Fetching puzzle for date: ${date}`);

      const { data: puzzle } = await supabase
        .from('daily_puzzles')
        .select('*')
        .eq('date', date)
        .single();

      if (!puzzle) return null;

      // Calculate word length distribution
      const wordLengthDistribution = puzzle.valid_words.reduce((acc: Record<number, number>, word: string) => {
        acc[word.length] = (acc[word.length] || 0) + 1;
        return acc;
      }, {});

      // Calculate long word count
      const entries = Object.entries(wordLengthDistribution) as [string, number][];
      const longWordCount = entries
        .filter(([length]) => parseInt(length) >= 7)
        .reduce((sum, [_, count]) => sum + count, 0);

      // Calculate unique letters
      const uniqueLetters = new Set(puzzle.valid_words.flatMap((word: string) => word.split(''))).size;

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
        commonWordCount: puzzle.valid_words.filter((word: string) => word.length <= 6).length,
        shortWordPercentage: this.calculateShortWordPercentage(puzzle.valid_words),
        averageWordLength: puzzle.average_word_length,
        wordLengthDistribution: puzzle.word_length_distribution,
        difficulty: this.calculateDifficulty(puzzle.quality_score),
        stage: puzzle.stage as PuzzleStage,
        metrics: {
          totalWords: puzzle.word_count,
          wordCount: puzzle.word_count,
          uniqueLetters,
          maxScore: puzzle.max_score,
          pangramCount: puzzle.pangrams.length,
          averageWordLength: puzzle.average_word_length,
          wordLengthDistribution,
          commonWordPercentage: this.calculateCommonWordPercentage(puzzle.valid_words),
          difficultyScore: puzzle.quality_score,
          qualityScore: puzzle.quality_score,
          fourLetterWordCount: wordLengthDistribution[4] || 0,
          fiveLetterWordCount: wordLengthDistribution[5] || 0,
          longWordCount,
          wordFamilyCount: puzzle.valid_words.length
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

  private calculateShortWordPercentage(words: string[]): number {
    if (!Array.isArray(words) || words.length === 0) return 0;
    const shortWords = words.filter((word: string) => word.length <= 5);
    return (shortWords.length / words.length) * 100;
  }

  private calculateCommonWordPercentage(words: string[]): number {
    if (!Array.isArray(words) || words.length === 0) return 0;
    const commonWords = words.filter((word: string) => word.length <= 6);
    return (commonWords.length / words.length) * 100;
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

export const puzzleService = new PuzzleService();