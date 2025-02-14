import { supabase } from './index';

export const queries = {
  getDailyPuzzle: async (date: string) => {
    console.log('Attempting to fetch puzzle for date:', date);
    
    const { data, error } = await supabase
      .from('daily_puzzles')
      .select('*')
      .eq('puzzle_date', date)  // Changed from 'date' to 'puzzle_date'
      .single();

    if (error) {
      console.error('Supabase error details:', error);
      throw error;
    }
    
    console.log('Successfully fetched puzzle:', data);
    return data;
  },

  validateWord: async (word: string) => {
    const { data, error } = await supabase
      .from('words')
      .select('*')
      .eq('word', word.toLowerCase())
      .single();

    if (error) return null;
    return data;
  },

  getLeaderboard: async (date: string) => {
    const { data, error } = await supabase
      .from('game_stats')
      .select('score')
      .eq('date', date)  // Note: You might need to change this to 'puzzle_date' if you rename it in the game_stats table
      .order('score', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data;
  }
};