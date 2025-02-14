export const gameLogic = {
  isValidWord: (word: string, centerLetter: string, outerLetters: string[]): boolean => {
    if (word.length < 4) return false;
    if (!word.includes(centerLetter)) return false;

    const validLetters = [centerLetter, ...outerLetters];
    return word.split('').every(letter => validLetters.includes(letter));
  },

  calculateWordScore: (word: string, difficulty: 'easy' | 'normal' | 'hard'): number => {
    let baseScore = word.length === 4 ? 1 : word.length;

    // Apply difficulty multiplier
    const multipliers = {
      easy: 1,
      normal: 1.5,
      hard: 2
    };

    return Math.floor(baseScore * multipliers[difficulty]);
  },

  isPangram: (word: string, letters: string[]): boolean => {
    const uniqueLetters = new Set(word.split(''));
    return letters.every(letter => uniqueLetters.has(letter));
  },

  shuffleLetters: (letters: string[]): string[] => {
    return [...letters].sort(() => Math.random() - 0.5);
  },

  generateHint: (
    validWords: string[],
    foundWords: string[],
    type: 'random' | 'length' | 'pangram',
    availableLetters: string[] // Add this parameter
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
          gameLogic.isPangram(word, availableLetters) // Use gameLogic.isPangram and availableLetters
        );
        if (remainingPangrams.length > 0) {
          return "There's still a pangram to find!";
        }
        return null;
    }
  },

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