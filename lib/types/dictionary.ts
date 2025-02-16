// lib/types/dictionary.ts
export interface Word {
  id: string;
  word: string;
  points: number;
  length: number;
  isPangram: boolean;
  createdAt: string;
}

export interface WordMetadata {
  length: number;
  isPangram: boolean;
  points: number;
}

export interface WordFilter {
  minLength?: number;
  maxLength?: number;
  isPangram?: boolean;
}

export interface DictionaryStats {
  totalWords: number;
  averageLength: number;
  pangrams: number;
  wordLengthDistribution: Record<number, number>;
  totalPoints: number;
}

export interface ImportResult {
  added: number;
  skipped: number;
  errors: string[];
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  metadata?: WordMetadata;
}