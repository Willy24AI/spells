export interface LetterSet {
  centerLetter: string;
  outerLetters: string[];
  score: number;
  vowelCount: number;
  consonantCount: number;
  commonLetterScore: number;
}

export type PuzzleStage = 1 | 2 | 3;

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
  difficulty: 'easy' | 'medium' | 'hard';
  stage: PuzzleStage;
  metrics: PuzzleMetrics;
  dateGenerated: string;
  generatorVersion: string;
  created_at?: string;
  date?: string;
}

export interface PuzzleMetrics {
  wordCount: number;
  uniqueLetters: number;
  pangramCount: number;
  averageWordLength: number;
  commonWordPercentage: number;
  difficultyScore: number;
  qualityScore: number;
  wordFamilyCount: number;
}

export interface GenerationResult {
  puzzle: GeneratedPuzzle;
  attempts: number;
  generationTime: number;
  error?: string;
}

export interface GeneratorOptions {
  minQualityScore?: number;
  minWordCount?: number;
  maxAttempts?: number;
  seed?: string;
  preferCommonWords?: boolean;
}

export interface GeneratorStats {
  totalGenerated: number;
  acceptedPuzzles: number;
  averageQualityScore: number;
  averageGenerationTime: number;
  failureReasons: Record<string, number>;
}

export interface ScheduleOptions {
  dates: string[];
  minQualityScore: number;
  minWordCount?: number;
  maxAttempts?: number;
  retryDelay?: number;
  difficultyProgression?: boolean;
}

export interface QualityThresholds {
  minWordCount: number;
  minPangrams: number;
  minQualityScore: number;
  minCommonWords: number;
  maxDifficulty: number;
}

export interface DifficultySettings {
  stage: PuzzleStage;
  thresholds: QualityThresholds;
  targetWordCount: {
    min: number;
    max: number;
  };
  targetPangrams: {
    min: number;
    max: number;
  };
}

export type GenerationStrategy = 'balanced' | 'common-words' | 'challenging';

export interface WordPattern {
  pattern: string;
  frequency: number;
  examples: string[];
}

export interface LetterFrequencies {
  [key: string]: number;
}

export interface GenerationConfig {
  strategy: GenerationStrategy;
  settings: {
    minWordCount: number;
    minQualityScore: number;
    maxAttempts: number;
    preferCommonWords: boolean;
    targetDifficulty?: 'easy' | 'medium' | 'hard';
    requiredPatterns?: WordPattern[];
    letterFrequencies?: LetterFrequencies;
  };
  thresholds: QualityThresholds;
  difficultySettings: DifficultySettings[];
}

export interface GenerationProgress {
  currentAttempt: number;
  maxAttempts: number;
  currentScore: number;
  bestScore: number;
  failedAttempts: number;
  startTime: number;
  stage: 'init' | 'generating' | 'validating' | 'complete' | 'failed';
  error?: string;
}

export interface GenerationResponse {
  success: boolean;
  puzzle?: GeneratedPuzzle;
  stats: GeneratorStats;
  progress: GenerationProgress;
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  metrics: PuzzleMetrics;
}

export interface BatchGenerationResult {
  successful: GeneratedPuzzle[];
  failed: Array<{
    date: string;
    error: string;
    attempts: number;
  }>;
  stats: GeneratorStats;
}