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
  wordFamily?: string;
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
    const isPangram7 = uniqueLetters.length >= 7;

    // Calculate if it's a common word based on length and common patterns
    const commonWord = this.isCommonWord(normalizedWord);

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
      points,
      wordFamily: this.getWordFamily(normalizedWord)
    };
  },

  isCommonWord(word: string): boolean {
    // Words of length 4-6 are generally more common
    if (word.length <= 6) return true;

    // Check for common word patterns
    const commonPatterns = [
      'ing$', 'ed$', 'er$', 's$', '^re', '^un',
      'able$', 'ment$', 'tion$', 'ness$'
    ];

    const hasCommonPattern = commonPatterns.some(pattern => 
      new RegExp(pattern).test(word)
    );

    return hasCommonPattern;
  },

  calculateWordScore(word: string, isPangram: boolean): number {
    // Base score
    let score = word.length === 4 ? 1 : word.length;
    
    // Pangram bonus
    if (isPangram) {
      score += 7;
    }
    
    return score;
  },

  getWordFamily(word: string): string {
    const suffixes = ['s', 'es', 'ed', 'ing', 'er', 'ers', 'est'];
    let base = word;

    // Handle special cases
    if (word.endsWith('ies')) {
      return word.slice(0, -3) + 'y';
    }

    if (word.endsWith('ing')) {
      // Check for double consonant
      const stem = word.slice(0, -3);
      if (stem.length > 1 && stem[stem.length - 1] === stem[stem.length - 2]) {
        return stem.slice(0, -1);
      }
      // Check for 'e' addition
      return stem + 'e';
    }

    // Remove common suffixes
    for (const suffix of suffixes) {
      if (word.endsWith(suffix)) {
        base = word.slice(0, -suffix.length);
        break;
      }
    }

    return base;
  }
};