import { NextResponse } from 'next/server';
import { queries } from '@/lib/db/queries';
import { dateUtils } from '@/lib/utils/dateUtils';

export async function GET() {
  try {
    const today = dateUtils.getDayKey(new Date());
    console.log('Fetching puzzle for date:', today); // Debug log

    const puzzle = await queries.getDailyPuzzle(today);
    console.log('Puzzle data:', puzzle); // Debug log

    return NextResponse.json(puzzle);
  } catch (error) {
    console.error('Error fetching puzzle:', error);
    return NextResponse.json(
      { error: 'Failed to fetch puzzle' },
      { status: 500 }
    );
  }
}