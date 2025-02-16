// lib/puzzleGenerator/generator.ts

import { WordList } from '../dictionary/wordList';
import { letterCombinations } from './letterCombinations';
import { QualityMetrics } from './qualityMetrics';

interface GenerationOptions {
  minTotalWords?: number;
  minCommonWords?: number;
  maxWordLength?: number;
  preferCommonWords?: boolean;
  stage?: 1 | 2 | 3;
}

interface StageRequirements {
  minTotalWords: number;
  minCommonWords: number;
  maxWordLength: number;
  minFrequency: number;
  wordRatio4Letter: number;
  wordRatio5Letter: number;
}

const DEFAULT_OPTIONS: Required<GenerationOptions> = {
  minTotalWords: 30,
  minCommonWords: 15,
  maxWordLength: 8,
  preferCommonWords: true,
  stage: 1
};

const STAGE_REQUIREMENTS: Record<1 | 2 | 3, StageRequirements> = {
  1: {
    minTotalWords: 30,
    minCommonWords: 15,
    maxWordLength: 8,
    minFrequency: 40,
    wordRatio4Letter: 0.3,
    wordRatio5Letter: 0.2
  },
  2: {
    minTotalWords: 40,
    minCommonWords: 20,
    maxWordLength: 9,
    minFrequency: 35,
    wordRatio4Letter: 0.25,
    wordRatio5Letter: 0.25
  },
  3: {
    minTotalWords: 50,
    minCommonWords: 25,
    maxWordLength: 10,
    minFrequency: 30,
    wordRatio4Letter: 0.2,
    wordRatio5Letter: 0.3
  }
};

export class PuzzleGenerator {
  private qualityMetrics = new QualityMetrics();

  constructor(private wordList: WordList) {}

  async generatePuzzle(options: GenerationOptions = {}): Promise<any> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const stageReqs = STAGE_REQUIREMENTS[opts.stage];

    // Find pangrams that could work
    const pangrams = await this.wordList.findPangrams();
    if (pangrams.length === 0) {
      throw new Error('No pangrams found in dictionary');
    }

    // Try pangrams until we find a good puzzle
    for (const pangram of this.shuffleArray(pangrams)) {
      try {
        // Generate letter combinations from pangram
        const combos = letterCombinations.generateFromPangram(pangram);
        
        for (const combo of combos) {
          // Find all possible words for this letter set
          const validWords = await this.wordList.findValidWords(
            combo.centerLetter,
            combo.outerLetters,
            {
              minLength: 4,
              maxLength: stageReqs.maxWordLength,
              minFrequency: stageReqs.minFrequency,
              includeVariations: true
            }
          );

          if (validWords.length < stageReqs.minTotalWords) continue;

          // Calculate word length distribution
          const wordsByLength = validWords.reduce((acc, word) => {
            acc[word.length] = (acc[word.length] || 0) + 1;
            return acc;
          }, {} as Record<number, number>);

          // More flexible distribution check
          const total = validWords.length;
          const shortWordCount = (wordsByLength[4] || 0) + (wordsByLength[5] || 0);
          const shortWordRatio = shortWordCount / total;

          // Require at least 40% short words (4-5 letters)
          if (shortWordRatio < 0.4) continue;

          // Calculate puzzle metrics
          const puzzleMetrics = this.qualityMetrics.calculateMetrics(validWords, pangrams);
          
          // More lenient requirements check
          if (this.meetsRequirements(puzzleMetrics, stageReqs)) {
            return {
              centerLetter: combo.centerLetter,
              outerLetters: combo.outerLetters,
              validWords,
              pangrams: pangrams.filter(p => validWords.includes(p)),
              maxScore: this.calculateTotalScore(validWords),
              qualityScore: puzzleMetrics.qualityScore,
              wordCount: validWords.length,
              averageWordLength: validWords.reduce((sum, word) => 
                sum + word.length, 0) / validWords.length,
              wordLengthDistribution: wordsByLength
            };
          }
        }
      } catch (error) {
        console.error('Error generating from pangram:', error);
        continue;
      }
    }

    throw new Error('No valid puzzles could be generated');
  }

  private meetsRequirements(metrics: any, requirements: StageRequirements): boolean {
    // More lenient requirements check
    const hasEnoughWords = metrics.totalWords >= requirements.minTotalWords;
    const hasEnoughShortWords = (
      (metrics.wordLengthDistribution[4] || 0) + 
      (metrics.wordLengthDistribution[5] || 0)
    ) >= requirements.minTotalWords * 0.4; // Combined requirement for short words

    const hasReasonableLength = metrics.averageWordLength <= requirements.maxWordLength;

    return hasEnoughWords && hasEnoughShortWords && hasReasonableLength;
  }

  private calculateTotalScore(words: string[]): number {
    return words.reduce((total, word) => {
      let score = word.length === 4 ? 1 : word.length;
      if (word.length >= 7) score += 7; // Pangram bonus
      return total + score;
    }, 0);
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}