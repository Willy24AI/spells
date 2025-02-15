import { puzzleService } from '@/lib/services/puzzleService';
import type { ValidationResponse } from '@/lib/types/game';

export const gameLogic = {
  /**
   * Validate a word submission
   */
  validateWord: async (
    word: string,
    puzzleId: string,
    options: {
      centerLetter: string;
      outerLetters: string[];
    }
  ): Promise<ValidationResponse> => {
    // Basic validation first
    if (word.length < 4) {
      return {
        valid: false,
        error: 'Word must be at least 4 letters long'
      };
    }

    const { centerLetter, outerLetters } = options;
    if (!word.includes(centerLetter)) {
      return {
        valid: false,
        error: 'Word must contain center letter'
      };
    }

    const validLetters = [centerLetter, ...outerLetters];
    const hasInvalidLetter = word
      .split('')
      .some(letter => !validLetters.includes(letter));

    if (hasInvalidLetter) {
      return {
        valid: false,
        error: 'Word contains invalid letters'
      };
    }

    // Check against puzzle's word list
    const validation = await puzzleService.validateWord(word, puzzleId);
    
    return {
      valid: validation.valid,
      score: validation.score,
      isPangram: validation.isPangram,
      error: validation.error
    };
  },

  /**
   * Calculate word score based on difficulty
   */
  calculateWordScore: (
    word: string, 
    difficulty: 'easy' | 'normal' | 'hard'
  ): number => {
    let baseScore = word.length === 4 ? 1 : word.length;

    // Apply difficulty multiplier
    const multipliers = {
      easy: 1,
      normal: 1.5,
      hard: 2
    };

    return Math.floor(baseScore * multipliers[difficulty]);
  },

  /**
   * Check if word is a pangram
   */
  isPangram: (word: string, letters: string[]): boolean => {
    const uniqueLetters = new Set(word.split(''));
    return letters.every(letter => uniqueLetters.has(letter));
  },

  /**
   * Shuffle letters for display
   */
  shuffleLetters: (letters: string[]): string[] => {
    return [...letters].sort(() => Math.random() - 0.5);
  },

  /**
   * Generate a hint
   */
  generateHint: (
    validWords: string[],
    foundWords: string[],
    type: 'random' | 'length' | 'pangram',
    availableLetters: string[]
  ): string | null => {
    const remainingWords = validWords.filter(word => !foundWords.includes(word));
    if (remainingWords.length === 0) return null;

    switch (type) {
      case 'random':
        const word = remainingWords[Math.floor(Math.random() * remainingWords.length)];
        return `There's a ${word.length}-letter word starting with "${word[0]}"`;

      case 'length':
        const longestRemaining = remainingWords.reduce((a, b) =>
          a.length > b.length ? a : b
        );
        return `Try finding a ${longestRemaining.length}-letter word!`;

      case 'pangram':
        const remainingPangrams = remainingWords.filter(word =>
          gameLogic.isPangram(word, availableLetters)
        );
        if (remainingPangrams.length > 0) {
          return "There's still a pangram to find!";
        }
        return null;
    }
  },

  /**
   * Get difficulty settings
   */
  getDifficultySettings: (difficulty: 'easy' | 'normal' | 'hard') => {
    const settings = {
      easy: {
        hintsAllowed: 5,
        hintCooldown: 30, // seconds
        scoreMultiplier: 1,
        showLetterCount: true
      },
      normal: {
        hintsAllowed: 3,
        hintCooldown: 60,
        scoreMultiplier: 1.5,
        showLetterCount: false
      },
      hard: {
        hintsAllowed: 1,
        hintCooldown: 120,
        scoreMultiplier: 2,
        showLetterCount: false
      }
    };

    return settings[difficulty];
  }
};