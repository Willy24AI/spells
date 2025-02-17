// lib/dictionary/filters.ts

interface FilterOptions {
  minLength?: number;
  maxLength?: number;
  checkProperNouns?: boolean;
  requireVowels?: boolean;
  allowObscureLetters?: boolean;
  allowVariations?: boolean;
  allowCompounds?: boolean;
  minFrequency?: number;
}

export const filters = {
  /**
   * Apply all filters to a word
   */
  applyAll(word: string, options: FilterOptions = {}): boolean {
    const {
      minLength = 4,
      maxLength = 15,
      checkProperNouns = true,
      requireVowels = true,
      allowObscureLetters = true,
      allowVariations = true,
      allowCompounds = true,
      minFrequency = 0
    } = options;

    // Basic validation
    if (!this.lettersOnly(word)) return false;
    if (!this.checkLength(word, minLength, maxLength)) return false;
    if (checkProperNouns && !this.notProperNoun(word)) return false;
    if (requireVowels && !this.hasVowel(word)) return false;
    if (!allowObscureLetters && !this.noObscureLetters(word)) return false;
    
    // Additional checks for variations and compounds
    if (!allowVariations && this.isVariation(word)) return false;
    if (!allowCompounds && this.isCompound(word)) return false;

    return true;
  },

  /**
   * Check if word contains only letters
   */
  lettersOnly(word: string): boolean {
    return /^[a-zA-Z]+$/.test(word);
  },

  /**
   * Check word length
   */
  checkLength(word: string, min: number, max: number): boolean {
    return word.length >= min && word.length <= max;
  },

  /**
   * Check if word is not a proper noun
   */
  notProperNoun(word: string): boolean {
    return word === word.toLowerCase();
  },

  /**
   * Check if word has at least one vowel
   */
  hasVowel(word: string): boolean {
    return /[aeiou]/i.test(word);
  },

  /**
   * Check if word doesn't contain obscure letters
   */
  noObscureLetters(word: string): boolean {
    return !/[jqxz]/i.test(word);
  },

  /**
   * Check if word is a variation of another word
   */
  isVariation(word: string): boolean {
    const commonSuffixes = ['s', 'es', 'ed', 'ing', 'er', 'est'];
    return commonSuffixes.some(suffix => word.toLowerCase().endsWith(suffix));
  },

  /**
   * Check if word is a compound word
   */
  isCompound(word: string): boolean {
    // Simple check for compound words based on length and patterns
    if (word.length < 6) return false;

    const commonJoins = ['back', 'down', 'up', 'out', 'over', 'under'];
    return commonJoins.some(join => word.includes(join));
  },

  /**
   * Validate a word for puzzle inclusion
   */
  validateForPuzzle(
    word: string,
    centerLetter: string,
    outerLetters: string[]
  ): boolean {
    const normalizedWord = word.toLowerCase();
    const normalizedCenter = centerLetter.toLowerCase();
    const allowedLetters = [normalizedCenter, ...outerLetters.map(l => l.toLowerCase())];

    // Must contain center letter
    if (!normalizedWord.includes(normalizedCenter)) {
      return false;
    }

    // All letters must be allowed
    return normalizedWord.split('').every(letter => allowedLetters.includes(letter));
  }
};