export const validation = {
  isAlphabetic: (str: string): boolean => {
    return /^[a-zA-Z]+$/.test(str);
  },

  sanitizeInput: (input: string): string => {
    return input.trim().toUpperCase();
  },

  validateGameInput: (input: string, rules: {
    minLength?: number;
    maxLength?: number;
    requiredLetter?: string;
    allowedLetters?: string[];
  }): { isValid: boolean; error?: string } => {
    const sanitized = validation.sanitizeInput(input);

    if (rules.minLength && sanitized.length < rules.minLength) {
      return { 
        isValid: false, 
        error: `Word must be at least ${rules.minLength} letters long` 
      };
    }

    if (rules.maxLength && sanitized.length > rules.maxLength) {
      return { 
        isValid: false, 
        error: `Word cannot be longer than ${rules.maxLength} letters` 
      };
    }

    if (rules.requiredLetter && !sanitized.includes(rules.requiredLetter)) {
      return { 
        isValid: false, 
        error: `Word must contain the letter ${rules.requiredLetter}` 
      };
    }

    if (rules.allowedLetters) {
      const hasInvalidLetter = sanitized
        .split('')
        .some(letter => !rules.allowedLetters?.includes(letter));

      if (hasInvalidLetter) {
        return { 
          isValid: false, 
          error: 'Word contains invalid letters' 
        };
      }
    }

    return { isValid: true };
  }
};