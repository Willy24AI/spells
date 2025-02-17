// lib/dictionary/metadata.ts

export interface WordMetadata {
  word: string;
  length: number;
  letters: string[];
  uniqueLetters: string[];
  letterCount: Record<string, number>;
  isPangram: boolean;
  isPangram7: boolean;
  vowelCount: number;
  consonantCount: number;
  commonWord: boolean;
  points: number;
}

export const metadata = {
  calculateWordMetadata(word: string): WordMetadata {
    const normalizedWord = word.toLowerCase();
    const letters = normalizedWord.split('');
    const uniqueLetters = Array.from(new Set(letters));
    
    // Calculate letter frequency
    const letterCount = letters.reduce((acc, letter) => {
      acc[letter] = (acc[letter] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Count vowels and consonants
    const vowels = ['a', 'e', 'i', 'o', 'u'];
    const vowelCount = letters.filter(l => vowels.includes(l)).length;
    const consonantCount = letters.length - vowelCount;
    
    // Determine if it's a pangram
    const isPangram = uniqueLetters.length >= 6;
    const isPangram7 = uniqueLetters.length === 7;

    // Calculate if it's a common word based on length only
    const commonWord = normalizedWord.length <= 6;

    // Calculate points
    const points = this.calculateWordScore(normalizedWord, isPangram7);

    return {
      word: normalizedWord,
      length: normalizedWord.length,
      letters,
      uniqueLetters,
      letterCount,
      isPangram,
      isPangram7,
      vowelCount,
      consonantCount,
      commonWord,
      points
    };
  },

  calculateWordScore(word: string, isPangram: boolean): number {
    // Base score
    let score = word.length === 4 ? 1 : word.length;
    
    // Pangram bonus
    if (isPangram) {
      score += 7;
    }
    
    return score;
  }
};