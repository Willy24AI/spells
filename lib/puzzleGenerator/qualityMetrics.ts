// lib/puzzleGenerator/qualityMetrics.ts

interface PuzzleMetrics {
    totalWords: number;
    maxScore: number;
    pangramCount: number;
    averageWordLength: number;
    wordLengthDistribution: Record<number, number>;
    difficultyScore: number;
    qualityScore: number;
  }
  
  export const qualityMetrics = {
    /**
     * Calculate comprehensive metrics for a puzzle
     */
    calculateMetrics(
      words: string[],
      pangrams: string[]
    ): PuzzleMetrics {
      // Word count and distribution
      const wordLengthDistribution = words.reduce((acc, word) => {
        acc[word.length] = (acc[word.length] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);
  
      const totalWordLengths = words.reduce((sum, word) => sum + word.length, 0);
      const averageWordLength = totalWordLengths / words.length;
  
      // Calculate max possible score
      const maxScore = words.reduce((sum, word) => {
        const baseScore = word.length === 4 ? 1 : word.length;
        const pangramBonus = pangrams.includes(word) ? 7 : 0;
        return sum + baseScore + pangramBonus;
      }, 0);
  
      // Calculate difficulty score
      const difficultyScore = this.calculateDifficultyScore(
        words,
        pangrams,
        wordLengthDistribution
      );
  
      // Calculate overall quality score
      const qualityScore = this.calculateQualityScore({
        totalWords: words.length,
        maxScore,
        pangramCount: pangrams.length,
        averageWordLength,
        wordLengthDistribution,
        difficultyScore
      });
  
      return {
        totalWords: words.length,
        maxScore,
        pangramCount: pangrams.length,
        averageWordLength,
        wordLengthDistribution,
        difficultyScore,
        qualityScore
      };
    },
  
    /**
     * Calculate difficulty score based on various factors
     */
    private calculateDifficultyScore(
      words: string[],
      pangrams: string[],
      distribution: Record<number, number>
    ): number {
      // Factors that increase difficulty:
      // - Higher average word length
      // - More pangrams
      // - More longer words
      // - Fewer common word patterns
      
      const averageLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
      const longWordRatio = (distribution[7] || 0) / words.length;
      const pangramRatio = pangrams.length / words.length;
  
      // Scale each factor to roughly 0-100
      const lengthScore = (averageLength - 4) * 20; // 4-9 letters -> 0-100
      const longWordScore = longWordRatio * 100;
      const pangramScore = pangramRatio * 200; // More weight on pangrams
  
      return (lengthScore + longWordScore + pangramScore) / 3;
    },
  
    /**
     * Calculate overall quality score
     */
    private calculateQualityScore(metrics: Omit<PuzzleMetrics, 'qualityScore'>): number {
      // Ideal ranges for a good puzzle:
      // - 20-40 total words
      // - 1-3 pangrams
      // - Average word length 5-6 letters
      // - Good distribution of word lengths
      // - Moderate difficulty (40-60)
  
      const wordCountScore = this.scoreRange(metrics.totalWords, 20, 40);
      const pangramScore = this.scoreRange(metrics.pangramCount, 1, 3);
      const avgLengthScore = this.scoreRange(metrics.averageWordLength, 5, 6);
      const difficultyScore = this.scoreRange(metrics.difficultyScore, 40, 60);
      const distributionScore = this.scoreWordDistribution(metrics.wordLengthDistribution);
  
      // Weighted average of scores
      return (
        wordCountScore * 0.25 +
        pangramScore * 0.2 +
        avgLengthScore * 0.2 +
        difficultyScore * 0.2 +
        distributionScore * 0.15
      );
    },
  
    /**
     * Score a value based on ideal range
     */
    private scoreRange(
      value: number,
      idealMin: number,
      idealMax: number
    ): number {
      if (value >= idealMin && value <= idealMax) {
        return 100; // Perfect score
      }
      
      // Calculate how far outside the range
      const distance = value < idealMin 
        ? idealMin - value
        : value - idealMax;
      
      // Score decreases with distance from ideal range
      return Math.max(0, 100 - (distance * 10));
    },
  
    /**
     * Score word length distribution
     */
    private scoreWordDistribution(
      distribution: Record<number, number>
    ): number {
      // Ideal distribution (approximate percentages):
      const ideal = {
        4: 0.3,  // 30% 4-letter words
        5: 0.3,  // 30% 5-letter words
        6: 0.2,  // 20% 6-letter words
        7: 0.15, // 15% 7-letter words
        8: 0.05  // 5% 8+ letter words
      };
  
      const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  
      // Calculate actual distribution percentages
      const actual = Object.entries(distribution).reduce((acc, [length, count]) => {
        acc[length] = count / total;
        return acc;
      }, {} as Record<string, number>);
  
      // Compare to ideal distribution
      let score = 100;
      Object.entries(ideal).forEach(([length, idealPct]) => {
        const actualPct = actual[length] || 0;
        const difference = Math.abs(idealPct - actualPct);
        // Deduct points based on how far from ideal
        score -= difference * 100;
      });
  
      return Math.max(0, score);
    }
  };