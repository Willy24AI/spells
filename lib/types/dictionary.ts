// lib/types/dictionary.ts
export interface Word {
  id: string;
  word: string;
  points: number;
  isPangram: boolean;
  length?: number;
  created_at?: string;
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