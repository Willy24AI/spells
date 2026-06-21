import { NextResponse } from 'next/server';
import { pregeneratePuzzles } from '@/lib/puzzleGenerator/pregenerate';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Ensures upcoming daily puzzles exist. Pass an optional `days` (and `force`) in
 * the body; defaults to topping up the next 45 days, skipping dates that already
 * have a puzzle. Shares the exact same routine as the cron job and CLI script.
 */
export async function POST(req: Request) {
  try {
    let days = 45;
    let force = false;
    try {
      const body = await req.json();
      if (typeof body?.days === 'number') days = body.days;
      if (typeof body?.force === 'boolean') force = body.force;
    } catch {
      // No/empty body is fine — use the defaults.
    }

    const result = await pregeneratePuzzles({ days, force });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Error seeding puzzles:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to seed puzzles' },
      { status: 500 }
    );
  }
}
