import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { WordList } from '@/lib/dictionary/wordList';
import { PuzzleGenerator } from '@/lib/puzzleGenerator/generator';
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
        word_length_distribution: result.puzzle.wordLengthDistribution,
        generator_version: result.puzzle.generatorVersion
    }));

    if (puzzleData.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate any valid puzzles' },
        { status: 500 }
      );
    }

    // Store puzzles
    const { data, error } = await supabase
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
    const { data: puzzle } = await supabase
      .from('daily_puzzles')
      .select('*')
      .eq('date', date)
      .single();

    if (!puzzle) {
      // Generate new puzzle for the date
      const wordList = new WordList();
      await wordList.initialize();
      const generator = new PuzzleGenerator(wordList);
      
      try {
        const newPuzzle = await generator.generatePuzzle(date);
        
        const { data: savedPuzzle, error: saveError } = await supabase
          .from('daily_puzzles')
          .upsert({
            date: newPuzzle.date,
            center_letter: newPuzzle.centerLetter,
            outer_letters: newPuzzle.outerLetters,
            valid_words: newPuzzle.validWords,
            pangrams: newPuzzle.pangrams,
            max_score: newPuzzle.maxScore,
            quality_score: newPuzzle.qualityScore,
            word_count: newPuzzle.wordCount,
            word_length_distribution: newPuzzle.wordLengthDistribution,
            generator_version: newPuzzle.generatorVersion
          }, {
            onConflict: 'date'
          })
          .select()
          .single();

        if (saveError) throw saveError;
        return NextResponse.json(savedPuzzle);
      } catch (error) {
        console.error('Error generating new puzzle:', error);
        return NextResponse.json(
          { error: 'Failed to generate puzzle' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(puzzle);
  } catch (error) {
    console.error('Error fetching puzzle:', error);
    return NextResponse.json(
      { error: 'Failed to fetch puzzle' },
      { status: 500 }
    );
  }
}