// lib/scripts/pregeneratePuzzles.ts
//
// CLI wrapper around the shared pre-generation routine. Ensures the app never
// has to generate puzzles on-demand (instant loads).
//
// Usage:
//   npm run pregenerate            -> next 45 days (skips dates that already exist)
//   npm run pregenerate -- 60      -> next 60 days
//   npm run pregenerate -- 60 force -> regenerate even if a puzzle already exists
//
// "force" is what you want after (re)seeding the dictionary, so each puzzle's
// valid_words is rebuilt against the complete word list.

// Load .env BEFORE any module that reads environment variables at import time.
import 'dotenv/config';

import { pregeneratePuzzles } from '@/lib/puzzleGenerator/pregenerate';

async function main() {
  const days = parseInt(process.argv[2] || '45', 10);
  const force = (process.argv[3] || '').toLowerCase() === 'force';

  const result = await pregeneratePuzzles({
    days,
    force,
    log: (m) => console.log(m)
  });

  console.log(
    `\nDone. Generated ${result.created} puzzle(s)${force ? ' (forced)' : ''}, ` +
    `${result.failed} failed, ${result.skipped} skipped (already existed).`
  );
}

main().catch((err) => {
  console.error('Pre-generation failed:', err);
  process.exit(1);
});
