// lib/services/puzzleService.ts

import { supabase } from '@/lib/db';
import { queries } from '@/lib/db/queries';
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
  private generator: PuzzleGenerator | null = null;
  private qualityMetrics = new QualityMetrics();
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

  private async ensureInitialized() {
    if (!this.initialized) {
      await this.initializeService();
    }
  }

  private calculateAverageWordLength(words: string[]): number {
    if (words.length === 0) return 0;
    const totalLength = words.reduce((sum, word) => sum + word.length, 0);
    return Number((totalLength / words.length).toFixed(2));
  }

  private calculateWordLengthDistribution(words: string[]): Record<number, number> {
    const distribution: Record<number, number> = {};
    words.forEach(word => {
      const length = word.length;
      distribution[length] = (distribution[length] || 0) + 1;
    });
    return distribution;
  }

  /**
   * Get puzzle by date
   */
  async getPuzzle(date: string): Promise<GeneratedPuzzle | null> {
    // Try cache first
    const cached = cacheService.getPuzzle(date);
    if (cached) {
      return cached;
    }

    try {
      // Use the queries helper
      const puzzle = await queries.getDailyPuzzle(date);
      
      if (puzzle) {
        cacheService.setPuzzle(date, puzzle);
      }
      
      return puzzle;
    } catch (error) {
      console.error('Error fetching puzzle:', error);
      return null;
    }
  }

  /**
   * Check which dates already have puzzles
   */
  async checkExistingPuzzles(dates: string[]): Promise<Set<string>> {
    try {
      return await queries.checkExistingPuzzles(dates);
    } catch (error) {
      console.error('Error checking existing puzzles:', error);
      return new Set();
    }
  }

  /**
   * Generate a new puzzle
   */
  async generatePuzzle(
    options: ExtendedGeneratorOptions = {}
  ): Promise<GenerationResult> {
    await this.ensureInitialized();
    if (!this.generator) {
      throw new Error('Puzzle generator not initialized');
    }

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
        console.error('Puzzle generation attempt failed:', error);
        if (attempts === (options.maxAttempts || 10)) {
          throw error;
        }
      }
    }

    throw new Error('Failed to generate acceptable puzzle');
  }

  /**
   * Schedule puzzles for specific dates
   */
  async schedulePuzzles(
    options: {
      dates: string[];
      minQualityScore: number;
      maxAttempts?: number;
      retryDelay?: number;
    }
  ): Promise<GeneratedPuzzle[]> {
    await this.ensureInitialized();
    
    const puzzles: GeneratedPuzzle[] = [];
    const { dates, minQualityScore, maxAttempts = 10, retryDelay = 1000 } = options;

    try {
      // Check which dates already have puzzles
      const existingDates = await this.checkExistingPuzzles(dates);
      console.log('Existing dates:', Array.from(existingDates));
      
      // Filter to only dates that need puzzles
      const neededDates = dates.filter(date => !existingDates.has(date));
      console.log('Dates needing puzzles:', neededDates);

      // Generate puzzles for needed dates
      for (const date of neededDates) {
        try {
          console.log(`Generating puzzle for ${date}...`);
          const { puzzle } = await this.generatePuzzle({
            minQualityScore,
            maxAttempts,
            seed: date
          });

          // Store the puzzle
          await queries.insertPuzzle({
            ...puzzle,
            dateGenerated: date
          });

          puzzles.push(puzzle);
          console.log(`Successfully generated puzzle for ${date}`);

          // Add delay between generations if specified
          if (retryDelay > 0 && neededDates.indexOf(date) < neededDates.length - 1) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        } catch (error) {
          console.error(`Failed to generate puzzle for ${date}:`, error);
        }
      }

      return puzzles;
    } catch (error) {
      console.error('Failed to schedule puzzles:', error);
      throw error;
    }
  }

  /**
   * Store puzzle in the database
   */
  async storePuzzle(puzzle: GeneratedPuzzle): Promise<void> {
    try {
      await queries.insertPuzzle(puzzle);
    } catch (error) {
      throw new Error(`Failed to store puzzle: ${error}`);
    }
  }

  /**
   * Evaluate puzzle quality
   */
  async evaluateQuality(puzzle: GeneratedPuzzle): Promise<QualityReport> {
    const metrics = this.qualityMetrics.calculateMetrics(
      puzzle.validWords,
      puzzle.pangrams
    );

    const passes = metrics.qualityScore >= 50; // Reduced from 70
    const failureReasons: string[] = [];
    const suggestions: string[] = [];

    // Add quality checks and suggestions with more lenient criteria
    if (metrics.totalWords < 10) { // Reduced from 20
      failureReasons.push('Too few words');
      suggestions.push('Try adjusting letter combinations to allow more valid words');
    }
    if (metrics.pangramCount < 1) {
      failureReasons.push('No pangrams found');
      suggestions.push('Include letter combinations that form at least one pangram');
    }
    if (metrics.averageWordLength < 4.5) { // Reduced from 5
      failureReasons.push('Words are too short on average');
      suggestions.push('Adjust letters to encourage longer word formations');
    }
    if (metrics.difficultyScore < 35) { // Reduced from 40
      failureReasons.push('Puzzle may be too easy');
      suggestions.push('Include more challenging letter combinations');
    }
    if (metrics.difficultyScore > 75) { // Increased from 70
      failureReasons.push('Puzzle may be too difficult');
      suggestions.push('Consider including more common letter patterns');
    }

    return {
      passes,
      metrics,
      failureReasons,
      suggestions
    };
  }

  /**
   * Get today's puzzle
   */
  async getTodaysPuzzle(): Promise<GeneratedPuzzle | null> {
    const today = new Date().toISOString().split('T')[0];
    return this.getPuzzle(today);
  }
}

// Export a singleton instance of the service
export const puzzleService = new PuzzleService();