// app/api/puzzle/quality/route.ts

import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { PuzzleMetrics } from '@/lib/types/puzzleGenerator';

interface ExtendedPuzzleMetrics extends PuzzleMetrics {
  times_played: number;
  average_score: number;
  highest_score: number;
  completion_rate: number;
  difficulty_rating: number;
  player_ratings: number[];
}

interface QualityAggregates {
  totalPuzzles: number;
  averageQualityScore: number;
  averageWordCount: number;
  averageScore: number;
  highestQualityScore: number;
  bestPuzzleDate: string | null;
  wordLengthDistribution: Record<number, number>;
  averageCompletionRate: number;
  difficultyDistribution: Record<string, number>;
  commonWordPercentage: number;
  wordFamilyStats: {
    average: number;
    max: number;
    min: number;
  };
  stageDistribution: Record<number, number>;
}

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
    const difficulty = searchParams.get('difficulty'); // optional filter by difficulty

    // Build query
    let query = supabase
      .from('puzzle_metrics')
      .select('*')
      .gte('date', new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000).toISOString())
      .order('date', { ascending: false });

    if (type === 'approved') {
      query = query.eq('status', 'approved');
    } else if (type === 'pending') {
      query = query.eq('status', 'pending');
    }

    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    const { data: metrics, error } = await query;

    if (error) throw error;

    // Calculate aggregate metrics
    const aggregates: QualityAggregates = metrics?.reduce((acc, puzzle) => {
      acc.totalPuzzles++;
      acc.averageQualityScore += puzzle.quality_score;
      acc.averageWordCount += puzzle.word_count;
      acc.averageScore += puzzle.average_score || 0;
      acc.averageCompletionRate += puzzle.completion_rate || 0;
      
      // Track difficulty distribution
      acc.difficultyDistribution[puzzle.difficulty] = 
        (acc.difficultyDistribution[puzzle.difficulty] || 0) + 1;

      // Track stage distribution
      acc.stageDistribution[puzzle.stage] = 
        (acc.stageDistribution[puzzle.stage] || 0) + 1;

      if (puzzle.quality_score > acc.highestQualityScore) {
        acc.highestQualityScore = puzzle.quality_score;
        acc.bestPuzzleDate = puzzle.date;
      }

      // Aggregate word length distribution
      Object.entries(puzzle.word_length_distribution || {}).forEach(([length, count]) => {
        acc.wordLengthDistribution[length] = (acc.wordLengthDistribution[length] || 0) + count;
      });

      // Track word family stats
      const familyCount = puzzle.metrics?.wordFamilyCount || 0;
      acc.wordFamilyStats.average += familyCount;
      acc.wordFamilyStats.max = Math.max(acc.wordFamilyStats.max, familyCount);
      acc.wordFamilyStats.min = Math.min(acc.wordFamilyStats.min, familyCount);

      // Track common word percentage
      acc.commonWordPercentage += puzzle.metrics?.commonWordPercentage || 0;

      return acc;
    }, {
      totalPuzzles: 0,
      averageQualityScore: 0,
      averageWordCount: 0,
      averageScore: 0,
      averageCompletionRate: 0,
      highestQualityScore: 0,
      bestPuzzleDate: null,
      wordLengthDistribution: {},
      difficultyDistribution: {},
      stageDistribution: {},
      commonWordPercentage: 0,
      wordFamilyStats: {
        average: 0,
        max: 0,
        min: Infinity
      }
    });

    // Normalize averages
    if (aggregates.totalPuzzles > 0) {
      aggregates.averageQualityScore /= aggregates.totalPuzzles;
      aggregates.averageWordCount /= aggregates.totalPuzzles;
      aggregates.averageScore /= aggregates.totalPuzzles;
      aggregates.averageCompletionRate /= aggregates.totalPuzzles;
      aggregates.commonWordPercentage /= aggregates.totalPuzzles;
      aggregates.wordFamilyStats.average /= aggregates.totalPuzzles;
    }

    return NextResponse.json({
      metrics,
      aggregates
    });
  } catch (error) {
    console.error('Metrics query error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to query metrics',
        details: error instanceof Error ? error.message : String(error)
      },
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
    const { puzzleId, feedback } = body;

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

    // Get game stats
    const { data: stats, error: statsError } = await supabase
      .from('game_stats')
      .select('score, completed, time_spent, rating')
      .eq('puzzle_id', puzzleId);

    if (statsError) throw statsError;

    // Calculate enhanced metrics
    const metrics: Partial<ExtendedPuzzleMetrics> = {
      times_played: stats?.length || 0,
      average_score: stats?.reduce((sum, stat) => sum + stat.score, 0) / (stats?.length || 1) || 0,
      highest_score: Math.max(...(stats?.map(stat => stat.score) || [0])),
      completion_rate: stats
        ? (stats.filter(stat => stat.completed).length / stats.length) * 100
        : 0,
      difficulty_rating: stats?.reduce((sum, stat) => sum + (stat.rating || 0), 0) / 
        (stats?.filter(stat => stat.rating != null).length || 1),
      player_ratings: stats?.map(stat => stat.rating).filter(rating => rating != null) || []
    };

    // Update metrics
    const { error: updateError } = await supabase
      .from('puzzle_metrics')
      .upsert({
        puzzle_id: puzzleId,
        date: puzzle.date,
        metrics: {
          ...puzzle.metrics,
          ...metrics
        },
        feedback: feedback || puzzle.feedback || [],
        last_updated: new Date().toISOString()
      });

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      metrics
    });
  } catch (error) {
    console.error('Metrics update error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update metrics',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}