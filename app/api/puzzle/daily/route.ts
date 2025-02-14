import { NextResponse } from 'next/server';
import { dateUtils } from '@/lib/utils/dateUtils';

export async function GET() {
  try {
    // Generate a deterministic puzzle based on the date
    const today = new Date();
    const seed = dateUtils.getDayKey(today);
    
    // This is a simplified example - in production, you'd want to:
    // 1. Generate puzzles ahead of time
    // 2. Store them in the database
    // 3. Have a proper word list
    const puzzle = {
      centerLetter: 'E',
      outerLetters: ['B', 'C', 'D', 'N', 'O', 'U'],
      validWords: ['BOUNCE', 'BOUND', 'CODE', 'CONE', 'CUBE', 'DANCE', 'DONE', 'DUNCE', 'ONCE', 'OUNCE'],
      pangrams: ['BOUNCE'],
      date: seed
    };

    return NextResponse.json(puzzle);
  } catch (error) {
    console.error('Error generating daily puzzle:', error);
    return NextResponse.json(
      { error: 'Failed to generate daily puzzle' },
      { status: 500 }
    );
  }
}