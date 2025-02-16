// lib/types/puzzleGenerator.ts

export interface LetterSet {
  centerLetter: string;
  outerLetters: string[];
  score: number;
  vowelCount: number;
  consonantCount: number;
  commonLetterScore: number;
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
  dateGenerated: string;
  generatorVersion: string;
}

export interface GeneratorOptions {
  minQualityScore?: number;
  minWordCount?: number;
  minPangrams?: number;
  preferCommonWords?: boolean;
  seed?: string;
  maxAttempts?: number;
}

export interface GeneratorStats {
  totalGenerated: number;
  acceptedPuzzles: number;
  averageQualityScore: number;
  averageGenerationTime: number;
  failureReasons: Record<string, number>;
}

export interface GenerationResult {
  puzzle: GeneratedPuzzle;
  attempts: number;
  generationTime: number;
  error?: string;
}

export interface ScheduleOptions {
  dates: string[];
  minQualityScore: number;
  maxAttempts?: number;
  retryDelay?: number;
}