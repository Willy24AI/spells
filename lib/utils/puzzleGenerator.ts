export const puzzleGenerator = {
  generatePuzzle: (seed: string) => {
    // In a real application, this would:
    // 1. Use the seed to generate a deterministic puzzle
    // 2. Ensure the puzzle has valid words
    // 3. Include pangrams
    // 4. Balance difficulty
    
    // This is a simplified example
    return {
      centerLetter: 'E',
      outerLetters: ['B', 'C', 'D', 'N', 'O', 'U'],
      validWords: [
        'BOUNCE', 'BOUND', 'CODE', 'CONE', 'CUBE',
        'DANCE', 'DONE', 'DUNCE', 'ONCE', 'OUNCE'
      ],
      pangrams: ['BOUNCE']
    };
  },

  validatePuzzle: (puzzle: {
    centerLetter: string;
    outerLetters: string[];
    validWords: string[];
    pangrams: string[];
  }) => {
    // Validate puzzle properties
    if (!puzzle.centerLetter || !puzzle.outerLetters || !puzzle.validWords) {
      return false;
    }

    // Check if all words are valid
    const allLetters = [puzzle.centerLetter, ...puzzle.outerLetters];
    return puzzle.validWords.every(word => 
      word.split('').every(letter => allLetters.includes(letter))
    );
  }
};