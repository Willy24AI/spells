// lib/puzzleGenerator/generator.ts

import { WordList } from '../dictionary/wordList';
import { letterCombinations } from './letterCombinations';
import { QualityMetrics } from './qualityMetrics';

interface GeneratedPuzzle {
  centerLetter: string;
  outerLetters: string[];
  validWords: string[];
  pangrams: string[];
  maxScore: number;
  qualityScore: number;
  wordCount: number;
  averageWordLength: number;
  wordLengthDistribution: Record<number, number>;
}

export class PuzzleGenerator {
  private qualityMetrics = new QualityMetrics();

  constructor(private wordList: WordList) {}

  /**
   * Generate a new puzzle
   */
  async generatePuzzle(): Promise<GeneratedPuzzle> {
    // Find potential pangrams
    const pangrams = await this.wordList.findPangrams();
    
    if (pangrams.length === 0) {
      throw new Error('No pangrams found in dictionary');
    }

    // Try each pangram to find the best puzzle
    const puzzles: GeneratedPuzzle[] = [];
    
    // Randomize pangram order to avoid getting same puzzles
    const shuffledPangrams = this.shuffleArray([...pangrams]);
    
    for (const pangram of shuffledPangrams) {
      // Generate all possible letter combinations
      const combos = letterCombinations.generateFromPangram(pangram);
      
      // Try each combination
      for (const combo of combos) {
        try {
          // Find all valid words for this letter set
          const validWords = await this.wordList.findValidWords(
            combo.centerLetter,
            combo.outerLetters
          );

          // Skip if we don't have enough words
          if (validWords.length < 10) continue;

          // Get pangrams for this set
          const setPangrams = validWords.filter(word => 
            new Set(word.split('')).size >= 7
          );

          // Skip if no pangrams
          if (setPangrams.length === 0) continue;

          // Calculate length-based metrics
          const wordLengths = validWords.map(word => word.length);
          const averageWordLength = wordLengths.reduce((a, b) => a + b, 0) / wordLengths.length;
          const wordLengthDistribution = wordLengths.reduce((acc, len) => {
            acc[len] = (acc[len] || 0) + 1;
            return acc;
          }, {} as Record<number, number>);

          // Calculate total score
          const maxScore = await this.calculateTotalScore(validWords);

          // Calculate quality metrics
          const metrics = this.qualityMetrics.calculateMetrics(validWords, setPangrams);

          // Create puzzle if meets minimum criteria
          if (this.meetsMinimumCriteria(metrics)) {
            puzzles.push({
              centerLetter: combo.centerLetter,
              outerLetters: letterCombinations.getOptimalOrdering(
                combo.centerLetter,
                combo.outerLetters
              ),
              validWords,
              pangrams: setPangrams,
              maxScore,
              qualityScore: metrics.qualityScore,
              wordCount: validWords.length,
              averageWordLength,
              wordLengthDistribution
            });
          }
        } catch (error) {
          console.error('Error generating puzzle from combo:', error);
          continue;
        }
      }

      // If we have some valid puzzles, stop trying more pangrams
      if (puzzles.length >= 3) break;
    }

    // Return the highest quality puzzle
    if (puzzles.length === 0) {
      throw new Error('No valid puzzles could be generated');
    }

    return puzzles.reduce((best, current) => 
      current.qualityScore > best.qualityScore ? current : best
    );
  }

  /**
   * Calculate total score for a set of words
   */
  private async calculateTotalScore(words: string[]): Promise<number> {
    let totalScore = 0;
    for (const word of words) {
      const meta = await this.wordList.getWordMetadata(word);
      if (meta) {
        totalScore += meta.points;
      }
    }
    return totalScore;
  }

  /**
   * Check if puzzle meets minimum criteria
   */
  private meetsMinimumCriteria(metrics: ReturnType<typeof QualityMetrics.prototype.calculateMetrics>): boolean {
    return (
      metrics.totalWords >= 10 &&      // Reduced from 20
      metrics.pangramCount >= 1 &&     // At least 1 pangram
      metrics.maxScore >= 30 &&        // Reduced from 50
      metrics.qualityScore >= 50       // Reduced from 70
    );
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}