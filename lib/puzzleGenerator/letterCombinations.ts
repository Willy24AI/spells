// lib/puzzleGenerator/letterCombinations.ts

interface LetterSet {
  centerLetter: string;
  outerLetters: string[];
  score: number;
  vowelCount: number;
  consonantCount: number;
  commonLetterScore: number;
}

interface LetterFrequencies {
  [key: string]: number;
}

export const letterCombinations = {
  // Letter frequencies in English, based on modern usage
  letterFrequencies: {
    'e': 12.7, 't': 9.1, 'a': 8.2, 'o': 7.5, 'i': 7.0,
    'n': 6.7, 's': 6.3, 'h': 6.1, 'r': 6.0, 'd': 4.3,
    'l': 4.0, 'u': 2.8, 'c': 2.8, 'm': 2.4, 'w': 2.4,
    'f': 2.2, 'g': 2.0, 'y': 2.0, 'p': 1.9, 'b': 1.5,
    'v': 1.0, 'k': 0.8, 'j': 0.15, 'x': 0.15, 'q': 0.10,
    'z': 0.07
  } as LetterFrequencies,

  /**
   * Generate all possible letter combinations from a pangram
   */
  generateFromPangram(pangram: string): LetterSet[] {
    const uniqueLetters = Array.from(new Set(pangram.toLowerCase()));
    if (uniqueLetters.length !== 7) return [];

    const combinations: LetterSet[] = [];
    
    // Try each letter as center
    for (const centerLetter of uniqueLetters) {
      const outerLetters = uniqueLetters.filter(l => l !== centerLetter);
      
      // Score the letter set
      const score = this.scoreLetterSet(centerLetter, outerLetters);
      
      combinations.push({
        centerLetter,
        outerLetters,
        score: score.score,
        vowelCount: score.vowelCount,
        consonantCount: score.consonantCount,
        commonLetterScore: score.commonLetterScore
      });
    }

    // Sort by total score
    return combinations.sort((a, b) => b.score - a.score);
  },

  /**
   * Score a letter set based on multiple factors
   */
  scoreLetterSet(
    centerLetter: string,
    outerLetters: string[]
  ): {
    score: number;
    vowelCount: number;
    consonantCount: number;
    commonLetterScore: number;
  } {
    const vowels = ['a', 'e', 'i', 'o', 'u'];
    const commonConsonants = ['t', 'n', 's', 'r', 'l', 'd'];
    const allLetters = [centerLetter, ...outerLetters];
    
    // Count vowels and consonants
    const vowelCount = allLetters.filter(l => vowels.includes(l)).length;
    const consonantCount = 7 - vowelCount;
    
    // Calculate letter frequency score
    const commonLetterScore = allLetters.reduce(
      (sum, letter) => sum + (this.letterFrequencies[letter] || 0),
      0
    );

    // Score various factors
    const vowelScore = this.scoreVowelBalance(vowelCount);
    const consonantScore = this.scoreConsonants(allLetters, commonConsonants);
    const centerScore = this.scoreCenterLetter(centerLetter, vowels);
    const balanceScore = this.scoreLetterBalance(vowelCount, consonantCount);
    
    const totalScore = vowelScore + consonantScore + centerScore + balanceScore;

    return {
      score: totalScore,
      vowelCount,
      consonantCount,
      commonLetterScore
    };
  },

  /**
   * Score the vowel balance (prefer 2-3 vowels)
   */
  scoreVowelBalance(vowelCount: number): number {
    const idealVowelCount = 3;
    const difference = Math.abs(idealVowelCount - vowelCount);
    return Math.max(0, 100 - (difference * 30));
  },

  /**
   * Score consonants (prefer common consonants)
   */
  scoreConsonants(letters: string[], commonConsonants: string[]): number {
    const commonCount = letters.filter(l => commonConsonants.includes(l)).length;
    return commonCount * 15;
  },

  /**
   * Score center letter (prefer common letters but allow vowels)
   */
  scoreCenterLetter(letter: string, vowels: string[]): number {
    const isVowel = vowels.includes(letter);
    const frequencyScore = (this.letterFrequencies[letter] || 0) * 10;
    return isVowel ? frequencyScore * 0.8 : frequencyScore;
  },

  /**
   * Score letter balance
   */
  scoreLetterBalance(vowelCount: number, consonantCount: number): number {
    return vowelCount >= 2 && consonantCount >= 4 ? 50 : 0;
  },

  /**
   * Get optimal ordering of outer letters for display
   */
  getOptimalOrdering(centerLetter: string, outerLetters: string[]): string[] {
    const vowels = ['a', 'e', 'i', 'o', 'u'];
    
    // Sort letters to alternate vowels and consonants when possible
    return [...outerLetters].sort((a, b) => {
      const aIsVowel = vowels.includes(a);
      const bIsVowel = vowels.includes(b);
      
      if (aIsVowel !== bIsVowel) {
        return aIsVowel ? -1 : 1;
      }
      
      return (this.letterFrequencies[b] || 0) - (this.letterFrequencies[a] || 0);
    });
  }
};