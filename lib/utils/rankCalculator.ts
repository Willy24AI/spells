// rankCalculator.ts
interface RankLevel {
    title: string;
    minScore: number;
    nextScore?: number;
  }
  
  export const rankLevels: RankLevel[] = [
    { title: 'Worker Bee', minScore: 0, nextScore: 15 },
    { title: 'Busy Bee', minScore: 15, nextScore: 35 },
    { title: 'Honey Maker', minScore: 35, nextScore: 60 },
    { title: 'Hive Scout', minScore: 60, nextScore: 100 },
    { title: 'Royal Guard', minScore: 100, nextScore: 150 },
    { title: 'Nectar Master', minScore: 150, nextScore: 200 },
    { title: 'Hive Elder', minScore: 200, nextScore: 275 },
    { title: 'Queen Bee', minScore: 275 }
  ];
  
  export function calculateRank(score: number): {
    currentRank: string;
    progress: number;
    nextRankScore: number | null;
    pointsToNextRank: number | null;
  } {
    // Find the current rank level
    const currentLevel = rankLevels.find(
      (level, index) =>
        score >= level.minScore &&
        (!rankLevels[index + 1] || score < rankLevels[index + 1].minScore)
    );
  
    if (!currentLevel) {
      return {
        currentRank: 'Worker Bee',
        progress: 0,
        nextRankScore: 15,
        pointsToNextRank: 15
      };
    }
  
    // Calculate progress to next rank
    let progress = 0;
    let nextRankScore = null;
    let pointsToNextRank = null;
  
    if (currentLevel.nextScore) {
      const rangeSize = currentLevel.nextScore - currentLevel.minScore;
      const progressInRange = score - currentLevel.minScore;
      progress = Math.min((progressInRange / rangeSize) * 100, 100);
      nextRankScore = currentLevel.nextScore;
      pointsToNextRank = currentLevel.nextScore - score;
    } else {
      // At maximum rank (Queen Bee)
      progress = 100;
    }
  
    return {
      currentRank: currentLevel.title,
      progress,
      nextRankScore,
      pointsToNextRank
    };
  }