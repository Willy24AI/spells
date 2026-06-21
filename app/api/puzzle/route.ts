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
    
    // Check authentication (simplified)
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { date, count = 1 } = body;

    if (!date) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      );
    }

    // Initialize word list and generator
    const wordList = new WordList();
    await wordList.initialize();
    const generator = new PuzzleGenerator(wordList);

    // Generate puzzles
    const results: GenerationResult[] = [];
    for (let i = 0; i < count; i++) {
      try {
        const targetDate = dateUtils.getDayKey(
          new Date(Date.now() + i * 24 * 60 * 60 * 1000)
        );
        const result = await generator.generatePuzzle(targetDate);
        results.push({
          puzzle: result,
          attempts: 1,
          generationTime: 0
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
        quality_score: result.puzzle.qualityScore,
        word_count: result.puzzle.wordCount,
        average_word_length: result.puzzle.averageWordLength,
        word_length_distribution: result.puzzle.wordLengthDistribution,
        generator_version: result.puzzle.generatorVersion,
        stage: result.puzzle.stage || 0,
        created_by: session.user.id
    }));

    if (puzzleData.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate any valid puzzles' },
        { status: 500 }
      );
    }

    // Store puzzles with service role client to bypass RLS
    const { data, error } = await getSupabaseAdmin()
      .from('daily_puzzles')
      .upsert(puzzleData, {
        onConflict: 'date',
        ignoreDuplicates: false
      })
      .select();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });
    
    // First try to get existing puzzle
    const { data: puzzle, error: fetchError } = await supabase
      .from('daily_puzzles')
      .select('*')
      .eq('date', date)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // Not found error
      throw fetchError;
    }

    if (puzzle) {
      return NextResponse.json(puzzle);
    }

    // If no puzzle exists, generate a new one
    const wordList = new WordList();
    await wordList.initialize();
    const generator = new PuzzleGenerator(wordList);
    
    try {
      const newPuzzle = await generator.generatePuzzle(date);
      
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      const puzzleData = {
        date: newPuzzle.date,
        center_letter: newPuzzle.centerLetter,
        outer_letters: newPuzzle.outerLetters,
        valid_words: newPuzzle.validWords,
        pangrams: newPuzzle.pangrams,
        max_score: newPuzzle.maxScore,
        quality_score: newPuzzle.qualityScore,
        word_count: newPuzzle.wordCount,
        average_word_length: newPuzzle.averageWordLength,
        word_length_distribution: newPuzzle.wordLengthDistribution,
        generator_version: newPuzzle.generatorVersion,
        stage: newPuzzle.stage || 0,
        created_by: session?.user?.id
      };

      const { data: savedPuzzle, error: saveError } = await getSupabaseAdmin()
        .from('daily_puzzles')
        .upsert(puzzleData, {
          onConflict: 'date'
        })
        .select()
        .single();

      if (saveError) {
        console.error('Error saving puzzle:', saveError);
        throw saveError;
      }

      return NextResponse.json(savedPuzzle);
    } catch (error) {
      console.error('Error generating new puzzle:', error);
      return NextResponse.json(
        { error: 'Failed to generate puzzle' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching puzzle:', error);
    return NextResponse.json(
      { error: 'Failed to fetch puzzle' },
      { status: 500 }
    );
  }
}