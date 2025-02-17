import { WordList } from '../dictionary/wordList';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import type { GeneratedPuzzle, PuzzleStage, PuzzleDifficulty, PuzzleMetrics } from '@/lib/types/puzzleGenerator';

const VOWELS = ['a', 'e', 'i', 'o', 'u'];
const COMMON_CONSONANTS = ['r', 's', 't', 'n', 'l', 'd'];

// Scoring weights for letter combinations
const SCORING_WEIGHTS = {
  commonConsonants: 3,
  vowels: 2,
  centerLetterFrequency: 2,
  letterBalance: 1
};

interface DifficultySettings {
  minCommonWords: number;
  maxWordLength: number;
  minFrequency: number;
  targetShortWordPercentage: number;
}

const DIFFICULTY_SETTINGS: Record<PuzzleDifficulty, DifficultySettings> = {
  easy: {
    minCommonWords: 20,
    maxWordLength: 6,
    minFrequency: 50,
    targetShortWordPercentage: 0.7
  },
  medium: {
    minCommonWords: 15,
    maxWordLength: 7,
    minFrequency: 40,
    targetShortWordPercentage: 0.6
  },
  hard: {
    minCommonWords: 10,
    maxWordLength: 8,
    minFrequency: 30,
    targetShortWordPercentage: 0.5
  }
};

export class PuzzleGenerator {
  private wordList: WordList;
  private supabase: any;

  constructor(
    wordList: WordList
  ) {
    this.wordList = wordList;
    this.initializeSupabase();
  }

  private initializeSupabase() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }

  private generatePuzzleId(): string {
    return uuidv4();
  }

  async generatePuzzle(targetDate?: string): Promise<GeneratedPuzzle> {
    try {
      console.log('Starting puzzle generation');
      
      // Get pangrams from dictionary
      const pangrams = await this.wordList.findPangrams();
      console.log(`Found ${pangrams.length} pangrams`);

      if (!pangrams.length) {
        throw new Error('No pangrams found in dictionary');
      }

      // Get a random pangram
      const pangram = pangrams[Math.floor(Math.random() * pangrams.length)];
      console.log(`Selected pangram: ${pangram}`);

      // Generate letter combinations
      const letters = Array.from(new Set(pangram.split('')));
      const centerLetter = letters[Math.floor(Math.random() * letters.length)];
      const outerLetters = letters.filter(l => l !== centerLetter);

      console.log(`Letter set: center=${centerLetter}, outer=${outerLetters.join(',')}`);

      // Find valid words
      const validWords = await this.wordList.findValidWords(
        centerLetter,
        outerLetters,
        {
          minLength: 4,
          maxLength: 15
        }
      );

      console.log(`Found ${validWords.length} valid words`);

      // Analyze word distribution
      const wordLengthDistribution = this.calculateWordLengthDistribution(validWords);

      // Calculate metrics
      const metrics: PuzzleMetrics = {
        totalWords: validWords.length,
        wordCount: validWords.length,
        uniqueLetters: letters.length,
        maxScore: this.calculateMaxScore(validWords, pangrams),
        pangramCount: pangrams.filter(p => validWords.includes(p)).length,
        averageWordLength: validWords.reduce((sum, word) => sum + word.length, 0) / validWords.length,
        wordLengthDistribution,
        commonWordPercentage: this.calculateCommonWordPercentage(validWords),
        difficultyScore: this.calculateDifficultyScore(validWords, pangrams),
        qualityScore: validWords.length >= 30 ? 80 : 60, // Simple quality score based on word count
        fourLetterWordCount: wordLengthDistribution[4] || 0,
        fiveLetterWordCount: wordLengthDistribution[5] || 0,
        longWordCount: Object.entries(wordLengthDistribution)
          .filter(([length]) => parseInt(length) >= 7)
          .reduce((sum, [_, count]) => sum + count, 0),
        wordFamilyCount: validWords.length // Each word is its own family now
      };

      // Create puzzle object
      const puzzle: GeneratedPuzzle = {
        id: this.generatePuzzleId(),
        centerLetter,
        outerLetters,
        validWords,
        pangrams: pangrams.filter(p => validWords.includes(p)),
        maxScore: metrics.maxScore,
        qualityScore: metrics.qualityScore,
        wordCount: validWords.length,
        commonWordCount: this.calculateCommonWords(validWords),
        shortWordPercentage: this.calculateShortWordPercentage(validWords),
        averageWordLength: metrics.averageWordLength,
        wordLengthDistribution,
        difficulty: this.calculateDifficulty(metrics),
        stage: this.determineStage(metrics),
        metrics,
        dateGenerated: new Date().toISOString(),
        generatorVersion: '2.0.0',
        date: targetDate
      };

      console.log('Puzzle generation complete');
      return puzzle;

    } catch (error) {
      console.error('Error generating puzzle:', error);
      throw error;
    }
  }

  private calculateWordLengthDistribution(words: string[]): Record<number, number> {
    return words.reduce((acc, word) => {
      acc[word.length] = (acc[word.length] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
  }

  private calculateMaxScore(words: string[], pangrams: string[]): number {
    return words.reduce((total, word) => {
      let score = word.length === 4 ? 1 : word.length;
      if (pangrams.includes(word)) score += 7;
      return total + score;
    }, 0);
  }

  private calculateCommonWords(words: string[]): number {
    return words.filter(word => word.length <= 6).length;
  }

  private calculateShortWordPercentage(words: string[]): number {
    const shortWords = words.filter(word => word.length <= 5);
    return (shortWords.length / words.length) * 100;
  }

  private calculateCommonWordPercentage(words: string[]): number {
    return (this.calculateCommonWords(words) / words.length) * 100;
  }

  private calculateDifficultyScore(words: string[], pangrams: string[]): number {
    const distribution = this.calculateWordLengthDistribution(words);
    const longWordRatio = Object.entries(distribution)
      .filter(([length]) => parseInt(length) >= 7)
      .reduce((sum, [_, count]) => sum + count, 0) / words.length;

    return Math.min(
      100,
      longWordRatio * 100 +
      pangrams.length * 20 +
      (words.length > 50 ? 20 : 0)
    );
  }

  private calculateDifficulty(metrics: PuzzleMetrics): PuzzleDifficulty {
    if (metrics.difficultyScore < 40) return 'easy';
    if (metrics.difficultyScore < 70) return 'medium';
    return 'hard';
  }

  private determineStage(metrics: PuzzleMetrics): PuzzleStage {
    if (metrics.qualityScore < 60) return 1;
    if (metrics.qualityScore < 80) return 2;
    return 3;
  }
}