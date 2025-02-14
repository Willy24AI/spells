"use client";

import { useState, useEffect } from 'react';

interface Ranking {
  rank: number;
  name: string;
  score: number;
}

export function useRankings() {
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRankings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/rankings');
      if (!response.ok) throw new Error('Failed to fetch rankings');
      const data = await response.json();
      
      // Transform the data to include dummy names for demo purposes
      // In production, this would come from the database
      const transformedData = data.map((item: any) => ({
        rank: item.rank,
        name: `Player ${item.rank}`, // In production, use real usernames
        score: item.score
      }));
      
      setRankings(transformedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rankings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, []);

  const refreshRankings = () => {
    fetchRankings();
  };

  return { rankings, loading, error, refreshRankings };
}