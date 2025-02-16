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
    // Calculate word length distribution
    const wordLengthDistribution = this.calculateWordDistribution(words);
    
    // Calculate various metrics
    const totalWords = words.length;
    const maxScore = this.calculateMaxScore(words, pangrams);
    const averageWordLength = this.calculateAverageLength(words);
    const difficultyScore = this.calculateDifficultyScore(
      words,
      pangrams,
      wordLengthDistribution
    );

    // Calculate overall quality score
    const qualityScore = this.calculateQualityScore({
      totalWords,
      maxScore,
      pangramCount: pangrams.length,
      averageWordLength,
      wordLengthDistribution,
      difficultyScore
    });

    return {
      totalWords,
      maxScore,
      pangramCount: pangrams.length,
      averageWordLength,
      wordLengthDistribution,
      difficultyScore,
      qualityScore
    };
  }

  /**
   * Calculate word length distribution
   */
  private calculateWordDistribution(words: string[]): Record<number, number> {
    return words.reduce((acc, word) => {
      acc[word.length] = (acc[word.length] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
  }

  /**
   * Calculate average word length
   */
  private calculateAverageLength(words: string[]): number {
    return words.reduce((sum, word) => sum + word.length, 0) / words.length;
  }

  /**
   * Calculate max possible score
   */
  private calculateMaxScore(words: string[], pangrams: string[]): number {
    return words.reduce((sum, word) => {
      const baseScore = word.length === 4 ? 1 : word.length;
      const pangramBonus = pangrams.includes(word) ? 7 : 0;
      return sum + baseScore + pangramBonus;
    }, 0);
  }

  /**
   * Calculate difficulty score
   */
  private calculateDifficultyScore(
    words: string[],
    pangrams: string[],
    distribution: Record<number, number>
  ): number {
    if (words.length === 0) return 0;

    // Calculate various factors
    const averageLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    const longWordRatio = ((distribution[7] || 0) + (distribution[8] || 0)) / words.length;
    const pangramRatio = pangrams.length / words.length;

    // Score components with adjusted weights
    const lengthScore = Math.min(100, (averageLength - 4) * 20);
    const longWordScore = Math.min(100, longWordRatio * 200);
    const pangramScore = Math.min(100, pangramRatio * 150);

    // Weight the components
    return (lengthScore * 0.4 + longWordScore * 0.3 + pangramScore * 0.3);
  }

  /**
   * Calculate overall quality score
   */
  private calculateQualityScore(metrics: Omit<PuzzleMetrics, 'qualityScore'>): number {
    // Score components
    const wordCountScore = this.scoreWordCount(metrics.totalWords);
    const distributionScore = this.scoreDistribution(metrics.wordLengthDistribution);
    const difficultyScore = this.scoreDifficulty(metrics.difficultyScore);
    const pangramScore = this.scorePangrams(metrics.pangramCount);
    const lengthScore = this.scoreAverageLength(metrics.averageWordLength);

    // Calculate weighted average with adjusted weights
    return (
      wordCountScore * 0.35 +    // Emphasize word count
      distributionScore * 0.25 +  // Important for playability
      difficultyScore * 0.20 +    // Balance difficulty
      pangramScore * 0.15 +       // Value pangrams but don't overemphasize
      lengthScore * 0.05          // Less emphasis on average length
    );
  }

  /**
   * Score word count (prefer 60-100 words)
   */
  private scoreWordCount(count: number): number {
    if (count < 60) return Math.max(0, (count / 60) * 100);
    if (count <= 100) return 100;
    return Math.max(0, 100 - ((count - 100) / 2));
  }

  /**
   * Score word length distribution
   */
  private scoreDistribution(distribution: Record<number, number>): number {
    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    
    // Ideal distribution
    const ideal = {
      4: 0.30,  // 30% 4-letter words
      5: 0.25,  // 25% 5-letter words
      6: 0.20,  // 20% 6-letter words
      7: 0.15,  // 15% 7-letter words
      8: 0.10   // 10% 8+ letter words
    };

    // Calculate deviation from ideal
    let score = 100;
    Object.entries(ideal).forEach(([length, targetPct]) => {
      const actualPct = (distribution[Number(length)] || 0) / total;
      const difference = Math.abs(targetPct - actualPct);
      score -= difference * 100;
    });

    return Math.max(0, score);
  }

  /**
   * Score difficulty (prefer moderate difficulty)
   */
  private scoreDifficulty(difficultyScore: number): number {
    // Target moderate difficulty (40-60 range)
    if (difficultyScore >= 40 && difficultyScore <= 60) return 100;
    const deviation = difficultyScore < 40 ? 
      40 - difficultyScore : 
      difficultyScore - 60;
    return Math.max(0, 100 - (deviation * 2));
  }

  /**
   * Score pangram count (prefer 1-3 pangrams)
   */
  private scorePangrams(count: number): number {
    if (count === 0) return 0;
    if (count >= 1 && count <= 3) return 100;
    return Math.max(0, 100 - ((count - 3) * 20));
  }

  /**
   * Score average word length (prefer 5-6 letters)
   */
  private scoreAverageLength(averageLength: number): number {
    const idealLength = 5.5;
    const difference = Math.abs(averageLength - idealLength);
    return Math.max(0, 100 - (difference * 30));
  }
}