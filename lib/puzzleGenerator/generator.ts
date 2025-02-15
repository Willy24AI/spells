// lib/puzzleGenerator/generator.ts

import { WordList } from '../dictionary/wordList';
import { letterCombinations } from './letterCombinations';
import { qualityMetrics } from './qualityMetrics';

interface GeneratedPuzzle {
  centerLetter: string;
  outerLetters: string[];
  validWords: string[];
  pangrams: string[];
  maxScore: number;
  qualityScore: number;
}

export class PuzzleGenerator {
  constructor(private wordList: WordList) {}

  /**
   * Generate a new puzzle
   */
  async generatePuzzle(): Promise<GeneratedPuzzle> {
    // Find potential pangrams
    const pangrams = await this.wordList.findPangrams(true);
    
    // Try each pangram to find the best puzzle
    const puzzles: GeneratedPuzzle[] = [];
    
    for (const pangram of pangrams) {
      // Generate all possible letter combinations
      const combos = letterCombinations.generateFromPangram(pangram);
      
      // Try each combination
      for (const combo of combos) {
        // Find all valid words for this letter set
        const validWords = await this.wordList.findValidWords(
          combo.centerLetter,
          combo.outerLetters
        );

        // Get pangrams for this set
        const setPangrams = validWords.filter(word => {
          const meta = this.wordList.getWordMetadata(word);
          return meta?.isPangram7;
        });

        // Calculate metrics
        const metrics = qualityMetrics.calculateMetrics(validWords, setPangrams);

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
            maxScore: metrics.maxScore,
            qualityScore: metrics.qualityScore
          });
        }
      }
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
   * Check if puzzle meets minimum criteria
   */
  private meetsMinimumCriteria(metrics: ReturnType<typeof qualityMetrics.calculateMetrics>): boolean {
    return (
      metrics.totalWords >= 20 &&       // At least 20 words
      metrics.pangramCount >= 1 &&      // At least 1 pangram
      metrics.maxScore >= 50 &&         // Minimum possible score
      metrics.qualityScore >= 70        // Minimum quality score
    );
  }

  /**
   * Generate multiple puzzles
   */
  async generatePuzzles(count: number): Promise<GeneratedPuzzle[]> {
    const puzzles: GeneratedPuzzle[] = [];
    
    while (puzzles.length < count) {
      try {
        const puzzle = await this.generatePuzzle();
        
        // Check if too similar to existing puzzles
        const isTooSimilar = puzzles.some(existing =>
          this.calculatePuzzleSimilarity(existing, puzzle) > 0.7
        );

        if (!isTooSimilar) {
          puzzles.push(puzzle);
        }
      } catch (error) {
        console.error('Error generating puzzle:', error);
        // Continue trying until we get enough puzzles
      }
    }

    return puzzles;
  }

  /**
   * Calculate similarity between two puzzles
   */
  private calculatePuzzleSimilarity(
    puzzle1: GeneratedPuzzle,
    puzzle2: GeneratedPuzzle
  ): number {
    // Compare letter sets
    const letters1 = new Set([puzzle1.centerLetter, ...puzzle1.outerLetters]);
    const letters2 = new Set([puzzle2.centerLetter, ...puzzle2.outerLetters]);
    const letterOverlap = new Set(
      [...letters1].filter(x => letters2.has(x))
    ).size;
    const letterSimilarity = letterOverlap / 7;

    // Compare valid words
    const words1 = new Set(puzzle1.validWords);
    const words2 = new Set(puzzle2.validWords);
    const wordOverlap = new Set(
      [...words1].filter(x => words2.has(x))
    ).size;
    const wordSimilarity = (2 * wordOverlap) / (words1.size + words2.size);

    // Weighted average
    return letterSimilarity * 0.6 + wordSimilarity * 0.4;
  }
}