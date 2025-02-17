import { supabase } from '@/lib/db';

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
  async validateGameWord(
    word: string,
    centerLetter: string,
    outerLetters: string[],
    validWords: string[] = []
  ): Promise<ValidationResult> {
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

    // Check if word exists in dictionary
    const { data: dictWord } = await supabase
      .from('words')
      .select('isPangram, points')
      .eq('word', normalizedWord)
      .single();

    if (!dictWord) {
      return {
        isValid: false,
        error: 'Word not found in dictionary'
      };
    }

    // Check if word is in valid words list
    if (validWords.length > 0 && !validWords.includes(normalizedWord)) {
      return {
        isValid: false,
        error: 'Not in puzzle word list'
      };
    }

    return { 
      isValid: true,
      details: {
        score: dictWord.points,
        isPangram: dictWord.isPangram,
        isCommonWord: normalizedWord.length <= 5
      }
    };
  },

  /**
   * Validate a word for dictionary inclusion
   */
  async validateDictionaryWord(
    word: string,
    options: {
      minLength?: number;
      maxLength?: number;
      requireVowels?: boolean;
      allowObscureLetters?: boolean;
    } = {}
  ): Promise<ValidationResult> {
    const {
      minLength = 4,
      maxLength = 15,
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

    // Check if word exists in dictionary
    const { data: dictWord } = await supabase
      .from('words')
      .select('*')
      .eq('word', word.toLowerCase())
      .single();

    if (!dictWord) {
      return {
        isValid: false,
        error: 'Word not found in dictionary'
      };
    }

    return { 
      isValid: true,
      details: {
        score: dictWord.points,
        isPangram: dictWord.isPangram
      }
    };
  },

  /**
   * Validate a potential pangram
   */
  validatePangram(word: string): ValidationResult {
    const uniqueLetters = new Set(word.toLowerCase().split(''));
    
    if (uniqueLetters.size !== 7) {
      return {
        isValid: false,
        error: 'Word must contain exactly 7 unique letters'
      };
    }

    return { 
      isValid: true,
      details: {
        score: word.length + 7 // Pangram bonus
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
  }
};