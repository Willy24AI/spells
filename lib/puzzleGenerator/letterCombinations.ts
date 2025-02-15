interface LetterSetScore {
    centerLetter: string;
    outerLetters: string[];
    score: number;
    vowelCount: number;
    consonantCount: number;
    commonLetterScore: number;
  }
  
  type LetterFrequencies = {
    [key: string]: number;
  };
  
  export const letterCombinations = {
    // Common letter frequencies in English
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
    generateFromPangram(pangram: string): LetterSetScore[] {
      const uniqueLetters = Array.from(new Set(pangram.toLowerCase()));
      if (uniqueLetters.length !== 7) {
        return [];
      }
  
      const combinations: LetterSetScore[] = [];
  
      // Try each letter as center
      for (const centerLetter of uniqueLetters) {
        const outerLetters = uniqueLetters.filter(l => l !== centerLetter);
        const score = this.scoreLetterSet(centerLetter, outerLetters);
        combinations.push({
          centerLetter,
          outerLetters,
          ...score
        });
      }
  
      return combinations.sort((a, b) => b.score - a.score);
    },
  
    /**
     * Score a letter set based on various factors
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
      const allLetters = [centerLetter, ...outerLetters];
  
      // Count vowels and consonants
      const vowelCount = allLetters.filter(l => vowels.includes(l)).length;
      const consonantCount = 7 - vowelCount;
  
      // Calculate letter frequency score
      const commonLetterScore = allLetters.reduce(
        (sum, letter) => sum + (this.letterFrequencies[letter] || 0),
        0
      );
  
      // Ideal ranges:
      // - 2-3 vowels
      // - Center letter should be common
      // - Mix of common and less common letters
      const vowelScore = Math.abs(2.5 - vowelCount) * -10;
      const centerScore = this.letterFrequencies[centerLetter] * 2;
  
      const score = vowelScore + centerScore + commonLetterScore;
  
      return {
        score,
        vowelCount,
        consonantCount,
        commonLetterScore
      };
    },
  
    /**
     * Get optimal letter ordering for display
     */
    getOptimalOrdering(
      centerLetter: string,
      outerLetters: string[]
    ): string[] {
      // Order outer letters to alternate vowels and consonants
      // and distribute common letters evenly
      const vowels = ['a', 'e', 'i', 'o', 'u'];
      const ordered = [...outerLetters].sort((a, b) => {
        const aIsVowel = vowels.includes(a);
        const bIsVowel = vowels.includes(b);
        if (aIsVowel !== bIsVowel) {
          return aIsVowel ? -1 : 1;
        }
        return (this.letterFrequencies[b] || 0) - (this.letterFrequencies[a] || 0);
      });
  
      // Shuffle slightly to avoid predictable patterns
      for (let i = ordered.length - 1; i > 0; i--) {
        if (Math.random() < 0.3) { // 30% chance to swap
          const j = Math.floor(Math.random() * (i + 1));
          [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
        }
      }
  
      return ordered;
    }
  };