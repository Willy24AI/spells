import { NextResponse } from 'next/server';
import { queries } from '@/lib/db/queries';
import { dateUtils } from '@/lib/utils/dateUtils';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || dateUtils.getDayKey(new Date());

    const stats = await queries.getLeaderboard(date);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}