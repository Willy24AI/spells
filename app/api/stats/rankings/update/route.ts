import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/types/supabase';

export async function POST(request: Request) {
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

    const { score, date } = await request.json();

    // Calculate completed ranks
    const ranks = [
      { title: 'Worker Bee', score: 0 },
      { title: 'Busy Bee', score: 15 },
      { title: 'Honey Maker', score: 35 },
      { title: 'Hive Scout', score: 60 },
      { title: 'Royal Guard', score: 100 },
      { title: 'Nectar Master', score: 150 },
      { title: 'Hive Elder', score: 200 },
      { title: 'Queen Bee', score: 275 }
    ];

    const completedRanks = ranks.filter(rank => score >= rank.score);

    // Update game stats with completed ranks
    const { error } = await supabase
      .from('game_stats')
      .update({
        completed_ranks: completedRanks.map(rank => ({
          title: rank.title,
          score: rank.score,
          completed_at: new Date().toISOString()
        }))
      })
      .eq('user_id', session.user.id)
      .eq('date', date);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      completedRanks
    });
  } catch (error) {
    console.error('Error updating rankings:', error);
    return NextResponse.json(
      { error: 'Failed to update rankings' },
      { status: 500 }
    );
  }
}