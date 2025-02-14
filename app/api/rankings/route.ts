import { NextResponse } from 'next/server';
import { queries } from '@/lib/db/queries';
import { dateUtils } from '@/lib/utils/dateUtils';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || dateUtils.getDayKey(new Date());

    const rankings = await queries.getLeaderboard(date);
    
    // Transform data to include rank numbers
    const rankedData = rankings.map((item, index) => ({
      rank: index + 1,
      score: item.score
    }));

    return NextResponse.json(rankedData);
  } catch (error) {
    console.error('Error fetching rankings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rankings' },
      { status: 500 }
    );
  }
}