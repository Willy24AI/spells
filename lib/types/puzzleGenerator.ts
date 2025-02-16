// lib/types/puzzleGenerator.ts

export interface LetterSet {
  centerLetter: string;
  outerLetters: string[];
  score: number;
  vowelCount: number;
  consonantCount: number;
  commonLetterScore: number;
  // Added for better letter distribution
  letterFrequencies: Record<string, number>;
}

export interface GeneratedPuzzle {
  id: string;
  centerLetter: string;
  outerLetters: string[];
  validWords: string[];
  pangrams: string[];
  maxScore: number;
  qualityScore: number;
  wordCount: number;
  averageWordLength: number;
  wordLengthDistribution: Record<number, number>;
  // Added new fields
  commonWordCount: number;
  shortWordPercentage: number;
  difficulty: 'easy' | 'medium' | 'hard';
  stage: 1 | 2 | 3;
  metrics: PuzzleMetrics;
  dateGenerated: string;
  generatorVersion: string;
}

export interface PuzzleMetrics {
  totalWords: number;
  maxScore: number;
  pangramCount: number;
  averageWordLength: number;
  wordLengthDistribution: Record<number, number>;
  commonWordPercentage: number;
  difficultyScore: number;
  qualityScore: number;
  // Added metrics
  fourLetterWordCount: number;
  fiveLetterWordCount: number;
  longWordCount: number;
  wordFamilyCount: number;
}

export interface GeneratorOptions {
  minQualityScore?: number;
  minWordCount?: number;
  minPangrams?: number;
  preferCommonWords?: boolean;
  seed?: string;
  maxAttempts?: number;
  // Added options
  stage?: 1 | 2 | 3;
  targetDifficulty?: 'easy' | 'medium' | 'hard';
  minCommonWords?: number;
  maxWordLength?: number;
  requiredLetters?: string[];
}

export interface GeneratorStats {
  totalGenerated: number;
  acceptedPuzzles: number;
  averageQualityScore: number;
  averageGenerationTime: number;
  failureReasons: Record<string, number>;
  // Added stats
  stageDistribution: Record<string, number>;
  difficultyDistribution: Record<string, number>;
  averageWordCount: number;
  averageCommonWordPercentage: number;
}

export interface GenerationResult {
  puzzle: GeneratedPuzzle;
  attempts: number;
  generationTime: number;
  error?: string;
  // Added result data
  rejectedAttempts?: {
    reason: string;
    metrics: Partial<PuzzleMetrics>;
  }[];
}

export interface ScheduleOptions {
  dates: string[];
  minQualityScore: number;
  maxAttempts?: number;
  retryDelay?: number;
  // Added new scheduling options
  difficultyProgression?: boolean;  // Whether to increase difficulty over time
  stageVariation?: boolean;         // Whether to vary stages across puzzles
  requireCommonWords?: boolean;     // Whether to enforce minimum common word requirements
  targetDifficulty?: 'easy' | 'medium' | 'hard';  // Default difficulty setting
  stage?: 1 | 2 | 3;               // Default stage setting
  minCommonWords?: number;         // Minimum number of common words required
  preferCommonWords?: boolean;     // Whether to prioritize common words
}


// Added new interfaces for better puzzle management

export interface WordFamily {
  base: string;
  variations: string[];
  frequency: number;
}

export interface DifficultySettings {
  easy: {
    minCommonWords: number;
    maxWordLength: number;
    minFrequency: number;
    targetShortWordPercentage: number;
  };
  medium: {
    minCommonWords: number;
    maxWordLength: number;
    minFrequency: number;
    targetShortWordPercentage: number;
  };
  hard: {
    minCommonWords: number;
    maxWordLength: number;
    minFrequency: number;
    targetShortWordPercentage: number;
  };
}

export interface StageRequirements {
  minTotalWords: number;
  minCommonWords: number;
  maxWordLength: number;
  minFrequency: number;
  wordRatio4Letter: number;
  wordRatio5Letter: number;
}