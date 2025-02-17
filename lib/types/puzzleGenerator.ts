// lib/types/puzzleGenerator.ts

export interface LetterSet {
  centerLetter: string;
  outerLetters: string[];
  score: number;
  vowelCount: number;
  consonantCount: number;
  commonLetterScore: number;
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
}

export interface GenerationResult {
  puzzle: GeneratedPuzzle;
  attempts: number;
  generationTime: number;
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  metrics: PuzzleMetrics;
}