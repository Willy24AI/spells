import { NextResponse } from 'next/server';
import { pregeneratePuzzles } from '@/lib/puzzleGenerator/pregenerate';

// Always run fresh (never cached) and allow enough time to load the dictionary.
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Cron endpoint that tops up the daily puzzle buffer.
 *
 * Vercel Cron sends a GET request with an `Authorization: Bearer <CRON_SECRET>`
 * header when the CRON_SECRET environment variable is configured on the project.
 * We reject anything without the matching secret so the endpoint can't be
 * triggered by the public.
 */
export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const auth = req.headers.get('authorization');
    if (auth !== `Bearer ${expected}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const result = await pregeneratePuzzles({ days: 45 });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('Cron pre-generation failed:', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Pre-generation failed' },
      { status: 500 }
    );
  }
}
