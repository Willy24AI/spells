// app/api/puzzle/generate/route.ts

import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { WordList } from '@/lib/dictionary/wordList';
import { PuzzleGenerator } from '@/lib/puzzleGenerator/generator';
import { dateUtils } from '@/lib/utils/dateUtils';
import type { GeneratorOptions, GeneratedPuzzle } from '@/lib/types/puzzleGenerator';

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check admin status
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.user_metadata.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { 
      date, 
      count = 1,
      options = {} as GeneratorOptions
    } = body;

    // Set default generator options
    const generatorOptions: GeneratorOptions = {
      minQualityScore: 70,
      minWordCount: 30,
      minCommonWords: 20,
      preferCommonWords: true,
      stage: 1,
      targetDifficulty: 'medium',
      maxAttempts: 100,
      ...options
    };

    // Initialize word list and generator
    const wordList = new WordList();
    await wordList.initialize();
    const generator = new PuzzleGenerator(wordList);

    const puzzles: GeneratedPuzzle[] = [];
    const errors: any[] = [];

    // Generate puzzles
    for (let i = 0; i < count; i++) {
      try {
        const result = await generator.generatePuzzle(generatorOptions);
        
        if (result.error || !result.puzzle) {
          errors.push({
            index: i,
            error: result.error || 'Failed to generate puzzle',
            attempts: result.attempts
          });
          continue;
        }

        puzzles.push(result.puzzle);
      } catch (error) {
        errors.push({
          index: i,
          error: error instanceof Error ? error.message : 'Unknown error',
          attempts: 0
        });
      }
    }

    if (puzzles.length === 0) {
      throw new Error(`Failed to generate any valid puzzles. Errors: ${JSON.stringify(errors)}`);
    }

    // Store puzzles
    const puzzleData = puzzles.map((puzzle, index) => ({
      date: date 
        ? dateUtils.getDayKey(new Date(date)) 
        : dateUtils.getDayKey(new Date(Date.now() + index * 24 * 60 * 60 * 1000)),
      center_letter: puzzle.centerLetter,
      outer_letters: puzzle.outerLetters,
      valid_words: puzzle.validWords,
      pangrams: puzzle.pangrams,
      max_score: puzzle.maxScore,
      quality_score: Math.round(puzzle.qualityScore),
      word_count: puzzle.wordCount,
      common_word_count: puzzle.commonWordCount,
      short_word_percentage: puzzle.shortWordPercentage,
      average_word_length: puzzle.averageWordLength,
      word_length_distribution: puzzle.wordLengthDistribution,
      difficulty: puzzle.difficulty,
      stage: puzzle.stage,
      metrics: puzzle.metrics,
      generator_version: puzzle.generatorVersion
    }));

    // Store in database with metadata
    const { data, error } = await supabase
      .from('daily_puzzles')
      .upsert(puzzleData.map(puzzle => ({
        ...puzzle,
        generation_metadata: {
          options: generatorOptions,
          metrics: puzzle.metrics
        }
      })), {
        onConflict: 'date',
        ignoreDuplicates: false
      })
      .select();

    if (error) throw error;

    return NextResponse.json({
      generated: puzzles.length,
      puzzles: data,
      errors: errors.length > 0 ? errors : undefined,
      metadata: {
        generatorOptions,
        successRate: puzzles.length / count
      }
    });
  } catch (error) {
    console.error('Puzzle generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate puzzles',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}