// app/api/stats/rankings/update/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
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

    const { score, date, completedRanks } = await request.json();

    console.log('Received update request:', {
      userId: session.user.id,
      date,
      score,
      completedRanks
    });

    // Update game stats with completed ranks - removed updated_at field
    const { data, error } = await supabase
      .from('game_stats')
      .upsert({
        user_id: session.user.id,
        date: date,
        score: score,
        completed_ranks: completedRanks
      }, {
        onConflict: 'user_id,date'
      });

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    console.log('Successfully updated ranks:', data);

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error updating rankings:', error);
    return NextResponse.json(
      { error: 'Failed to update rankings' },
      { status: 500 }
    );
  }
}