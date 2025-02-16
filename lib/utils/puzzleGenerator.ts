// lib/utils/puzzleGenerator.ts

import { WordList } from '../dictionary/wordList';
import { metadata } from '../dictionary/metadata';
import { 
  GeneratedPuzzle, 
  GeneratorOptions, 
  GenerationResult,
  PuzzleMetrics,
  DifficultySettings
} from '../types/puzzleGenerator';

// Define difficulty settings
const DIFFICULTY_SETTINGS: DifficultySettings = {
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

export const puzzleGenerator = {
  async generatePuzzle(
    wordList: WordList,
    options: GeneratorOptions = {}
  ): Promise<GenerationResult> {
    const startTime = Date.now();
    const attempts: { reason: string; metrics: Partial<PuzzleMetrics> }[] = [];
    
    const {
      minQualityScore = 70,
      minWordCount = 30,
      minPangrams = 1,
      preferCommonWords = true,
      maxAttempts = 100,
      stage = 1,
      targetDifficulty = 'medium'
    } = options;

    const difficultySettings = DIFFICULTY_SETTINGS[targetDifficulty];

    try {
      // Get all pangrams
      const pangrams = await wordList.findPangrams();
      if (!pangrams.length) {
        return {
          puzzle: this.createEmptyPuzzle(), // Return empty puzzle instead of null
          attempts: 0,
          generationTime: Date.now() - startTime,
          error: 'No pangrams found in dictionary',
          rejectedAttempts: attempts
        };
      }

      // Try different pangrams until we find a valid puzzle
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const pangram = pangrams[Math.floor(Math.random() * pangrams.length)];
        
        // Generate letter combinations
        const letters = Array.from(new Set(pangram.split('')));
        const centerLetter = letters[Math.floor(Math.random() * letters.length)];
        const outerLetters = letters.filter(l => l !== centerLetter);

        // Find valid words
        const validWords = await wordList.findValidWords(
          centerLetter,
          outerLetters,
          {
            minLength: 4,
            maxLength: difficultySettings.maxWordLength,
            minFrequency: difficultySettings.minFrequency,
            includeVariations: true
          }
        );

        // Calculate metrics
        const metrics = this.calculatePuzzleMetrics(validWords, pangrams);

        // Check if puzzle meets requirements
        if (!this.validatePuzzleRequirements(metrics, {
          minWordCount,
          minQualityScore,
          minPangrams,
          difficultySettings
        })) {
          attempts.push({
            reason: 'Failed requirements check',
            metrics
          });
          continue;
        }

        // Create puzzle object
        const puzzle: GeneratedPuzzle = {
          id: this.generatePuzzleId(),
          centerLetter,
          outerLetters,
          validWords,
          pangrams: pangrams.filter(p => validWords.includes(p)),
          maxScore: this.calculateMaxScore(validWords, pangrams),
          qualityScore: metrics.qualityScore,
          wordCount: validWords.length,
          averageWordLength: metrics.averageWordLength,
          wordLengthDistribution: metrics.wordLengthDistribution,
          commonWordCount: metrics.fourLetterWordCount + metrics.fiveLetterWordCount,
          shortWordPercentage: (metrics.fourLetterWordCount + metrics.fiveLetterWordCount) / validWords.length,
          difficulty: targetDifficulty,
          stage,
          metrics,
          dateGenerated: new Date().toISOString(),
          generatorVersion: '2.0.0'
        };

        return {
          puzzle,
          attempts: attempt + 1,
          generationTime: Date.now() - startTime,
          rejectedAttempts: attempts
        };
      }

      return {
        puzzle: this.createEmptyPuzzle(), // Return empty puzzle instead of null
        attempts: maxAttempts,
        generationTime: Date.now() - startTime,
        error: `Failed to generate valid puzzle after ${maxAttempts} attempts`,
        rejectedAttempts: attempts
      };
    } catch (err) {
      const error = err as Error; // Type assertion for error
      return {
        puzzle: this.createEmptyPuzzle(), // Return empty puzzle instead of null
        attempts: maxAttempts,
        generationTime: Date.now() - startTime,
        error: error.message || 'Unknown error occurred',
        rejectedAttempts: attempts
      };
    }
  },

  // Helper method to create an empty puzzle
  createEmptyPuzzle(): GeneratedPuzzle {
    return {
      id: this.generatePuzzleId(),
      centerLetter: '',
      outerLetters: [],
      validWords: [],
      pangrams: [],
      maxScore: 0,
      qualityScore: 0,
      wordCount: 0,
      averageWordLength: 0,
      wordLengthDistribution: {},
      commonWordCount: 0,
      shortWordPercentage: 0,
      difficulty: 'medium',
      stage: 1,
      metrics: {
        totalWords: 0,
        maxScore: 0,
        pangramCount: 0,
        averageWordLength: 0,
        wordLengthDistribution: {},
        commonWordPercentage: 0,
        difficultyScore: 0,
        qualityScore: 0,
        fourLetterWordCount: 0,
        fiveLetterWordCount: 0,
        longWordCount: 0,
        wordFamilyCount: 0
      },
      dateGenerated: new Date().toISOString(),
      generatorVersion: '2.0.0'
    };
  },

  validatePuzzle(puzzle: GeneratedPuzzle): boolean {
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
  },

  calculatePuzzleMetrics(words: string[], pangrams: string[]): PuzzleMetrics {
    const wordLengthDistribution = words.reduce((acc, word) => {
      acc[word.length] = (acc[word.length] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return {
      totalWords: words.length,
      maxScore: this.calculateMaxScore(words, pangrams),
      pangramCount: pangrams.filter(p => words.includes(p)).length,
      averageWordLength: words.reduce((sum, word) => sum + word.length, 0) / words.length,
      wordLengthDistribution,
      commonWordPercentage: ((wordLengthDistribution[4] || 0) + (wordLengthDistribution[5] || 0)) / words.length * 100,
      difficultyScore: this.calculateDifficultyScore(words, pangrams, wordLengthDistribution),
      qualityScore: this.calculateQualityScore(words, pangrams, wordLengthDistribution),
      fourLetterWordCount: wordLengthDistribution[4] || 0,
      fiveLetterWordCount: wordLengthDistribution[5] || 0,
      longWordCount: Object.entries(wordLengthDistribution)
        .filter(([length]) => parseInt(length) >= 7)
        .reduce((sum, [_, count]) => sum + count, 0),
      wordFamilyCount: this.countWordFamilies(words)
    };
  },

  validatePuzzleRequirements(
    metrics: PuzzleMetrics,
    requirements: {
      minWordCount: number;
      minQualityScore: number;
      minPangrams: number;
      difficultySettings: DifficultySettings['easy' | 'medium' | 'hard'];
    }
  ): boolean {
    return (
      metrics.totalWords >= requirements.minWordCount &&
      metrics.qualityScore >= requirements.minQualityScore &&
      metrics.pangramCount >= requirements.minPangrams &&
      ((metrics.fourLetterWordCount + metrics.fiveLetterWordCount) / metrics.totalWords) >= 
        requirements.difficultySettings.targetShortWordPercentage
    );
  },

  calculateMaxScore(words: string[], pangrams: string[]): number {
    return words.reduce((total, word) => {
      let score = word.length === 4 ? 1 : word.length;
      if (pangrams.includes(word)) score += 7;
      return total + score;
    }, 0);
  },

  calculateDifficultyScore(
    words: string[],
    pangrams: string[],
    distribution: Record<number, number>
  ): number {
    const total = words.length;
    const shortWordRatio = ((distribution[4] || 0) + (distribution[5] || 0)) / total;
    const longWordRatio = Object.entries(distribution)
      .filter(([length]) => parseInt(length) >= 7)
      .reduce((sum, [_, count]) => sum + count, 0) / total;
    
    return Math.min(
      100,
      (shortWordRatio * 40) +
      (longWordRatio * 30) +
      (pangrams.length * 10) +
      ((1 - Math.abs(0.6 - shortWordRatio)) * 20)
    );
  },

  calculateQualityScore(
    words: string[],
    pangrams: string[],
    distribution: Record<number, number>
  ): number {
    const total = words.length;
    const shortWordScore = ((distribution[4] || 0) + (distribution[5] || 0)) / total * 100;
    const pangramScore = Math.min(pangrams.length * 20, 100);
    const balanceScore = (1 - Math.abs(0.6 - shortWordScore / 100)) * 100;

    return Math.min(
      100,
      (shortWordScore * 0.4) +
      (pangramScore * 0.3) +
      (balanceScore * 0.3)
    );
  },

  countWordFamilies(words: string[]): number {
    // Using a simple implementation since metadata.getBaseForm is not available
    const families = new Set<string>();
    words.forEach(word => {
      // Simple base form extraction
      let base = word.toLowerCase();
      if (base.endsWith('s')) base = base.slice(0, -1);
      if (base.endsWith('ing')) base = base.slice(0, -3);
      if (base.endsWith('ed')) base = base.slice(0, -2);
      families.add(base);
    });
    return families.size;
  },

  generatePuzzleId(): string {
    return `puzzle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
};