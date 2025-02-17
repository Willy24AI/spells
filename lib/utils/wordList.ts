import { supabase } from '@/lib/db';

export const wordList = {
  /**
   * Check if a word exists in our dictionary
   */
  isValidWord: async (word: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('words')
        .select('word')
        .eq('word', word.toLowerCase())
        .single();

      if (error) return false;
      return !!data;
    } catch (error) {
      console.error('Error checking word validity:', error);
      return false;
    }
  },

  /**
   * Calculate word score based on game rules
   */
  getWordScore: async (word: string): Promise<number> => {
    try {
      const { data, error } = await supabase
        .from('words')
        .select('points, isPangram')
        .eq('word', word.toLowerCase())
        .single();

      if (error || !data) return 0;

      // Base score: 1 point for 4-letter words, word length for longer words
      let score = word.length === 4 ? 1 : word.length;
      
      // Add pangram bonus
      if (data.isPangram) score += 7;

      return score;
    } catch (error) {
      console.error('Error calculating word score:', error);
      return 0;
    }
  },

  /**
   * Batch validate multiple words
   */
  validateWords: async (words: string[]): Promise<Set<string>> => {
    try {
      const { data, error } = await supabase
        .from('words')
        .select('word')
        .in('word', words.map(w => w.toLowerCase()));

      if (error) return new Set();
      return new Set(data.map(d => d.word.toLowerCase()));
    } catch (error) {
      console.error('Error validating words:', error);
      return new Set();
    }
  }
};