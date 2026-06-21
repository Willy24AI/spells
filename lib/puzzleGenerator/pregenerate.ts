// lib/puzzleGenerator/pregenerate.ts
//
// Shared pre-generation routine used by BOTH the CLI script
// (lib/scripts/pregeneratePuzzles.ts) and the Vercel cron route
// (app/api/cron/pregenerate/route.ts), so they can never drift apart.
//
// It tops up the daily_puzzles buffer: for each date in the window it generates
// a puzzle (seeded by date, so each day differs) unless one already exists.

import { WordList } from '@/lib/dictionary/wordList';
import { PuzzleGenerator } from '@/lib/puzzleGenerator/generator';
import { getSupabaseAdmin } from '@/lib/db/admin';
import { dateUtils } from '@/lib/utils/dateUtils';

export interface PregenerateOptions {
  days?: number;                  // how many days ahead to ensure (default 45)
  force?: boolean;                // regenerate even if a puzzle already exists
  log?: (message: string) => void; // optional logger (CLI uses console.log)
}

export interface PregenerateResult {
  created: number;
  failed: number;
  skipped: number;
  total: number;
}

export async function pregeneratePuzzles(
  options: PregenerateOptions = {}
): Promise<PregenerateResult> {
  const days = options.days ?? 45;
  const force = options.force ?? false;
  const log = options.log ?? (() => {});

  const admin = getSupabaseAdmin();

  log('Loading dictionary into memory...');
  const wordList = new WordList();
  await wordList.initialize();
  const generator = new PuzzleGenerator(wordList);

  // Build the target date window (today .. today + days-1)
  const dates: string[] = [];
  for (let i = 0; i < days; i++) {
    dates.push(dateUtils.getDayKey(new Date(Date.now() + i * 24 * 60 * 60 * 1000)));
  }

  // Skip dates that already have a puzzle (unless forcing a rebuild)
  let existing = new Set<string>();
  if (!force) {
    const { data } = await admin
      .from('daily_puzzles')
      .select('date')
      .in('date', dates);
    existing = new Set((data || []).map((r: { date: string }) => r.date));
  }

  let created = 0;
  let failed = 0;
  let skipped = 0;

  for (const date of dates) {
    if (!force && existing.has(date)) {
      skipped++;
      continue;
    }

    try {
      const p = await generator.generatePuzzle(date);

      const wordLengthDistribution = p.validWords.reduce(
        (acc: Record<number, number>, w: string) => {
          acc[w.length] = (acc[w.length] || 0) + 1;
          return acc;
        },
        {}
      );

      const { error } = await admin
        .from('daily_puzzles')
        .upsert(
          {
            date,
            center_letter: p.centerLetter,
            outer_letters: p.outerLetters,
            valid_words: p.validWords,
            pangrams: p.pangrams,
            max_score: p.maxScore,
            quality_score: Math.round(p.qualityScore),
            word_count: p.wordCount,
            average_word_length: p.averageWordLength,
            word_length_distribution: wordLengthDistribution,
            generator_version: p.generatorVersion,
            stage: p.stage || 0
          },
          { onConflict: 'date' }
        );

      if (error) throw error;

      created++;
      log(`✓ ${date}  ${p.centerLetter.toUpperCase()}|${p.outerLetters.join('').toUpperCase()}  ${p.wordCount} words, max ${p.maxScore}`);
    } catch (err) {
      failed++;
      log(`✗ ${date}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { created, failed, skipped, total: dates.length };
}
