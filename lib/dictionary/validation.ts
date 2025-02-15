// lib/dictionary/validation.ts

export interface ValidationResult {
    isValid: boolean;
    error?: string;
  }
  
  export const validation = {
    /**
     * Validate a word submission in the game context
     */
    validateGameWord(
      word: string,
      centerLetter: string,
      outerLetters: string[]
    ): ValidationResult {
      // Normalize inputs
      const normalizedWord = word.toLowerCase();
      const normalizedCenter = centerLetter.toLowerCase();
      const normalizedOuter = outerLetters.map(l => l.toLowerCase());
      
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
  
      return { isValid: true };
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
      } = {}
    ): ValidationResult {
      const {
        minLength = 4,
        maxLength = 15,
        allowProperNouns = false,
        requireVowels = true,
        allowObscureLetters = true
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
      if (!allowProperNouns && word[0] === word[0].toUpperCase()) {
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
        if (word.toLowerCase().split('').some(letter => obscureLetters.has(letter))) {
          return {
            isValid: false,
            error: 'Word contains obscure letters'
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
      requireExactSeven: boolean = true
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
  
      return { isValid: true };
    }
  };