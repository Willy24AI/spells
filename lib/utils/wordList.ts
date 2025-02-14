// This would be replaced with a proper word list in production
export const wordList = {
  isValidWord: (word: string): boolean => {
    // In production, this would check against a real dictionary
    const commonWords = new Set([
      'BOUNCE', 'BOUND', 'CODE', 'CONE', 'CUBE',
      'DANCE', 'DONE', 'DUNCE', 'ONCE', 'OUNCE'
    ]);
    
    return commonWords.has(word.toUpperCase());
  },

  getWordScore: (word: string): number => {
    if (word.length === 4) return 1;
    return word.length;
  }
};