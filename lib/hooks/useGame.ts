"use client";

import { useState, useCallback } from 'react';

interface GameState {
  currentWord: string;
  correctWords: string[];
  score: number;
  rank: string;
  progress: number;
}

export function useGame() {
  const [state, setState] = useState<GameState>({
    currentWord: '',
    correctWords: [],
    score: 0,
    rank: 'Beginner',
    progress: 0,
  });

  const addLetter = useCallback((letter: string) => {
    setState(prev => ({
      ...prev,
      currentWord: prev.currentWord.length < 20 
        ? prev.currentWord + letter.toUpperCase()
        : prev.currentWord
    }));
  }, []);

  const deleteLetter = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentWord: prev.currentWord.slice(0, -1)
    }));
  }, []);

  const submitWord = useCallback(() => {
    setState(prev => {
      if (prev.currentWord.length < 4) return prev;
      if (prev.correctWords.includes(prev.currentWord)) return prev;

      const newScore = prev.score + calculateWordScore(prev.currentWord);
      const { rank, progress } = calculateRank(newScore);

      return {
        ...prev,
        correctWords: [...prev.correctWords, prev.currentWord],
        currentWord: '',
        score: newScore,
        rank,
        progress,
      };
    });
  }, []);

  const calculateWordScore = (word: string) => {
    return word.length === 4 ? 1 : word.length;
  };

  const calculateRank = (score: number) => {
    if (score < 20) {
      return { rank: 'Beginner', progress: (score / 20) * 100 };
    } else if (score < 50) {
      return { rank: 'Good Start', progress: ((score - 20) / 30) * 100 };
    } else if (score < 100) {
      return { rank: 'Moving Up', progress: ((score - 50) / 50) * 100 };
    }
    return { rank: 'Expert', progress: 100 };
  };

  return {
    ...state,
    addLetter,
    deleteLetter,
    submitWord,
  };
}