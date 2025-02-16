// lib/utils/gameLogic.ts

import type { ValidationResponse } from '@/lib/types/game';

export const gameLogic = {
  /**
   * Validate a word submission
   */
  validateWord: async (
    word: string,
    validWords: string[],
    pangrams: string[],
    options: {
      centerLetter: string;
      outerLetters: string[];
    }
  ): Promise<ValidationResponse> => {
    // Convert everything to lowercase for comparison
    const normalizedWord = word.toLowerCase();
    const centerLetter = options.centerLetter.toLowerCase();
    const outerLetters = options.outerLetters.map(l => l.toLowerCase());
    
    // Basic validation first
    if (normalizedWord.length < 4) {
      return {
        valid: false,
        error: 'Word must be at least 4 letters long'
      };
    }

    if (!normalizedWord.includes(centerLetter)) {
      return {
        valid: false,
        error: 'Word must contain center letter'
      };
    }

    const validLetters = [centerLetter, ...outerLetters];
    const hasInvalidLetter = normalizedWord
      .split('')
      .some(letter => !validLetters.includes(letter));

    if (hasInvalidLetter) {
      return {
        valid: false,
        error: 'Word contains invalid letters'
      };
    }

    // Check if word is in valid words list
    const isValid = validWords.includes(normalizedWord);
    if (!isValid) {
      return {
        valid: false,
        error: 'Word not in puzzle list'
      };
    }

    // Check if word is a pangram
    const isPangram = pangrams.includes(normalizedWord);

    // Calculate score
    let score = normalizedWord.length === 4 ? 1 : normalizedWord.length;
    if (isPangram) {
      score += 7; // Pangram bonus
    }

    return {
      valid: true,
      score,
      isPangram
    };
  },

  /**
   * Calculate word score based on difficulty
   */
  calculateWordScore: (
    word: string, 
    isPangram: boolean,
    difficulty: 'easy' | 'normal' | 'hard' = 'normal'
  ): number => {
    // Base score: 1 point for 4-letter words, word length for longer words
    let baseScore = word.length === 4 ? 1 : word.length;
    
    // Pangram bonus
    if (isPangram) {
      baseScore += 7;
    }

    // Apply difficulty multiplier
    const multipliers = {
      easy: 1,
      normal: 1.5,
      hard: 2
    };

    return Math.floor(baseScore * multipliers[difficulty]);
  },

  /**
   * Check if word is a pangram (uses all letters)
   */
  isPangram: (word: string, letters: string[]): boolean => {
    const uniqueLetters = new Set(word.toLowerCase().split(''));
    return letters.every(letter => 
      uniqueLetters.has(letter.toLowerCase())
    );
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
    const remainingWords = validWords.filter(word => 
      !foundWords.includes(word.toLowerCase())
    );
    
    if (remainingWords.length === 0) return null;

    switch (type) {
      case 'random': {
        const word = remainingWords[Math.floor(Math.random() * remainingWords.length)];
        return `There's a ${word.length}-letter word starting with "${word[0].toUpperCase()}"`;
      }

      case 'length': {
        const longestRemaining = remainingWords.reduce((a, b) =>
          a.length > b.length ? a : b
        );
        return `Try finding a ${longestRemaining.length}-letter word!`;
      }

      case 'pangram': {
        const remainingPangrams = remainingWords.filter(word =>
          gameLogic.isPangram(word, availableLetters)
        );
        if (remainingPangrams.length > 0) {
          return "There's still a pangram to find!";
        }
        return null;
      }

      default:
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
  },

  /**
   * Calculate total possible score for a puzzle
   */
  calculateTotalScore: (
    validWords: string[], 
    pangrams: string[],
    difficulty: 'easy' | 'normal' | 'hard' = 'normal'
  ): number => {
    return validWords.reduce((total, word) => {
      const score = gameLogic.calculateWordScore(
        word,
        pangrams.includes(word.toLowerCase()),
        difficulty
      );
      return total + score;
    }, 0);
  },

  /**
   * Check if game is complete
   */
  isGameComplete: (foundWords: string[], validWords: string[]): boolean => {
    const normalizedFound = foundWords.map(w => w.toLowerCase());
    const normalizedValid = validWords.map(w => w.toLowerCase());
    return normalizedValid.every(word => normalizedFound.includes(word));
  }
};