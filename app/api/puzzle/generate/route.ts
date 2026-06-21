import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { WordList } from '@/lib/dictionary/wordList';
import { PuzzleGenerator } from '@/lib/puzzleGenerator/generator';
import { getSupabaseAdmin } from '@/lib/db/admin';
import { dateUtils } from '@/lib/utils/dateUtils';
import type { GeneratedPuzzle } from '@/lib/types/puzzleGenerator';

interface GenerationResult {
  puzzle: GeneratedPuzzle | null;
  attempts: number;
  generationTime: number;
  error?: string;
}

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
    const { date, count = 1 } = body;

    // Initialize word list and generator
    const wordList = new WordList();
    await wordList.initialize();
    const generator = new PuzzleGenerator(wordList);

    // Generate puzzles
    const results: GenerationResult[] = [];
    for (let i = 0; i < count; i++) {
      try {
        // Seed each puzzle with its own target date so every day differs.
        const targetDate = date
          ? dateUtils.getDayKey(new Date(new Date(date).getTime() + i * 24 * 60 * 60 * 1000))
          : dateUtils.getDayKey(new Date(Date.now() + i * 24 * 60 * 60 * 1000));
        const result = await generator.generatePuzzle(targetDate);
        results.push({
          puzzle: result,
          attempts: 1, // We don't track attempts in this version
          generationTime: 0 // We don't track generation time in this version
        });
      } catch (error) {
        console.error('Error generating puzzle:', error);
        results.push({
          puzzle: null,
          attempts: 0,
          generationTime: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Format puzzles for storage
    const puzzleData = results
  .filter((result): result is GenerationResult & { puzzle: GeneratedPuzzle } => 
    result.puzzle !== null
  )
  .map((result) => ({
    date: result.puzzle.date,
    center_letter: result.puzzle.centerLetter,
    outer_letters: result.puzzle.outerLetters,
    valid_words: result.puzzle.validWords,
    pangrams: result.puzzle.pangrams,
    max_score: result.puzzle.maxScore,
    quality_score: Math.round(result.puzzle.qualityScore),
    word_count: result.puzzle.wordCount,         // Changed from wordCount to word_count
    word_length_distribution: result.puzzle.wordLengthDistribution,
    generator_version: result.puzzle.generatorVersion,
    stage: result.puzzle.stage                   // Added stage field
  }));


    if (puzzleData.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate any valid puzzles' },
        { status: 500 }
      );
    }

    // Store puzzles with the service role client to bypass RLS
    const { data, error } = await getSupabaseAdmin()
      .from('daily_puzzles')
      .upsert(puzzleData, {
        onConflict: 'date',
        ignoreDuplicates: false
      })
      .select();

    if (error) throw error;

    return NextResponse.json({
      generated: puzzleData.length,
      puzzles: data
    });
  } catch (error) {
    console.error('Puzzle generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate puzzles' },
      { status: 500 }
    );
  }
}