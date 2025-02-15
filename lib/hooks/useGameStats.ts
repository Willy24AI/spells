// lib/hooks/useGameStats.ts
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { statsTracking } from '@/lib/utils/statsTracking';
import type { GameStats } from '@/lib/types/game';

export function useGameStats() {
  const [stats, setStats] = useState<GameStats>({
    gamesPlayed: 0,
    averageScore: 0,
    bestScore: 0,
    currentStreak: 0,
    longestStreak: 0,
    recentGames: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchStats = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await statsTracking.getStats(user.id);
      setStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { 
    stats, 
    loading, 
    error,
    refreshStats: fetchStats
  };
}