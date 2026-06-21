import type { ValidationResponse } from '@/lib/types/game';

export const gameLogic = {
  // Validation is fully OFFLINE: the puzzle already ships with its complete word
  // list (valid_words), which was built from the dictionary at generation time.
  // Checking membership locally means no per-guess database round-trip, so the
  // game feels instant.
  validateWord(
    word: string,
    validWords: string[],
    pangrams: string[],
    options: {
      centerLetter: string;
      outerLetters: string[];
    }
  ): ValidationResponse {
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

    // The puzzle's word list is authoritative (and already a dictionary subset).
    const isValid = validWords.some(w => w.toLowerCase() === normalizedWord);
    if (!isValid) {
      return {
        valid: false,
        error: 'Not in word list'
      };
    }

    const isPangram = pangrams.some(p => p.toLowerCase() === normalizedWord);
    const score = this.calculateWordScore(normalizedWord, isPangram);

    return {
      valid: true,
      score,
      isPangram
    };
  },

  calculateWordScore(word: string, isPangram: boolean): number {
    // Standard Spelling Bee scoring, with NO difficulty multiplier so that
    // per-word points, the running total, and the puzzle's max score all agree:
    //   - 4-letter word        => 1 point
    //   - longer word          => 1 point per letter
    //   - pangram (all 7 used)  => +7 bonus
    let score = word.length === 4 ? 1 : word.length;
    if (isPangram) {
      score += 7;
    }
    return score;
  },

  isPangram(word: string, letters: string[]): boolean {
    const uniqueLetters = new Set(word.toLowerCase().split(''));
    return letters.every(letter => 
      uniqueLetters.has(letter.toLowerCase())
    );
  },

  shuffleLetters(letters: string[]): string[] {
    return [...letters].sort(() => Math.random() - 0.5);
  },

  generateHint(
    validWords: string[],
    foundWords: string[],
    type: 'random' | 'length' | 'pangram',
    availableLetters: string[]
  ): string | null {
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
          this.isPangram(word, availableLetters)
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

  getDifficultySettings(difficulty: 'easy' | 'normal' | 'hard') {
    return {
      easy: {
        hintsAllowed: 5,
        hintCooldown: 30,
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
    }[difficulty];
  },

  calculateTotalScore(
    validWords: string[],
    pangrams: string[]
  ): number {
    return validWords.reduce((total, word) => {
      const score = this.calculateWordScore(
        word,
        pangrams.includes(word.toLowerCase())
      );
      return total + score;
    }, 0);
  },

  isGameComplete(foundWords: string[], validWords: string[]): boolean {
    const normalizedFound = foundWords.map(w => w.toLowerCase());
    const normalizedValid = validWords.map(w => w.toLowerCase());
    return normalizedValid.every(word => normalizedFound.includes(word));
  }
};