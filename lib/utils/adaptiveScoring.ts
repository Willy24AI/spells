// lib/utils/adaptiveScoring.ts

interface PuzzleMetrics {
    totalWords: number;
    maxScore: number;
    pangrams: string[];
    wordLengthDistribution: Record<number, number>;
    averageWordLength: number;
  }
  
  interface ScoringConfig {
    baseMultiplier: number;
    pangramBonus: number;
    consecutiveBonus: number;
    lengthBonuses: Record<number, number>;
  }
  
  export class AdaptiveScoring {
    private metrics: PuzzleMetrics;
    private config: ScoringConfig;
    private foundWords: Set<string> = new Set();
    private lastWordTimestamp: number = 0;
    
    constructor(metrics: PuzzleMetrics) {
      this.metrics = metrics;
      this.config = this.calculateScoringConfig();
    }
  
    /**
     * Calculate scoring configuration based on puzzle metrics
     */
    private calculateScoringConfig(): ScoringConfig {
      // Base multiplier increases for puzzles with fewer words
      const baseMultiplier = this.calculateBaseMultiplier();
      
      // Pangram bonus increases for puzzles with fewer pangrams
      const pangramBonus = this.calculatePangramBonus();
      
      // Consecutive bonus for finding words quickly
      const consecutiveBonus = 1.5;
      
      // Length bonuses scale based on word distribution
      const lengthBonuses = this.calculateLengthBonuses();
  
      return {
        baseMultiplier,
        pangramBonus,
        consecutiveBonus,
        lengthBonuses
      };
    }
  
    /**
     * Calculate base point multiplier
     */
    private calculateBaseMultiplier(): number {
      // Scale multiplier inversely with word count
      const wordCountFactor = Math.max(0.5, Math.min(2, 50 / this.metrics.totalWords));
      
      // Adjust for average word length
      const lengthFactor = this.metrics.averageWordLength / 5.5; // 5.5 is typical average
      
      return wordCountFactor * lengthFactor;
    }
  
    /**
     * Calculate pangram bonus based on rarity
     */
    private calculatePangramBonus(): number {
      // More bonus points when pangrams are rare
      const pangramRatio = this.metrics.pangrams.length / this.metrics.totalWords;
      return Math.max(7, Math.round(15 * (1 - pangramRatio)));
    }
  
    /**
     * Calculate length bonuses based on word distribution
     */
    private calculateLengthBonuses(): Record<number, number> {
      const bonuses: Record<number, number> = {};
      const distribution = this.metrics.wordLengthDistribution;
      
      // Calculate rarity of each length
      Object.entries(distribution).forEach(([length, count]) => {
        const rarity = 1 - (count / this.metrics.totalWords);
        bonuses[Number(length)] = Math.max(1, Math.round(rarity * 5));
      });
      
      return bonuses;
    }
  
    /**
     * Calculate points for a word
     */
    public calculateWordPoints(word: string, foundAt: number = Date.now()): number {
      if (this.foundWords.has(word)) return 0;
      
      let points = 0;
      
      // Base points (length-based)
      points = word.length === 4 ? 1 : word.length;
      
      // Apply base multiplier
      points *= this.config.baseMultiplier;
      
      // Add pangram bonus
      if (this.metrics.pangrams.includes(word)) {
        points += this.config.pangramBonus;
      }
      
      // Add length bonus
      points += this.config.lengthBonuses[word.length] || 0;
      
      // Add consecutive bonus if words found quickly
      if (foundAt - this.lastWordTimestamp < 10000) { // 10 seconds
        points *= this.config.consecutiveBonus;
      }
      
      this.foundWords.add(word);
      this.lastWordTimestamp = foundAt;
      
      return Math.round(points);
    }
  
    /**
     * Calculate completion percentage
     */
    public getCompletionPercentage(): number {
      return (this.foundWords.size / this.metrics.totalWords) * 100;
    }
  
    /**
     * Get current rank based on completion
     */
    public getCurrentRank(): {
      title: string;
      progress: number;
      nextMilestone: number;
    } {
      const completion = this.getCompletionPercentage();
      
      const ranks = [
        { title: 'Worker Bee', threshold: 0 },
        { title: 'Busy Bee', threshold: 15 },
        { title: 'Honey Maker', threshold: 30 },
        { title: 'Hive Scout', threshold: 45 },
        { title: 'Royal Guard', threshold: 60 },
        { title: 'Nectar Master', threshold: 75 },
        { title: 'Hive Elder', threshold: 85 },
        { title: 'Queen Bee', threshold: 95 }
      ];
  
      const currentRank = ranks.reduce((prev, curr) => 
        completion >= curr.threshold ? curr : prev
      );
      
      const nextRank = ranks.find(rank => rank.threshold > currentRank.threshold);
      
      return {
        title: currentRank.title,
        progress: completion - currentRank.threshold,
        nextMilestone: nextRank ? nextRank.threshold : 100
      };
    }
  
    /**
     * Get scoring statistics
     */
    public getStats() {
      return {
        foundWords: this.foundWords.size,
        totalWords: this.metrics.totalWords,
        completion: this.getCompletionPercentage(),
        pangrams: this.metrics.pangrams.filter(word => this.foundWords.has(word)),
        multiplier: this.config.baseMultiplier,
        bonuses: this.config.lengthBonuses
      };
    }
  }