// app/api/puzzle/quality/route.ts

import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

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

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '30'; // days
    const type = searchParams.get('type') || 'all'; // 'all', 'approved', 'pending'

    // Get puzzle metrics
    const { data: metrics, error } = await supabase
      .from('puzzle_metrics')
      .select('*')
      .gte('date', new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000).toISOString())
      .order('date', { ascending: false });

    if (error) throw error;

    // Calculate aggregate metrics
    const aggregates = metrics?.reduce((acc, puzzle) => {
      acc.totalPuzzles++;
      acc.averageQualityScore += puzzle.quality_score;
      acc.averageWordCount += puzzle.word_count;
      acc.averageScore += puzzle.average_score || 0;
      
      if (puzzle.quality_score > acc.highestQualityScore) {
        acc.highestQualityScore = puzzle.quality_score;
        acc.bestPuzzleDate = puzzle.date;
      }

      // Aggregate word length distribution
      Object.entries(puzzle.word_length_distribution || {}).forEach(([length, count]) => {
        acc.wordLengthDistribution[length] = (acc.wordLengthDistribution[length] || 0) + count;
      });

      return acc;
    }, {
      totalPuzzles: 0,
      averageQualityScore: 0,
      averageWordCount: 0,
      averageScore: 0,
      highestQualityScore: 0,
      bestPuzzleDate: null,
      wordLengthDistribution: {}
    });

    if (aggregates.totalPuzzles > 0) {
      aggregates.averageQualityScore /= aggregates.totalPuzzles;
      aggregates.averageWordCount /= aggregates.totalPuzzles;
      aggregates.averageScore /= aggregates.totalPuzzles;
    }

    return NextResponse.json({
      metrics,
      aggregates
    });
  } catch (error) {
    console.error('Metrics query error:', error);
    return NextResponse.json(
      { error: 'Failed to query metrics' },
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
    const { puzzleId } = body;

    if (!puzzleId) {
      return NextResponse.json(
        { error: 'Puzzle ID required' },
        { status: 400 }
      );
    }

    // Get puzzle data
    const { data: puzzle, error: puzzleError } = await supabase
      .from('daily_puzzles')
      .select('*')
      .eq('id', puzzleId)
      .single();

    if (puzzleError) throw puzzleError;

    // Recalculate metrics
    const { data: stats, error: statsError } = await supabase
      .from('game_stats')
      .select('score')
      .eq('date', puzzle.date);

    if (statsError) throw statsError;

    const metrics = {
      times_played: stats?.length || 0,
      average_score: stats?.reduce((sum, stat) => sum + stat.score, 0) / (stats?.length || 1) || 0,
      highest_score: Math.max(...(stats?.map(stat => stat.score) || [0]))
    };

    // Update metrics
    const { error: updateError } = await supabase
      .from('puzzle_metrics')
      .upsert({
        ...puzzle,
        ...metrics
      });

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      metrics
    });
  } catch (error) {
    console.error('Metrics update error:', error);
    return NextResponse.json(
      { error: 'Failed to update metrics' },
      { status: 500 }
    );
  }
}