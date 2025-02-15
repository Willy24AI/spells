// lib/types/dictionary.ts

export interface Word {
    id: string;
    word: string;
    length: number;
    letters: string[];
    uniqueLetters: string[];
    letterCount: Record<string, number>;
    isPangram: boolean;
    isPangram7: boolean;
    vowelCount: number;
    consonantCount: number;
    isCommon: boolean;
    createdAt: string;
  }
  
  export interface WordMetadata {
    length: number;
    letters: string[];
    uniqueLetters: string[];
    letterCount: Record<string, number>;
    isPangram: boolean;
    isPangram7: boolean;
    vowelCount: number;
    consonantCount: number;
  }
  
  export interface WordFilter {
    minLength?: number;
    maxLength?: number;
    includeProperNouns?: boolean;
    requireVowels?: boolean;
    allowObscureLetters?: boolean;
    excludedWords?: Set<string>;
  }
  
  export interface DictionaryStats {
    totalWords: number;
    averageLength: number;
    pangrams: number;
    wordLengthDistribution: Record<number, number>;
    letterFrequency: Record<string, number>;
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