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
  points: number;
}

export const metadata = {
  /**
   * Calculate metadata for a single word
   */
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
    
    // More lenient pangram definition
    const isPangram = uniqueLetters.length >= 6; // Was 7
    const isPangram7 = uniqueLetters.length >= 7; // Was exactly 7

    // Calculate points with bonus for longer words
    const points = this.calculateWordScore(normalizedWord, isPangram);

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
      points
    };
  },

  /**
   * Check if a word could be part of a puzzle with given center and outer letters
   */
  isValidForPuzzle(
    word: string, 
    centerLetter: string, 
    outerLetters: string[]
  ): boolean {
    const normalizedWord = word.toLowerCase();
    const normalizedCenter = centerLetter.toLowerCase();
    const normalizedOuter = outerLetters.map(l => l.toLowerCase());
    
    // Basic validation
    if (normalizedWord.length < 4) return false;
    
    // Must contain center letter
    if (!normalizedWord.includes(normalizedCenter)) {
      return false;
    }

    // Count how many times each letter is used
    const wordLetters = normalizedWord.split('');
    const letterCounts: Record<string, number> = {};
    
    for (const letter of wordLetters) {
      letterCounts[letter] = (letterCounts[letter] || 0) + 1;
    }

    // All letters must be in allowed set
    const allowedLetters = [normalizedCenter, ...normalizedOuter];
    return wordLetters.every(letter => allowedLetters.includes(letter));
  },

  /**
   * Calculate word score based on game rules
   */
  calculateWordScore(word: string, isPangram: boolean): number {
    // Base score
    let score = word.length === 4 ? 1 : word.length;
    
    // Pangram bonus
    if (isPangram) {
      score += 7;
    }
    
    // Bonus for longer words
    if (word.length >= 6) {
      score += Math.floor((word.length - 5) * 0.5);
    }
    
    return score;
  },

  /**
   * Find potential center letters for a word
   */
  findPotentialCenterLetters(metadata: WordMetadata): string[] {
    const commonConsonants = ['t', 'n', 's', 'h', 'r', 'l', 'd'];
    const vowels = ['a', 'e', 'i', 'o', 'u'];
    
    return metadata.uniqueLetters.filter(letter => {
      const frequency = metadata.letterCount[letter];
      const isVowel = vowels.includes(letter);
      const isCommonConsonant = commonConsonants.includes(letter);
      
      // Prefer common consonants, but allow vowels if they appear multiple times
      return (isCommonConsonant && frequency >= 1) || 
             (isVowel && frequency >= 2) ||
             (!isVowel && !isCommonConsonant && frequency >= 1);
    });
  }
};