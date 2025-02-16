// lib/puzzleGenerator/qualityMetrics.ts

interface PuzzleMetrics {
  totalWords: number;
  maxScore: number;
  pangramCount: number;
  averageWordLength: number;
  wordLengthDistribution: Record<number, number>;
  commonWordPercentage: number;
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
    // Basic statistics
    const wordLengthDistribution = words.reduce((acc, word) => {
      acc[word.length] = (acc[word.length] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const totalWords = words.length;
    const totalWordLengths = words.reduce((sum, word) => sum + word.length, 0);
    const averageWordLength = totalWords > 0 ? totalWordLengths / totalWords : 0;

    // Calculate max possible score
    const maxScore = words.reduce((sum, word) => {
      const baseScore = word.length === 4 ? 1 : word.length;
      const pangramBonus = pangrams.includes(word) ? 7 : 0;
      return sum + baseScore + pangramBonus;
    }, 0);

    // Calculate common word percentage (4-5 letter words)
    const commonWords = (wordLengthDistribution[4] || 0) + (wordLengthDistribution[5] || 0);
    const commonWordPercentage = (commonWords / totalWords) * 100;

    // Calculate difficulty score with adjusted criteria
    const difficultyScore = this.calculateDifficultyScore(
      words,
      pangrams,
      wordLengthDistribution
    );

    // Calculate overall quality score with adjusted weights
    const qualityScore = this.calculateQualityScore({
      totalWords,
      maxScore,
      pangramCount: pangrams.length,
      averageWordLength,
      wordLengthDistribution,
      commonWordPercentage,
      difficultyScore
    });

    return {
      totalWords,
      maxScore,
      pangramCount: pangrams.length,
      averageWordLength,
      wordLengthDistribution,
      commonWordPercentage,
      difficultyScore,
      qualityScore
    };
  }

  private calculateDifficultyScore(
    words: string[],
    pangrams: string[],
    distribution: Record<number, number>
  ): number {
    if (words.length === 0) return 0;

    const total = words.length;
    
    // Calculate ratios with more emphasis on accessibility
    const fourLetterRatio = (distribution[4] || 0) / total;
    const fiveLetterRatio = (distribution[5] || 0) / total;
    const shortWordRatio = fourLetterRatio + fiveLetterRatio;
    const longWordRatio = Object.entries(distribution)
      .filter(([length]) => parseInt(length) >= 7)
      .reduce((sum, [_, count]) => sum + count, 0) / total;
    const pangramRatio = pangrams.length / total;

    // Score components (0-100 each)
    const shortWordScore = shortWordRatio * 100;
    const longWordScore = longWordRatio * 50; // Less weight on long words
    const pangramScore = Math.min(pangramRatio * 150, 100); // Cap pangram score
    const balanceScore = (1 - Math.abs(0.6 - shortWordRatio)) * 100; // Ideal ratio around 60% short words

    // Combined score (0-100)
    const weightedScore = 
      (shortWordScore * 0.4) +   // 40% weight on short words
      (longWordScore * 0.2) +    // 20% weight on long words
      (pangramScore * 0.2) +     // 20% weight on pangrams
      (balanceScore * 0.2);      // 20% weight on overall balance

    return Math.min(Math.max(weightedScore, 0), 100);
  }

  private calculateQualityScore(metrics: Omit<PuzzleMetrics, 'qualityScore'>): number {
    // Scoring criteria weights adjusted for more accessible puzzles
    const weights = {
      wordCount: 0.35,      // Increased emphasis on total words
      commonWords: 0.30,    // More weight on common words
      distribution: 0.20,   // Maintained distribution importance
      difficulty: 0.10,     // Reduced difficulty weight
      pangrams: 0.05        // Reduced pangram importance
    };

    // Score components (0-100 each)
    const wordCountScore = this.scoreRange(metrics.totalWords, 30, 70);
    const commonWordScore = this.scoreRange(metrics.commonWordPercentage, 50, 70);
    const distributionScore = this.scoreWordDistribution(metrics.wordLengthDistribution);
    const difficultyScore = metrics.difficultyScore;
    const pangramScore = this.scoreRange(metrics.pangramCount, 1, 3);

    // Calculate weighted total
    return (
      (wordCountScore * weights.wordCount) +
      (commonWordScore * weights.commonWords) +
      (distributionScore * weights.distribution) +
      (difficultyScore * weights.difficulty) +
      (pangramScore * weights.pangrams)
    );
  }

  private scoreRange(value: number, min: number, ideal: number): number {
    if (value >= min && value <= ideal) {
      return 100;
    }
    
    if (value < min) {
      // More gradual scoring below minimum
      return Math.max(0, (value / min) * 100);
    }
    
    // Gentler penalty above ideal
    return Math.max(0, 100 - ((value - ideal) / ideal) * 30);
  }

  private scoreWordDistribution(distribution: Record<number, number>): number {
    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    if (total === 0) return 0;

    // Updated ideal distribution favoring accessibility
    const ideal = {
      4: 0.35,  // 35% 4-letter words
      5: 0.30,  // 30% 5-letter words
      6: 0.20,  // 20% 6-letter words
      7: 0.10,  // 10% 7-letter words
      8: 0.05   // 5% 8+ letter words
    };

    // Calculate actual distribution
    const actual = Object.entries(distribution).reduce((acc, [length, count]) => {
      acc[length] = count / total;
      return acc;
    }, {} as Record<string, number>);

    // More lenient scoring based on distribution
    let score = 100;
    Object.entries(ideal).forEach(([length, targetRatio]) => {
      const actualRatio = actual[length] || 0;
      const difference = Math.abs(targetRatio - actualRatio);
      // Reduced penalties for distribution differences
      score -= difference * 30;
    });

    return Math.max(0, score);
  }
}