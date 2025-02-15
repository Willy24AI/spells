// app/api/puzzle/generate/route.ts

import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { WordList } from '@/lib/dictionary/wordList';
import { PuzzleGenerator } from '@/lib/puzzleGenerator/generator';
import { dateUtils } from '@/lib/utils/dateUtils';

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
    const puzzles = await generator.generatePuzzles(count);

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
      word_count: puzzle.validWords.length,
      average_word_length: puzzle.validWords.reduce((sum, word) => 
        sum + word.length, 0) / puzzle.validWords.length,
      word_length_distribution: puzzle.validWords.reduce((acc, word) => {
        acc[word.length] = (acc[word.length] || 0) + 1;
        return acc;
      }, {} as Record<number, number>),
      generator_version: '1.0.0'
    }));

    const { data, error } = await supabase
      .from('daily_puzzles')
      .upsert(puzzleData, {
        onConflict: 'date',
        ignoreDuplicates: false
      })
      .select();

    if (error) throw error;

    return NextResponse.json({
      generated: puzzles.length,
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