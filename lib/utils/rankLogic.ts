// lib/utils/rankLogic.ts

interface Rank {
    name: string;
    threshold: number;
  }
  
  export const ranks = [
    { name: 'Beginner', threshold: 0 },
    { name: 'Good Start', threshold: 20 },
    { name: 'Moving Up', threshold: 50 },
    { name: 'Good', threshold: 100 },
    { name: 'Solid', threshold: 200 },
    { name: 'Great', threshold: 400 },
    { name: 'Amazing', threshold: 800 },
    { name: 'Genius', threshold: 1600 }
  ] as const;
  
  export const rankLogic = {
    calculateRank: (score: number): {
      currentRank: string;
      nextRank: string;
      progress: number;
      pointsToNext: number;
    } => {
      // Find the highest rank where score meets or exceeds threshold
      let currentRankIndex = 0;
      
      for (let i = ranks.length - 1; i >= 0; i--) {
        if (score >= ranks[i].threshold) {
          currentRankIndex = i;
          break;
        }
      }
  
      const currentRank = ranks[currentRankIndex];
      const nextRank = ranks[Math.min(currentRankIndex + 1, ranks.length - 1)];
  
      // Calculate progress to next rank
      const currentThreshold = currentRank.threshold;
      const nextThreshold = nextRank.threshold;
      const progressPoints = score - currentThreshold;
      const pointsNeeded = nextThreshold - currentThreshold;
      
      // Calculate percentage progress (0-100)
      const progress = Math.min(
        100,
        Math.floor((progressPoints / (pointsNeeded || 1)) * 100)
      );
  
      return {
        currentRank: currentRank.name,
        nextRank: nextRank.name,
        progress,
        pointsToNext: Math.max(0, nextThreshold - score)
      };
    }
  };