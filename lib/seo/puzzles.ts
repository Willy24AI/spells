import { supabase } from '@/lib/db';
import { dateUtils } from '@/lib/utils/dateUtils';

export interface PuzzleRow {
  date: string;
  center_letter: string;
  outer_letters: string[];
  valid_words: string[];
  pangrams: string[];
  max_score: number;
  word_count: number;
}

/** YYYY-MM-DD format check used by the dated puzzle routes. */
export function isValidDateParam(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/**
 * Fetch a single day's puzzle. Never returns puzzles dated in the future, so we
 * can't accidentally leak tomorrow's answers via a guessed URL.
 */
export async function getPuzzleByDate(date: string): Promise<PuzzleRow | null> {
  if (!isValidDateParam(date)) return null;
  const today = dateUtils.getDayKey(new Date());
  if (date > today) return null;

  const { data } = await supabase
    .from('daily_puzzles')
    .select('date,center_letter,outer_letters,valid_words,pangrams,max_score,word_count')
    .eq('date', date)
    .maybeSingle();

  return (data as PuzzleRow) || null;
}

/** Recent puzzle dates (today and earlier), newest first — for the archive + sitemap. */
export async function getRecentPuzzleDates(limit = 90): Promise<string[]> {
  const today = dateUtils.getDayKey(new Date());
  const { data } = await supabase
    .from('daily_puzzles')
    .select('date')
    .lte('date', today)
    .order('date', { ascending: false })
    .limit(limit);

  return (data || []).map((r: { date: string }) => r.date);
}

/** Human-friendly date label, e.g. "Sunday, June 21, 2026". */
export function formatPuzzleDate(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
