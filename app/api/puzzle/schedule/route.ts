// app/api/puzzle/schedule/route.ts

import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { WordList } from '@/lib/dictionary/wordList';
import { PuzzleScheduler } from '@/lib/puzzleGenerator/scheduler';
import { PuzzleGenerator } from '@/lib/puzzleGenerator/generator';

export async function GET(req: Request) {
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

    // Get schedule status
    const { data: schedule, error } = await supabase
      .from('puzzle_schedule')
      .select(`
        scheduled_date,
        status,
        puzzle_id,
        daily_puzzles (
          quality_score,
          word_count,
          is_approved
        )
      `)
      .order('scheduled_date');

    if (error) throw error;

    return NextResponse.json(schedule);
  } catch (error) {
    console.error('Schedule query error:', error);
    return NextResponse.json(
      { error: 'Failed to query schedule' },
      { status: 500 }
    );
  }
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
    const { 
      action, 
      daysAhead = 7,
      minQualityScore = 80 
    } = body;

    if (action === 'generate') {
      // Initialize dependencies
      const wordList = new WordList();
      await wordList.initialize();
      const generator = new PuzzleGenerator(wordList);
      
      // Create scheduler
      const scheduler = new PuzzleScheduler(generator, {
        daysAhead,
        minQualityScore
      });

      // Run scheduling
      const results = await scheduler.schedulePuzzles();

      return NextResponse.json(results);
    } 
    else if (action === 'approve') {
      const { puzzleId } = body;
      if (!puzzleId) {
        return NextResponse.json(
          { error: 'Puzzle ID required' },
          { status: 400 }
        );
      }

      const { error } = await supabase
        .from('daily_puzzles')
        .update({
          is_approved: true,
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', puzzleId);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        puzzleId
      });
    }
    else if (action === 'reject') {
      const { puzzleId, reason } = body;
      if (!puzzleId) {
        return NextResponse.json(
          { error: 'Puzzle ID required' },
          { status: 400 }
        );
      }

      // Delete puzzle and update schedule
      const { error } = await supabase
        .from('daily_puzzles')
        .delete()
        .eq('id', puzzleId);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        puzzleId
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Scheduling error:', error);
    return NextResponse.json(
      { error: 'Failed to process scheduling action' },
      { status: 500 }
    );
  }
}