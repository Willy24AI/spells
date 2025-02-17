export interface DifficultySettings {
  [key: string]: {
    minCommonWords: number;
    maxWordLength: number;
    minFrequency: number;
    targetShortWordPercentage: number;
  };
}

export type PuzzleStage = 1 | 2 | 3;
export type PuzzleDifficulty = 'easy' | 'medium' | 'hard';

export interface PuzzleMetrics {
  wordCount: number;
  uniqueLetters: number;
  pangramCount: number;
  averageWordLength: number;
  commonWordPercentage: number;
  difficultyScore: number;
  qualityScore: number;
  wordFamilyCount: number;
  // Add missing metrics
  totalWords: number;
  maxScore: number;
  wordLengthDistribution: Record<number, number>;
  fourLetterWordCount: number;
  fiveLetterWordCount: number;
  longWordCount: number;
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
  commonWordCount: number;
  shortWordPercentage: number;
  averageWordLength: number;
  wordLengthDistribution: Record<number, number>;
  difficulty: PuzzleDifficulty;
  stage: PuzzleStage;
  metrics: PuzzleMetrics;
  dateGenerated: string;
  generatorVersion: string;
  date?: string;
}

export interface GeneratorOptions {
  minQualityScore?: number;
  minWordCount?: number;
  maxAttempts?: number;
  preferCommonWords?: boolean;
  targetDifficulty?: PuzzleDifficulty;
  // Add missing options
  minPangrams?: number;
  stage?: PuzzleStage;
}

export interface GenerationResult {
  puzzle: GeneratedPuzzle;
  attempts: number;
  generationTime: number;
  error?: string;
  // Add missing property
  rejectedAttempts?: { 
    reason: string; 
    metrics: Partial<PuzzleMetrics>; 
  }[];
}