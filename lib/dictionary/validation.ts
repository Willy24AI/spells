export interface ValidationResult {
  isValid: boolean;
  error?: string;
  details?: {
    score?: number;
    isPangram?: boolean;
    isCommonWord?: boolean;
  };
}

export const validation = {
  /**
   * Validate a word submission in the game context
   */
  validateGameWord(
    word: string,
    centerLetter: string,
    outerLetters: string[],
    validWords: string[] = []
  ): ValidationResult {
    // Normalize inputs
    const normalizedWord = word.toLowerCase();
    const normalizedCenter = centerLetter.toLowerCase();
    const normalizedOuter = outerLetters.map(l => l.toLowerCase());
    
    // Check if word exists in valid words list
    if (validWords.length > 0 && !validWords.includes(normalizedWord)) {
      return {
        isValid: false,
        error: 'Not in word list'
      };
    }

    // Check minimum length
    if (normalizedWord.length < 4) {
      return {
        isValid: false,
        error: 'Word must be at least 4 letters long'
      };
    }

    // Check for center letter
    if (!normalizedWord.includes(normalizedCenter)) {
      return {
        isValid: false,
        error: 'Word must contain the center letter'
      };
    }

    // Check all letters are allowed
    const allowedLetters = new Set([normalizedCenter, ...normalizedOuter]);
    const hasInvalidLetter = normalizedWord
      .split('')
      .some(letter => !allowedLetters.has(letter));

    if (hasInvalidLetter) {
      return {
        isValid: false,
        error: 'Word contains invalid letters'
      };
    }

    // Calculate scoring details
    const uniqueLetters = new Set(normalizedWord);
    const isPangram = uniqueLetters.size >= 7;
    const isCommonWord = normalizedWord.length <= 5;
    const score = this.calculateWordScore(normalizedWord, isPangram);

    return { 
      isValid: true,
      details: {
        score,
        isPangram,
        isCommonWord
      }
    };
  },

  /**
   * Validate a word for dictionary inclusion
   */
  validateDictionaryWord(
    word: string,
    options: {
      minLength?: number;
      maxLength?: number;
      allowProperNouns?: boolean;
      requireVowels?: boolean;
      allowObscureLetters?: boolean;
      allowVariations?: boolean;
      minFrequency?: number;
    } = {}
  ): ValidationResult {
    const {
      minLength = 4,
      maxLength = 15,
      allowProperNouns = false,
      requireVowels = true,
      allowObscureLetters = true,
      allowVariations = true,
      minFrequency = 0
    } = options;

    // Check basic format
    if (!/^[a-zA-Z]+$/.test(word)) {
      return {
        isValid: false,
        error: 'Word must contain only letters'
      };
    }

    // Check length
    if (word.length < minLength) {
      return {
        isValid: false,
        error: `Word must be at least ${minLength} letters long`
      };
    }

    if (word.length > maxLength) {
      return {
        isValid: false,
        error: `Word cannot be longer than ${maxLength} letters`
      };
    }

    // Check proper nouns
    if (!allowProperNouns && /^[A-Z]/.test(word)) {
      return {
        isValid: false,
        error: 'Proper nouns are not allowed'
      };
    }

    // Check vowels
    if (requireVowels && !/[aeiou]/i.test(word)) {
      return {
        isValid: false,
        error: 'Word must contain at least one vowel'
      };
    }

    // Check for obscure letters
    if (!allowObscureLetters) {
      const obscureLetters = new Set(['j', 'q', 'x', 'z']);
      const hasObscureLetter = word.toLowerCase().split('').some(letter => 
        obscureLetters.has(letter)
      );
      if (hasObscureLetter) {
        return {
          isValid: false,
          error: 'Word contains obscure letters'
        };
      }
    }

    // Check if it's a variation (if not allowed)
    if (!allowVariations) {
      const commonEndings = ['s', 'ed', 'ing', 'er', 'est'];
      if (commonEndings.some(ending => word.toLowerCase().endsWith(ending))) {
        return {
          isValid: false,
          error: 'Word variations are not allowed'
        };
      }
    }

    return { isValid: true };
  },

  /**
   * Validate a potential pangram
   */
  validatePangram(
    word: string,
    {
      requireExactSeven = false,
      allowObscureLetters = true
    } = {}
  ): ValidationResult {
    const uniqueLetters = new Set(word.toLowerCase().split(''));
    
    if (requireExactSeven && uniqueLetters.size !== 7) {
      return {
        isValid: false,
        error: 'Word must contain exactly 7 unique letters'
      };
    }

    if (!requireExactSeven && uniqueLetters.size < 7) {
      return {
        isValid: false,
        error: 'Word must contain at least 7 unique letters'
      };
    }

    // Check for obscure letters if not allowed
    if (!allowObscureLetters) {
      const obscureLetters = new Set(['j', 'q', 'x', 'z']);
      const hasObscureLetter = Array.from(uniqueLetters).some(letter => 
        obscureLetters.has(letter)
      );
      if (hasObscureLetter) {
        return {
          isValid: false,
          error: 'Pangram contains obscure letters'
        };
      }
    }

    return { 
      isValid: true,
      details: {
        score: this.calculateWordScore(word, true)
      }
    };
  },

  /**
   * Calculate word score based on game rules
   */
  calculateWordScore(word: string, isPangram: boolean): number {
    let score = word.length === 4 ? 1 : word.length;
    if (isPangram) score += 7;
    return score;
  },

  /**
   * Check if a word is a common variation of another word
   */
  isWordVariation(word: string, baseWord: string): boolean {
    const commonEndings = ['s', 'ed', 'ing', 'er', 'est'];
    const normalizedWord = word.toLowerCase();
    const normalizedBase = baseWord.toLowerCase();

    // Direct match
    if (normalizedWord === normalizedBase) return true;

    // Check common endings
    return commonEndings.some(ending => {
      if (normalizedWord === normalizedBase + ending) return true;
      if (normalizedBase.endsWith('e') && ending === 'ing' && 
          normalizedWord === normalizedBase.slice(0, -1) + 'ing') return true;
      if (normalizedBase.endsWith('e') && ending === 'd' && 
          normalizedWord === normalizedBase + 'd') return true;
      return false;
    });
  }
};