import { WordList } from '../dictionary/wordList';
import type { GeneratedPuzzle, PuzzleStage } from '@/lib/types/puzzleGenerator';

interface LetterSet {
  centerLetter: string;
  outerLetters: string[];
  score: number;
  vowelCount: number;
  consonantCount: number;
}

interface LetterFrequencies {
  [key: string]: number;
}

const letterFrequencies: LetterFrequencies = {
  'e': 12.7, 't': 9.1, 'a': 8.2, 'o': 7.5, 'i': 7.0,
  'n': 6.7, 's': 6.3, 'h': 6.1, 'r': 6.0, 'd': 4.3,
  'l': 4.0, 'u': 2.8, 'c': 2.8, 'm': 2.4, 'w': 2.4,
  'f': 2.2, 'g': 2.0, 'y': 2.0, 'p': 1.9, 'b': 1.5,
  'v': 1.0, 'k': 0.8, 'j': 0.15, 'x': 0.15, 'q': 0.10,
  'z': 0.07
};

export class PuzzleGenerator {
  private qualityMetrics = new QualityMetrics();
  private minWordCount = 60;
  
  constructor(private wordList: WordList) {}

  async generatePuzzle(targetDate: string): Promise<GeneratedPuzzle> {
    if (!targetDate) {
      throw new Error('Target date is required');
    }

    const pangrams = await this.wordList.findPangrams();
    const puzzles: GeneratedPuzzle[] = [];
    
    const shuffledPangrams = this.shuffleArray([...pangrams]);
    
    for (const pangram of shuffledPangrams) {
      const combos = this.generateLetterCombinations(pangram);
      
      for (const combo of combos) {
        try {
          const validWords = await this.wordList.findValidWords(
            combo.centerLetter,
            combo.outerLetters
          );

          if (validWords.length < this.minWordCount) continue;

          const distribution = this.analyzeWordDistribution(validWords);
          if (!this.isGoodDistribution(distribution)) continue;

          const setPangrams = validWords.filter(word => 
            new Set(word.split('')).size >= 7
          );

          if (setPangrams.length === 0) continue;

          const metrics = this.qualityMetrics.calculateMetrics(validWords, setPangrams);
          const commonWords = this.findCommonWords(validWords);
          const shortWordPercentage = this.calculateShortWordPercentage(validWords);
          const averageWordLength = this.calculateAverageLength(validWords);
          
          if (metrics.qualityScore >= 50) {
            const now = new Date();
            
            puzzles.push({
              id: crypto.randomUUID(),
              centerLetter: combo.centerLetter,
              outerLetters: combo.outerLetters,
              validWords,
              pangrams: setPangrams,
              maxScore: this.calculateTotalScore(validWords),
              qualityScore: metrics.qualityScore,
              wordCount: validWords.length,
              commonWordCount: commonWords.length,
              shortWordPercentage,
              averageWordLength,
              wordLengthDistribution: distribution,
              difficulty: this.calculateDifficulty(metrics),
              stage: 1 as PuzzleStage,
              metrics: {
                wordCount: validWords.length,
                uniqueLetters: 7,
                pangramCount: setPangrams.length,
                averageWordLength,
                commonWordPercentage: (commonWords.length / validWords.length) * 100,
                difficultyScore: metrics.qualityScore,
                qualityScore: metrics.qualityScore,
                wordFamilyCount: this.calculateWordFamilyCount(validWords)
              },
              date: targetDate,
              dateGenerated: now.toISOString(),
              generatorVersion: '1.0.0'
            });
          }
        } catch (error) {
          console.error('Error generating puzzle:', error);
          continue;
        }
      }

      if (puzzles.length >= 3) break;
    }

    if (puzzles.length === 0) {
      throw new Error('No valid puzzles could be generated');
    }

    return puzzles.reduce((best, current) => 
      current.qualityScore > best.qualityScore ? current : best
    );
  }

  private generateLetterCombinations(pangram: string): LetterSet[] {
    const uniqueLetters = Array.from(new Set(pangram.toLowerCase()));
    const combinations: LetterSet[] = [];
    
    for (const centerLetter of uniqueLetters) {
      const outerLetters = uniqueLetters.filter(l => l !== centerLetter);
      const score = this.scoreLetterSet(centerLetter, outerLetters);
      
      combinations.push({
        centerLetter,
        outerLetters,
        ...score
      });
    }

    return combinations.sort((a, b) => b.score - a.score);
  }

  private scoreLetterSet(
    centerLetter: string,
    outerLetters: string[]
  ): { score: number; vowelCount: number; consonantCount: number } {
    const vowels = ['a', 'e', 'i', 'o', 'u'];
    const commonConsonants = ['t', 'n', 's', 'r', 'l', 'd'];
    const allLetters = [centerLetter, ...outerLetters];
    
    const vowelCount = allLetters.filter(l => vowels.includes(l)).length;
    const consonantCount = 7 - vowelCount;
    
    const frequencyScore = allLetters.reduce(
      (sum, letter) => sum + (letterFrequencies[letter] || 0),
      0
    );

    const commonConsonantCount = allLetters.filter(l => 
      commonConsonants.includes(l)
    ).length;

    const vowelScore = Math.abs(3 - vowelCount) * -10;
    const consonantScore = commonConsonantCount * 15;
    const centerScore = letterFrequencies[centerLetter] * 2;
    const balanceScore = vowelCount >= 2 && consonantCount >= 4 ? 20 : 0;

    return {
      score: vowelScore + consonantScore + centerScore + balanceScore + frequencyScore,
      vowelCount,
      consonantCount
    };
  }

  private findCommonWords(words: string[]): string[] {
    return words.filter(word => word.length <= 6);
  }

  private calculateShortWordPercentage(words: string[]): number {
    const shortWords = words.filter(word => word.length <= 5);
    return (shortWords.length / words.length) * 100;
  }

  private calculateDifficulty(metrics: any): 'easy' | 'medium' | 'hard' {
    if (metrics.qualityScore < 60) return 'easy';
    if (metrics.qualityScore < 80) return 'medium';
    return 'hard';
  }

  private analyzeWordDistribution(words: string[]): Record<number, number> {
    return words.reduce((acc, word) => {
      acc[word.length] = (acc[word.length] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
  }

  private isGoodDistribution(distribution: Record<number, number>): boolean {
    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    
    const fourLetterPercentage = (distribution[4] || 0) / total;
    const fiveLetterPercentage = (distribution[5] || 0) / total;
    const sixLetterPercentage = (distribution[6] || 0) / total;
    
    return fourLetterPercentage >= 0.25 &&
           fiveLetterPercentage >= 0.20 &&
           sixLetterPercentage >= 0.15 &&
           Object.keys(distribution).length >= 4;
  }

  private calculateAverageLength(words: string[]): number {
    return words.reduce((sum, word) => sum + word.length, 0) / words.length;
  }

  private calculateTotalScore(words: string[]): number {
    return words.reduce((total, word) => {
      const score = word.length === 4 ? 1 : word.length;
      return total + score;
    }, 0);
  }

  private calculateWordFamilyCount(words: string[]): number {
    const families = new Set<string>();
    for (const word of words) {
      const root = this.getWordRoot(word);
      families.add(root);
    }
    return families.size;
  }

  private getWordRoot(word: string): string {
    // Simple implementation - could be enhanced with proper stemming
    const commonSuffixes = ['s', 'es', 'ed', 'ing', 'er', 'est'];
    let root = word.toLowerCase();
    for (const suffix of commonSuffixes) {
      if (root.endsWith(suffix)) {
        root = root.slice(0, -suffix.length);
        break;
      }
    }
    return root;
  }

  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
}

// Simplified QualityMetrics class
class QualityMetrics {
  calculateMetrics(words: string[], pangrams: string[]) {
    const scores = {
      wordCount: words.length >= 60 ? 100 : (words.length / 60) * 100,
      pangramCount: pangrams.length > 0 && pangrams.length <= 3 ? 100 : 50,
      averageLength: this.calculateAverageLength(words)
    };

    return {
      qualityScore: (scores.wordCount * 0.5 + 
                     scores.pangramCount * 0.3 + 
                     scores.averageLength * 0.2)
    };
  }

  private calculateAverageLength(words: string[]): number {
    const avgLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    // Score between 0-100 based on ideal average length of 5.5
    const difference = Math.abs(avgLength - 5.5);
    return Math.max(0, 100 - (difference * 20));
  }
}