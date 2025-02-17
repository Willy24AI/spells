import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/supabase';

interface CompletedRank {
  title: string;
  score: number;
  completed_at: string;
}

interface GameStats {
  score: number;
  words_found: number;
  created_at: string;
  completed_ranks?: CompletedRank[];
}

export async function GET(
  request: Request,
  { params }: { params: { date: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    // Get user session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get target date
    const targetDate = params.date;

    // Get user's game stats for the target date
    const { data: stats, error } = await supabase
      .from('game_stats')
      .select(`
        score,
        words_found,
        created_at,
        completed_ranks
      `)
      .eq('user_id', session.user.id)
      .eq('date', targetDate)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found is ok
      throw error;
    }

    // Calculate completed ranks based on score
    const rankLevels = [
      { title: 'Worker Bee', score: 0 },
      { title: 'Busy Bee', score: 15 },
      { title: 'Honey Maker', score: 35 },
      { title: 'Hive Scout', score: 60 },
      { title: 'Royal Guard', score: 100 },
      { title: 'Nectar Master', score: 150 },
      { title: 'Hive Elder', score: 200 },
      { title: 'Queen Bee', score: 275 }
    ] as const;

    const completedRanks: CompletedRank[] = stats?.score 
      ? rankLevels
          .filter(rank => (stats.score ?? 0) >= rank.score)
          .map(rank => ({
            title: rank.title,
            score: rank.score,
            completed_at: stats.created_at
          }))
      : [];

    return NextResponse.json({
      stats: stats as GameStats | null,
      completedRanks
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}