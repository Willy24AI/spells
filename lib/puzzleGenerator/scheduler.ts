// lib/puzzleGenerator/scheduler.ts

import { supabase } from '@/lib/db';
import { dateUtils } from '@/lib/utils/dateUtils';

interface SchedulerOptions {
  daysAhead: number;
  minQualityScore: number;
  maxAttempts: number;
  retryDelay: number;
}

interface GenerationResult {
  success: boolean;
  puzzleId?: string;
  error?: string;
}

export class PuzzleScheduler {
  private defaultOptions: SchedulerOptions = {
    daysAhead: 7,        // Generate puzzles for next 7 days
    minQualityScore: 80, // Minimum acceptable quality score
    maxAttempts: 10,     // Maximum generation attempts per day
    retryDelay: 1000     // Delay between attempts in ms
  };

  constructor(private generator: any, private options: Partial<SchedulerOptions> = {}) {
    this.options = { ...this.defaultOptions, ...options };
  }

  /**
   * Generate puzzles for future dates
   */
  async schedulePuzzles(): Promise<GenerationResult[]> {
    const results: GenerationResult[] = [];
    
    // Get dates we need puzzles for
    const dates = this.getFutureDates();
    
    // Check which dates need puzzles
    const needed = await this.filterExistingPuzzles(dates);
    
    // Generate puzzles for each needed date
    for (const date of needed) {
      const result = await this.generatePuzzleForDate(date);
      results.push(result);
    }

    return results;
  }

  /**
   * Get future dates we need to generate for
   */
  private getFutureDates(): string[] {
    const dates: string[] = [];
    const today = new Date();

    for (let i = 1; i <= this.options.daysAhead; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      dates.push(dateUtils.getDayKey(date));
    }

    return dates;
  }

  /**
   * Filter out dates that already have puzzles
   */
  private async filterExistingPuzzles(dates: string[]): Promise<string[]> {
    const { data: existing } = await supabase
      .from('daily_puzzles')
      .select('date')
      .in('date', dates);

    const existingDates = new Set(existing?.map(p => p.date));
    return dates.filter(date => !existingDates.has(date));
  }

  /**
   * Generate a puzzle for a specific date
   */
  private async generatePuzzleForDate(date: string): Promise<GenerationResult> {
    let attempts = 0;

    while (attempts < this.options.maxAttempts) {
      try {
        // Generate a puzzle
        const puzzle = await this.generator.generatePuzzle();
        
        // Check quality score
        if (puzzle.qualityScore >= this.options.minQualityScore) {
          // Save to database
          const { data, error } = await supabase
            .from('daily_puzzles')
            .insert({
              date,
              center_letter: puzzle.centerLetter,
              outer_letters: puzzle.outerLetters,
              valid_words: puzzle.validWords,
              pangrams: puzzle.pangrams,
              max_score: puzzle.maxScore,
              quality_score: puzzle.qualityScore
            })
            .select()
            .single();

          if (error) throw error;

          return {
            success: true,
            puzzleId: data.id
          };
        }

        // If quality score too low, try again
        attempts++;
        if (attempts < this.options.maxAttempts) {
          await new Promise(resolve => 
            setTimeout(resolve, this.options.retryDelay)
          );
        }
      } catch (error) {
        console.error(`Error generating puzzle for ${date}:`, error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    return {
      success: false,
      error: `Failed to generate acceptable puzzle after ${attempts} attempts`
    };
  }

  /**
   * Check puzzle generation status
   */
  async getScheduleStatus(): Promise<{
    daysScheduled: number;
    nextEmptyDate: string | null;
    qualityStats: {
      average: number;
      lowest: number;
      highest: number;
    };
  }> {
    const futureDates = this.getFutureDates();
    
    const { data: puzzles } = await supabase
      .from('daily_puzzles')
      .select('date, quality_score')
      .in('date', futureDates);

    const scheduledDates = new Set(puzzles?.map(p => p.date) || []);
    const nextEmptyDate = futureDates.find(date => !scheduledDates.has(date)) || null;

    const qualityScores = puzzles?.map(p => p.quality_score) || [];
    const qualityStats = {
      average: qualityScores.length 
        ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length 
        : 0,
      lowest: Math.min(...qualityScores, 100),
      highest: Math.max(...qualityScores, 0)
    };

    return {
      daysScheduled: scheduledDates.size,
      nextEmptyDate,
      qualityStats
    };
  }
}