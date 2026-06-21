// lib/utils/rankSystem.ts
//
// Single source of truth for the rank/points system.
//
// Ranks are defined as PERCENTAGES of the current puzzle's maximum score, the
// same way the NYT Spelling Bee works. This keeps things fair: an easy day (low
// max score) and a hard day (high max score) both require proportional effort to
// reach the top rank, and every threshold is always relative to the puzzle of
// the day rather than a fixed number.

export interface RankTier {
  title: string;
  pct: number; // fraction of maxScore required (0..1)
  icon: string;
}

export interface RankLevel extends RankTier {
  score: number; // absolute points required for THIS puzzle
}

export const RANK_TIERS: RankTier[] = [
  { title: 'Worker Bee',    pct: 0.0,  icon: '🐝' },
  { title: 'Busy Bee',      pct: 0.05, icon: '🐝' },
  { title: 'Honey Maker',   pct: 0.10, icon: '🐝' },
  { title: 'Hive Scout',    pct: 0.20, icon: '🐝' },
  { title: 'Royal Guard',   pct: 0.30, icon: '🐝' },
  { title: 'Nectar Master', pct: 0.45, icon: '🌺' },
  { title: 'Hive Elder',    pct: 0.70, icon: '⭐' },
  { title: 'Queen Bee',     pct: 1.0,  icon: '👑' }
];

/**
 * Resolve the rank tiers into absolute point thresholds for a given puzzle.
 * Thresholds are made strictly increasing so progress logic never divides by 0.
 */
export function getRankLevels(maxScore: number): RankLevel[] {
  let previous = -1;
  return RANK_TIERS.map((tier) => {
    let score = Math.round(maxScore * tier.pct);
    if (score <= previous) score = previous + 1;
    previous = score;
    return { ...tier, score };
  });
}

export interface RankInfo {
  currentRank: string;
  nextRank: string | null;
  currentIndex: number;
  progress: number;          // 0..100 toward the next rank
  pointsToNext: number;      // points still needed for the next rank (0 at top)
  completedRanks: string[];  // every rank reached so far (inclusive)
  levels: RankLevel[];
}

/** Compute the player's standing for a score against a puzzle's max score. */
export function getRankInfo(score: number, maxScore: number): RankInfo {
  const levels = getRankLevels(maxScore);

  let currentIndex = 0;
  for (let i = levels.length - 1; i >= 0; i--) {
    if (score >= levels[i].score) {
      currentIndex = i;
      break;
    }
  }

  const current = levels[currentIndex];
  const next = levels[currentIndex + 1] ?? null;

  let progress = 100;
  let pointsToNext = 0;
  if (next) {
    const range = next.score - current.score;
    progress = Math.min(100, Math.max(0, ((score - current.score) / range) * 100));
    pointsToNext = Math.max(0, next.score - score);
  }

  return {
    currentRank: current.title,
    nextRank: next ? next.title : null,
    currentIndex,
    progress,
    pointsToNext,
    completedRanks: levels.slice(0, currentIndex + 1).map((l) => l.title),
    levels
  };
}
