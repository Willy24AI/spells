// lib/dictionary/filters.ts

export const filters = {
    /**
     * Word must be at least 4 letters long
     */
    minimumLength(word: string, minLength: number = 4): boolean {
      return word.length >= minLength;
    },
  
    /**
     * Word should only contain letters
     */
    lettersOnly(word: string): boolean {
      return /^[a-zA-Z]+$/.test(word);
    },
  
    /**
     * Word should not be a proper noun (starts with capital)
     */
    notProperNoun(word: string): boolean {
      return word === word.toLowerCase();
    },
  
    /**
     * Word should contain at least one vowel
     */
    hasVowel(word: string): boolean {
      return /[aeiou]/i.test(word);
    },
  
    /**
     * Word should not be on exclusion list
     */
    notExcluded(word: string, exclusionList: Set<string>): boolean {
      return !exclusionList.has(word.toLowerCase());
    },
  
    /**
     * Word should not contain obscure letters (optional)
     */
    noObscureLetters(word: string): boolean {
      const obscureLetters = new Set(['j', 'q', 'x', 'z']);
      return !word.split('').some(letter => obscureLetters.has(letter.toLowerCase()));
    },
  
    /**
     * Apply all filters to a word
     */
    applyAll(
      word: string, 
      options: {
        minLength?: number;
        checkProperNouns?: boolean;
        requireVowels?: boolean;
        exclusionList?: Set<string>;
        allowObscureLetters?: boolean;
      } = {}
    ): boolean {
      const {
        minLength = 4,
        checkProperNouns = true,
        requireVowels = true,
        exclusionList = new Set(),
        allowObscureLetters = true
      } = options;
  
      return (
        filters.lettersOnly(word) &&
        filters.minimumLength(word, minLength) &&
        (!checkProperNouns || filters.notProperNoun(word)) &&
        (!requireVowels || filters.hasVowel(word)) &&
        filters.notExcluded(word, exclusionList) &&
        (allowObscureLetters || filters.noObscureLetters(word))
      );
    }
  };