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

export class QualityMetrics {
  /**
   * Calculate comprehensive metrics for a puzzle
   */
  public calculateMetrics(
    words: string[],
    pangrams: string[]
  ): PuzzleMetrics {
    // Word count and distribution
    const wordLengthDistribution = words.reduce((acc, word) => {
      acc[word.length] = (acc[word.length] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const totalWordLengths = words.reduce((sum, word) => sum + word.length, 0);
    const averageWordLength = words.length > 0 ? totalWordLengths / words.length : 0;

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
  }

  /**
   * Calculate difficulty score based on various factors
   */
  private calculateDifficultyScore(
    words: string[],
    pangrams: string[],
    distribution: Record<number, number>
  ): number {
    if (words.length === 0) return 0;

    // More lenient difficulty scoring
    const averageLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    const longWordRatio = ((distribution[7] || 0) + (distribution[8] || 0)) / words.length;
    const pangramRatio = pangrams.length / words.length;

    // Adjusted scaling factors
    const lengthScore = Math.min(100, (averageLength - 3.5) * 25); // More gradual scaling
    const longWordScore = Math.min(100, longWordRatio * 150); // Increased weight for long words
    const pangramScore = Math.min(100, pangramRatio * 150); // Reduced pangram weight

    return (lengthScore * 0.4 + longWordScore * 0.3 + pangramScore * 0.3);
  }

  /**
   * Calculate overall quality score
   */
  private calculateQualityScore(metrics: Omit<PuzzleMetrics, 'qualityScore'>): number {
    // More lenient ranges:
    // - 15-40 total words (was 20-40)
    // - 1-4 pangrams (was 1-3)
    // - Average word length 4.5-6 letters (was 5-6)
    // - Moderate difficulty (35-65) (was 40-60)

    const wordCountScore = this.scoreRange(metrics.totalWords, 15, 40);
    const pangramScore = this.scoreRange(metrics.pangramCount, 1, 4);
    const avgLengthScore = this.scoreRange(metrics.averageWordLength, 4.5, 6);
    const difficultyScore = this.scoreRange(metrics.difficultyScore, 35, 65);
    const distributionScore = this.scoreWordDistribution(metrics.wordLengthDistribution);

    // Adjusted weights to emphasize word count and pangrams
    return (
      wordCountScore * 0.3 +
      pangramScore * 0.25 +
      avgLengthScore * 0.15 +
      difficultyScore * 0.15 +
      distributionScore * 0.15
    );
  }

  /**
   * Score a value based on ideal range with more gradual falloff
   */
  private scoreRange(
    value: number,
    idealMin: number,
    idealMax: number
  ): number {
    if (value >= idealMin && value <= idealMax) {
      return 100;
    }
    
    // More gradual score reduction
    const distance = value < idealMin 
      ? idealMin - value
      : value - idealMax;
    
    // Slower falloff (was distance * 10)
    return Math.max(0, 100 - (distance * 7));
  }

  /**
   * Score word length distribution with more lenient criteria
   */
  private scoreWordDistribution(
    distribution: Record<number, number>
  ): number {
    // More flexible ideal distribution
    const ideal = {
      4: 0.35,  // 35% 4-letter words (was 30%)
      5: 0.30,  // 30% 5-letter words
      6: 0.20,  // 20% 6-letter words
      7: 0.10,  // 10% 7-letter words (was 15%)
      8: 0.05   // 5% 8+ letter words
    };

    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    if (total === 0) return 0;

    // Calculate actual distribution percentages
    const actual = Object.entries(distribution).reduce((acc, [length, count]) => {
      acc[length] = count / total;
      return acc;
    }, {} as Record<string, number>);

    // More lenient scoring
    let score = 100;
    Object.entries(ideal).forEach(([length, idealPct]) => {
      const actualPct = actual[length] || 0;
      const difference = Math.abs(idealPct - actualPct);
      // Reduced penalty (was difference * 100)
      score -= difference * 70;
    });

    return Math.max(0, score);
  }
}