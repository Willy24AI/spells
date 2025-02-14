"use client";

import { useState, useEffect } from 'react';

interface GameStats {
  gamesPlayed: number;
  averageScore: number;
  bestScore: number;
  currentStreak: number;
  longestStreak: number;
}

export function useGameStats() {
  const [stats, setStats] = useState<GameStats>({
    gamesPlayed: 0,
    averageScore: 0,
    bestScore: 0,
    currentStreak: 0,
    longestStreak: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stats');
      if (!response.ok) throw new Error('Failed to fetch statistics');
      const data = await response.json();
      
      // Calculate statistics from the raw data
      const calculatedStats = {
        gamesPlayed: data.length,
        averageScore: data.reduce((acc: number, game: any) => acc + game.score, 0) / data.length || 0,
        bestScore: Math.max(...data.map((game: any) => game.score), 0),
        currentStreak: calculateCurrentStreak(data),
        longestStreak: calculateLongestStreak(data)
      };
      
      setStats(calculatedStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to calculate current streak
  const calculateCurrentStreak = (data: any[]) => {
    // Implementation would check for consecutive days of play
    return data.length > 0 ? 1 : 0; // Simplified version
  };

  // Helper function to calculate longest streak
  const calculateLongestStreak = (data: any[]) => {
    // Implementation would find the longest sequence of consecutive days
    return data.length > 0 ? 1 : 0; // Simplified version
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const refreshStats = () => {
    fetchStats();
  };

  return { stats, loading, error, refreshStats };
}