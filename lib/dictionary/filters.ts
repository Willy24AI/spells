// lib/dictionary/filters.ts

interface FilterOptions {
  minLength?: number;
  maxLength?: number;
  checkProperNouns?: boolean;
  requireVowels?: boolean;
  allowObscureLetters?: boolean;
  minFrequency?: number;
}

export const filters = {
  /**
   * Apply all filters to a word - basic validation only
   */
  applyAll(word: string, options: FilterOptions = {}): boolean {
    const {
      minLength = 4,
      maxLength = 15,
      checkProperNouns = true,
      requireVowels = true,
      allowObscureLetters = true,
      minFrequency = 0
    } = options;

    // Basic validation only
    if (!this.lettersOnly(word)) return false;
    if (!this.checkLength(word, minLength, maxLength)) return false;
    if (checkProperNouns && !this.notProperNoun(word)) return false;
    if (requireVowels && !this.hasVowel(word)) return false;
    if (!allowObscureLetters && !this.noObscureLetters(word)) return false;

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