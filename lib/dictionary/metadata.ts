// lib/dictionary/metadata.ts

export interface WordMetadata {
    word: string;
    length: number;
    letters: string[];
    uniqueLetters: string[];
    letterCount: Record<string, number>;
    isPangram: boolean;
    isPangram7: boolean; // exactly 7 unique letters
    vowelCount: number;
    consonantCount: number;
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
  
      return {
        word: normalizedWord,
        length: normalizedWord.length,
        letters,
        uniqueLetters,
        letterCount,
        isPangram: uniqueLetters.length >= 7,
        isPangram7: uniqueLetters.length === 7,
        vowelCount,
        consonantCount
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
      
      // Must contain center letter
      if (!normalizedWord.includes(normalizedCenter)) {
        return false;
      }
  
      // All letters must be in allowed set
      const allowedLetters = [normalizedCenter, ...normalizedOuter];
      return normalizedWord.split('').every(letter => 
        allowedLetters.includes(letter)
      );
    },
  
    /**
     * Calculate word score based on game rules
     */
    calculateWordScore(word: string, isPangram: boolean): number {
      let score = word.length === 4 ? 1 : word.length;
      if (isPangram) {
        score += 7; // Pangram bonus
      }
      return score;
    },
  
    /**
     * Find potential center letters for a word
     */
    findPotentialCenterLetters(metadata: WordMetadata): string[] {
      // Center letter candidates should:
      // 1. Be common in the word set
      // 2. Typically be a consonant
      // 3. Not be too rare in English
      return metadata.uniqueLetters.filter(letter => {
        const frequency = metadata.letterCount[letter];
        const isVowel = ['a', 'e', 'i', 'o', 'u'].includes(letter);
        return frequency >= 1 && !isVowel;
      });
    }
  };