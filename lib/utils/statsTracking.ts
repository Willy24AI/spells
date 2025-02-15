// lib/utils/statsTracking.ts
import { supabase } from '@/lib/db';
import { dateUtils } from '@/lib/utils/dateUtils';
import type { GameStats, GameStatsRecord } from '@/lib/types/game';

export const statsTracking = {
  updateGameStats: async (
    userId: string,
    score: number,
    wordsFound: string[]
  ): Promise<boolean> => {
    const date = dateUtils.getDayKey(new Date());
    
    try {
      // First try to update existing stats for today
      const { data, error: updateError } = await supabase
        .from('game_stats')
        .update({
          score: score,
          words_found: wordsFound.length,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('date', date)
        .select();

      // If no existing record was updated, create a new one
      if (!data?.length) {
        const { error: insertError } = await supabase
          .from('game_stats')
          .insert({
            user_id: userId,
            date: date,
            score: score,
            words_found: wordsFound.length
          });

        if (insertError) throw insertError;
      } else if (updateError) {
        throw updateError;
      }

      return true;
    } catch (error) {
      console.error('Error updating game stats:', error);
      return false;
    }
  },

  getStats: async (userId: string): Promise<GameStats> => {
    try {
      // Get all games for the user
      const { data: games, error: gamesError } = await supabase
        .from('game_stats')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (gamesError) throw gamesError;

      // Calculate statistics
      const stats: GameStats = {
        gamesPlayed: games.length,
        averageScore: 0,
        bestScore: 0,
        currentStreak: 0,
        longestStreak: 0,
        recentGames: games.slice(0, 10).map(game => ({
          date: game.date,
          score: game.score,
          words_found: game.words_found
        }))
      };

      if (games.length > 0) {
        // Calculate average and best scores
        stats.bestScore = Math.max(...games.map(g => g.score));
        stats.averageScore = Math.round(
          games.reduce((sum, g) => sum + g.score, 0) / games.length
        );

        // Calculate streaks
        let currentStreak = 0;
        let longestStreak = 0;
        let previousDate: Date | null = null;

        for (const game of games) {
          const gameDate = new Date(game.date);
          
          if (!previousDate || 
              dateUtils.isSameDay(
                dateUtils.startOfDay(new Date(previousDate)),
                dateUtils.startOfDay(new Date(gameDate))
              )) {
            currentStreak++;
            longestStreak = Math.max(longestStreak, currentStreak);
          } else {
            currentStreak = 1;
          }
          
          previousDate = gameDate;
        }

        stats.currentStreak = currentStreak;
        stats.longestStreak = longestStreak;
      }

      return stats;
    } catch (error) {
      console.error('Error fetching game stats:', error);
      throw error;
    }
  }
};