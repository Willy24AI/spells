import { supabase } from '@/lib/db';
import { dictionaryService } from './dictionaryService';
import { cacheService } from './cacheService';
import { PuzzleGenerator } from '@/lib/puzzleGenerator/generator';
import { QualityMetrics } from '@/lib/puzzleGenerator/qualityMetrics';
import { WordList } from '@/lib/dictionary/wordList';
import type { 
  GeneratedPuzzle,
  GeneratorOptions,
  GenerationResult,
  ScheduleOptions
} from '@/lib/types/puzzleGenerator';
import type { 
  PuzzleMetrics,
  QualityReport,
  PlayMetrics 
} from '@/lib/types/quality';

interface ExtendedGeneratorOptions extends GeneratorOptions {
  maxAttempts?: number;
}

class PuzzleService {
  private generator: PuzzleGenerator;
  private qualityMetrics = new QualityMetrics();

  constructor() {
    this.generator = new PuzzleGenerator(dictionaryService as unknown as WordList);
  }

  /**
   * Generate a new puzzle
   */
  async generatePuzzle(
    options: ExtendedGeneratorOptions = {}
  ): Promise<GenerationResult> {
    const startTime = Date.now();
    let attempts = 0;
    
    while (attempts < (options.maxAttempts || 10)) {
      try {
        attempts++;
        const puzzleData = await this.generator.generatePuzzle();
        
        const puzzle: GeneratedPuzzle = {
          id: crypto.randomUUID(),
          centerLetter: puzzleData.centerLetter,
          outerLetters: puzzleData.outerLetters,
          validWords: puzzleData.validWords,
          pangrams: puzzleData.pangrams,
          maxScore: puzzleData.maxScore,
          qualityScore: puzzleData.qualityScore,
          wordCount: puzzleData.validWords.length,
          averageWordLength: this.calculateAverageWordLength(puzzleData.validWords),
          wordLengthDistribution: this.calculateWordLengthDistribution(puzzleData.validWords),
          dateGenerated: new Date().toISOString(),
          generatorVersion: '1.0.0'
        };
        
        const quality = await this.evaluateQuality(puzzle);
        if (quality.passes || attempts === (options.maxAttempts || 10)) {
          return {
            puzzle,
            attempts,
            generationTime: Date.now() - startTime
          };
        }
      } catch (error) {
        if (attempts === (options.maxAttempts || 10)) {
          throw error;
        }
      }
    }

    throw new Error('Failed to generate acceptable puzzle');
  }

  /**
   * Schedule puzzles for future dates
   */
  async schedulePuzzles(
    options: ScheduleOptions
  ): Promise<GeneratedPuzzle[]> {
    const { daysAhead, minQualityScore } = options;
    const puzzles: GeneratedPuzzle[] = [];
    
    // Get dates we need puzzles for
    const today = new Date();
    const dates: string[] = [];
    for (let i = 1; i <= daysAhead; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }

    // Check which dates need puzzles
    const { data: existing } = await supabase
      .from('daily_puzzles')
      .select('date')
      .in('date', dates);

    const existingDates = new Set(existing?.map(p => p.date));
    const neededDates = dates.filter(date => !existingDates.has(date));

    // Generate puzzles for needed dates
    for (const date of neededDates) {
      try {
        const { puzzle } = await this.generatePuzzle({
          minQualityScore,
          seed: date
        });

        // Store in database
        const { data, error } = await supabase
          .from('daily_puzzles')
          .insert({
            date,
            center_letter: puzzle.centerLetter,
            outer_letters: puzzle.outerLetters,
            valid_words: puzzle.validWords,
            pangrams: puzzle.pangrams,
            max_score: puzzle.maxScore,
            quality_score: puzzle.qualityScore,
            word_count: puzzle.wordCount,
            generator_version: puzzle.generatorVersion
          })
          .select()
          .single();

        if (error) throw error;
        puzzles.push(puzzle);
      } catch (error) {
        console.error(`Failed to generate puzzle for ${date}:`, error);
      }
    }

    return puzzles;
  }

  /**
   * Store puzzle in the database
   */
  async storePuzzle(puzzle: GeneratedPuzzle): Promise<void> {
    const { error } = await supabase
      .from('daily_puzzles')
      .insert({
        id: puzzle.id,
        date: new Date(puzzle.dateGenerated).toISOString().split('T')[0],
        center_letter: puzzle.centerLetter,
        outer_letters: puzzle.outerLetters,
        valid_words: puzzle.validWords,
        pangrams: puzzle.pangrams,
        max_score: puzzle.maxScore,
        quality_score: puzzle.qualityScore,
        word_count: puzzle.wordCount,
        average_word_length: puzzle.averageWordLength,
        word_length_distribution: puzzle.wordLengthDistribution,
        generator_version: puzzle.generatorVersion
      });

    if (error) {
      throw new Error(`Failed to store puzzle: ${error.message}`);
    }
  }

  /**
   * Evaluate puzzle quality
   */
  async evaluateQuality(puzzle: GeneratedPuzzle): Promise<QualityReport> {
    // Get base metrics
    const metrics = this.qualityMetrics.calculateMetrics(puzzle.validWords, puzzle.pangrams);
    
    // Get play metrics if available
    let playMetrics: PlayMetrics | undefined;
    const { data } = await supabase
      .from('game_stats')
      .select('score, words_found')
      .eq('puzzle_id', puzzle.id);

    if (data && data.length > 0) {
      playMetrics = {
        timesPlayed: data.length,
        averageScore: data.reduce((sum, stat) => sum + stat.score, 0) / data.length,
        highestScore: Math.max(...data.map(stat => stat.score)),
        averageCompletion: data.reduce((sum, stat) => sum + (stat.words_found / puzzle.wordCount), 0) / data.length,
        wordFindRate: {}
      };
    }

    // Evaluate against thresholds
    const passes = 
      metrics.totalWords >= 20 &&
      metrics.pangramCount >= 1 &&
      metrics.qualityScore >= 80;

    const failureReasons: string[] = [];
    if (metrics.totalWords < 20) failureReasons.push('Too few words');
    if (metrics.pangramCount < 1) failureReasons.push('No pangrams');
    if (metrics.qualityScore < 80) failureReasons.push('Low quality score');

    // Generate suggestions
    const suggestions: string[] = [];
    if (metrics.averageWordLength < 5) {
      suggestions.push('Consider letter combinations that encourage longer words');
    }
    if (metrics.wordLengthDistribution[4] > metrics.totalWords * 0.4) {
      suggestions.push('High proportion of 4-letter words - try different letter combinations');
    }

    return {
      metrics,
      playMetrics,
      passes,
      failureReasons,
      suggestions
    };
  }

  /**
   * Get puzzle by date
   */
  async getPuzzle(date: string): Promise<GeneratedPuzzle | null> {
    // Check cache first
    const cached = cacheService.getPuzzle(date);
    if (cached) return cached;

    // Query database
    const { data, error } = await supabase
      .from('daily_puzzles')
      .select('*')
      .eq('date', date)
      .single();

    if (error) return null;

    // Transform and cache
    const puzzle: GeneratedPuzzle = {
      id: data.id,
      centerLetter: data.center_letter,
      outerLetters: data.outer_letters,
      validWords: data.valid_words,
      pangrams: data.pangrams,
      maxScore: data.max_score,
      qualityScore: data.quality_score,
      wordCount: data.word_count,
      averageWordLength: data.average_word_length,
      wordLengthDistribution: data.word_length_distribution,
      dateGenerated: data.created_at,
      generatorVersion: data.generator_version
    };

    cacheService.setPuzzle(date, puzzle);
    return puzzle;
  }

  /**
   * Validate word against puzzle
   */
  validateWord(
    word: string, 
    puzzleId: string
  ): Promise<{
    valid: boolean;
    score?: number;
    isPangram?: boolean;
    error?: string;
  }> {
    return cacheService.validateWord(word, puzzleId);
  }

  private calculateAverageWordLength(words: string[]): number {
    const totalLength = words.reduce((sum, word) => sum + word.length, 0);
    return words.length > 0 ? totalLength / words.length : 0;
  }

  private calculateWordLengthDistribution(words: string[]): Record<number, number> {
    const distribution: Record<number, number> = {};
    words.forEach(word => {
      distribution[word.length] = (distribution[word.length] || 0) + 1;
    });
    return distribution;
  }
}

// Export singleton instance
export const puzzleService = new PuzzleService();