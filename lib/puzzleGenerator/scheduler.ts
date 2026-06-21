// lib/puzzleGenerator/scheduler.ts

import { supabase } from '@/lib/db';
import { getSupabaseAdmin } from '@/lib/db/admin';
import { dateUtils } from '@/lib/utils/dateUtils';
import type { PuzzleGenerator } from './generator';
import type { GeneratedPuzzle } from '@/lib/types/puzzleGenerator';
import type { Database } from '@/types/supabase';

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

type DailyPuzzle = Database['public']['Tables']['daily_puzzles']['Row'];

export class PuzzleScheduler {
  private defaultOptions: SchedulerOptions = {
    daysAhead: 7,        // Generate puzzles for next 7 days
    minQualityScore: 60, // Must match the generator's MIN_QUALITY_SCORE
    maxAttempts: 10,     // Maximum generation attempts per day
    retryDelay: 1000     // Delay between attempts in ms
  };

  constructor(
    private generator: PuzzleGenerator,
    private options: Partial<SchedulerOptions> = {}
  ) {
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

    for (let i = 1; i <= (this.options.daysAhead || 7); i++) {
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
    const { data: existingPuzzles } = await supabase
      .from('daily_puzzles')
      .select('date')
      .in('date', dates);

    const existingDates = new Set(existingPuzzles?.map(p => p.date) || []);
    return dates.filter(date => !existingDates.has(date));
  }

  /**
   * Generate a puzzle for a specific date
   */
  private async generatePuzzleForDate(date: string): Promise<GenerationResult> {
    let attempts = 0;

    while (attempts < (this.options.maxAttempts || 10)) {
      try {
        // Generate a puzzle seeded with this specific date so each day differs.
        const generatedPuzzle = await this.generator.generatePuzzle(date);

        // Ensure puzzle meets quality threshold
        if (generatedPuzzle.qualityScore < (this.options.minQualityScore || 80)) {
          attempts++;
          if (attempts < (this.options.maxAttempts || 10)) {
            await new Promise(resolve => 
              setTimeout(resolve, this.options.retryDelay || 1000)
            );
            continue;
          }
          throw new Error('Failed to generate acceptable puzzle');
        }

        // Save to database (upsert so re-runs don't fail on the date unique key)
        const { data: insertedPuzzle, error } = await getSupabaseAdmin()
          .from('daily_puzzles')
          .upsert({
            date,
            center_letter: generatedPuzzle.centerLetter,
            outer_letters: generatedPuzzle.outerLetters,
            valid_words: generatedPuzzle.validWords,
            pangrams: generatedPuzzle.pangrams,
            max_score: generatedPuzzle.maxScore,
            word_count: generatedPuzzle.validWords.length,
            quality_score: generatedPuzzle.qualityScore
          }, {
            onConflict: 'date'
          })
          .select()
          .single();

        if (error) throw error;

        // Return success with the inserted puzzle ID
        if (insertedPuzzle) {
          return {
            success: true,
            puzzleId: insertedPuzzle.id
          };
        }

        throw new Error('Failed to insert puzzle');
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

    const puzzlesList = puzzles || [];
    const scheduledDates = new Set(puzzlesList.map(p => p.date));
    const nextEmptyDate = futureDates.find(date => !scheduledDates.has(date)) || null;

    const qualityScores = puzzlesList
      .map(p => p.quality_score)
      .filter((score): score is number => score !== null);

    const qualityStats = {
      average: qualityScores.length 
        ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length 
        : 0,
      lowest: qualityScores.length ? Math.min(...qualityScores) : 0,
      highest: qualityScores.length ? Math.max(...qualityScores) : 0
    };

    return {
      daysScheduled: scheduledDates.size,
      nextEmptyDate,
      qualityStats
    };
  }
}