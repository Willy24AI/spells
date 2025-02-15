// lib/types/quality.ts

export interface PuzzleMetrics {
    totalWords: number;
    maxScore: number;
    pangramCount: number;
    averageWordLength: number;
    wordLengthDistribution: Record<number, number>;
    difficultyScore: number;
    qualityScore: number;
  }
  
  export interface PlayMetrics {
    timesPlayed: number;
    averageScore: number;
    highestScore: number;
    averageCompletion: number;
    wordFindRate: Record<string, number>;
  }
  
  export interface QualityThresholds {
    minWordCount: number;
    minPangrams: number;
    minQualityScore: number;
    preferredWordLengthDistribution: Record<number, number>;
    toleranceRange: number;
  }
  
  export interface QualityReport {
    metrics: PuzzleMetrics;
    playMetrics?: PlayMetrics;
    passes: boolean;
    failureReasons: string[];
    suggestions: string[];
  }
  
  export interface HistoricalMetrics {
    date: string;
    metrics: PuzzleMetrics;
    playMetrics: PlayMetrics;
  }