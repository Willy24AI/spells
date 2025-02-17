import { WordList } from '../dictionary/wordList';
import { supabase } from '@/lib/db';
import type { 
  GeneratedPuzzle, 
  PuzzleMetrics, 
  PuzzleDifficulty 
} from '../types/puzzleGenerator';

export class PuzzleGenerator {
  private wordList: WordList;

  constructor(wordList: WordList) {
    this.wordList = wordList;
  }

  async generatePuzzle(targetDate?: string): Promise<GeneratedPuzzle> {
    const MAX_ATTEMPTS = 10;
    let attempts = 0;

    while (attempts < MAX_ATTEMPTS) {
      try {
        console.log(`Attempt ${attempts + 1} of ${MAX_ATTEMPTS}`);
        
        // Get pangrams from dictionary
        const pangrams = await this.wordList.findPangrams();
        console.log(`Found ${pangrams.length} pangrams`);

        if (!pangrams.length) {
          throw new Error('No pangrams found in dictionary');
        }

        // Select random pangram
        const pangram = pangrams[Math.floor(Math.random() * pangrams.length)];
        console.log(`Selected pangram: ${pangram}`);

        // Generate letter combinations
        const letters = Array.from(new Set(pangram.split('')));
        
        // Try each letter as the center letter
        let bestCenterLetter = letters[0];
        let bestOuterLetters = letters.filter(l => l !== bestCenterLetter);
        let maxValidWords = 0;
        let bestWords: string[] = [];

        for (const centerLetter of letters) {
          const outerLetters = letters.filter(l => l !== centerLetter);
          const validWords = await this.wordList.findValidWords(
            centerLetter,
            outerLetters,
            {
              minLength: 4,
              maxLength: 15
            }
          );

          if (validWords.length > maxValidWords) {
            maxValidWords = validWords.length;
            bestCenterLetter = centerLetter;
            bestOuterLetters = outerLetters;
            bestWords = validWords;
          }
        }

        // Only proceed if we have enough words
        if (bestWords.length >= 10) {
          // Calculate metrics
          const metrics: PuzzleMetrics = {
            totalWords: bestWords.length,
            wordCount: bestWords.length,
            uniqueLetters: 7,
            maxScore: this.calculateMaxScore(bestWords, [pangram]),
            pangramCount: 1,
            averageWordLength: bestWords.reduce((sum, w) => sum + w.length, 0) / bestWords.length,
            wordLengthDistribution: this.calculateWordLengthDistribution(bestWords),
            commonWordPercentage: (bestWords.filter(w => w.length <= 6).length / bestWords.length) * 100,
            difficultyScore: this.calculateDifficultyScore(bestWords, [pangram]),
            qualityScore: this.calculateQualityScore(bestWords, [pangram]),
            fourLetterWordCount: bestWords.filter(w => w.length === 4).length,
            fiveLetterWordCount: bestWords.filter(w => w.length === 5).length,
            longWordCount: bestWords.filter(w => w.length >= 7).length,
            wordFamilyCount: bestWords.length
          };

          // Create puzzle object
          const puzzle: GeneratedPuzzle = {
            id: `puzzle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            centerLetter: bestCenterLetter,
            outerLetters: bestOuterLetters,
            validWords: bestWords,
            pangrams: [pangram],
            maxScore: metrics.maxScore,
            qualityScore: metrics.qualityScore,
            wordCount: bestWords.length,
            commonWordCount: bestWords.filter(w => w.length <= 6).length,
            shortWordPercentage: (bestWords.filter(w => w.length <= 5).length / bestWords.length) * 100,
            averageWordLength: metrics.averageWordLength,
            wordLengthDistribution: metrics.wordLengthDistribution,
            difficulty: this.calculateDifficulty(metrics),
            stage: this.determineStage(metrics),
            metrics,
            dateGenerated: new Date().toISOString(),
            generatorVersion: '2.0.0',
            date: targetDate
          };

          return puzzle;
        }

        attempts++;
      } catch (error) {
        console.error('Error in generation attempt:', error);
        attempts++;
      }
    }

    throw new Error(`Failed to generate valid puzzle after ${MAX_ATTEMPTS} attempts`);
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

  private calculateQualityScore(words: string[], pangrams: string[]): number {
    const distribution = this.calculateWordLengthDistribution(words);
    const shortWordScore = ((distribution[4] || 0) + (distribution[5] || 0)) / words.length * 100;
    const pangramScore = Math.min(pangrams.length * 20, 100);
    const balanceScore = (1 - Math.abs(0.6 - shortWordScore / 100)) * 100;

    return Math.min(
      100,
      (shortWordScore * 0.4) +
      (pangramScore * 0.3) +
      (balanceScore * 0.3)
    );
  }


  private calculateDifficulty(metrics: PuzzleMetrics): PuzzleDifficulty {
    if (metrics.difficultyScore < 40) return 'easy';
    if (metrics.difficultyScore < 70) return 'medium';
    return 'hard';
  }

  private determineStage(metrics: PuzzleMetrics): 1 | 2 | 3 {
    if (metrics.qualityScore < 60) return 1;
    if (metrics.qualityScore < 80) return 2;
    return 3;
  }

  private shuffleLetters(letters: string[]): string[] {
    return [...letters].sort(() => Math.random() - 0.5);
  }

  private hasGoodLetterDistribution(letters: string[]): boolean {
    const vowels = 'aeiou';
    const vowelCount = letters.filter(l => vowels.includes(l.toLowerCase())).length;
    return vowelCount >= 2 && vowelCount <= 4; // Ensure balanced vowel count
  }

  private isGoodCenterLetter(letter: string, words: string[]): boolean {
    // Count how many words contain this letter
    const wordCount = words.filter(word => word.includes(letter.toLowerCase())).length;
    return wordCount >= words.length * 0.4; // Center letter should be in at least 40% of words
  }

  private async validatePuzzle(puzzle: GeneratedPuzzle): Promise<boolean> {
    if (!puzzle.centerLetter || !puzzle.outerLetters || !puzzle.validWords) {
      return false;
    }

    const allLetters = [puzzle.centerLetter, ...puzzle.outerLetters].map(l => l.toLowerCase());
    
    // Validate all words
    return puzzle.validWords.every(word => {
      // Must contain center letter
      if (!word.toLowerCase().includes(puzzle.centerLetter.toLowerCase())) {
        return false;
      }

      // Must only use allowed letters
      return word.toLowerCase().split('').every(letter => allLetters.includes(letter));
    });
  }

  private async optimizePuzzle(puzzle: GeneratedPuzzle): Promise<GeneratedPuzzle> {
    // Try different center letters to find the optimal one
    const allLetters = [puzzle.centerLetter, ...puzzle.outerLetters];
    let bestCenterLetter = puzzle.centerLetter;
    let maxWordCount = puzzle.validWords.length;

    for (const letter of allLetters) {
      const outerLetters = allLetters.filter(l => l !== letter);
      const words = await this.wordList.findValidWords(letter, outerLetters);
      
      if (words.length > maxWordCount && this.isGoodCenterLetter(letter, words)) {
        bestCenterLetter = letter;
        maxWordCount = words.length;
      }
    }

    // If we found a better center letter, update the puzzle
    if (bestCenterLetter !== puzzle.centerLetter) {
      const outerLetters = allLetters.filter(l => l !== bestCenterLetter);
      const words = await this.wordList.findValidWords(bestCenterLetter, outerLetters);
      
      return {
        ...puzzle,
        centerLetter: bestCenterLetter,
        outerLetters,
        validWords: words,
        wordCount: words.length,
        metrics: {
          ...puzzle.metrics,
          wordCount: words.length,
          totalWords: words.length
        }
      };
    }

    return puzzle;
  }
}