"use client";

import { useState, useCallback, useEffect } from 'react';

interface GameState {
  currentWord: string;
  correctWords: string[];
  score: number;
  rank: string;
  progress: number;
}

const calculateWordScore = (word: string): number => {
  return word.length === 4 ? 1 : word.length;
};

const calculateRank = (score: number): { rank: string; progress: number } => {
  if (score < 20) {
    return { 
      rank: 'Beginner', 
      progress: (score / 20) * 100 
    };
  } else if (score < 50) {
    return { 
      rank: 'Good Start', 
      progress: ((score - 20) / 30) * 100 
    };
  } else if (score < 100) {
    return { 
      rank: 'Moving Up', 
      progress: ((score - 50) / 50) * 100 
    };
  }
  return { 
    rank: 'Expert', 
    progress: 100 
  };
};

export function useGame() {
  const [state, setState] = useState<GameState>({
    currentWord: '',
    correctWords: [],
    score: 0,
    rank: 'Beginner',
    progress: 0,
  });

  // Debug: Monitor state changes
  useEffect(() => {
    console.log('Game state updated:', {
      currentWord: state.currentWord,
      correctWords: state.correctWords,
      score: state.score,
      rank: state.rank,
      progress: state.progress
    });
  }, [state]);

  const addLetter = useCallback((letter: string) => {
    setState(prev => {
      const newWord = prev.currentWord.length < 20 
        ? prev.currentWord + letter.toUpperCase()
        : prev.currentWord;
      
      console.log('Adding letter:', letter);
      console.log('New current word:', newWord);
      
      return {
        ...prev,
        currentWord: newWord
      };
    });
  }, []);

  const deleteLetter = useCallback(() => {
    setState(prev => {
      const newWord = prev.currentWord.slice(0, -1);
      console.log('Deleting last letter');
      console.log('New current word:', newWord);
      
      return {
        ...prev,
        currentWord: newWord
      };
    });
  }, []);

  const submitWord = useCallback((validWord: string) => {
    console.log('Attempting to submit word:', validWord);
    
    if (validWord.length < 4) {
      console.log('Word too short:', validWord);
      return;
    }

    setState(prev => {
      // Check if word already exists
      if (prev.correctWords.includes(validWord)) {
        console.log('Word already exists:', validWord);
        return prev;
      }

      console.log('Adding new word to correctWords:', validWord);
      console.log('Previous correctWords:', prev.correctWords);

      const newScore = prev.score + calculateWordScore(validWord);
      const { rank, progress } = calculateRank(newScore);

      const newState = {
        ...prev,
        correctWords: [...prev.correctWords, validWord],
        currentWord: '',
        score: newScore,
        rank,
        progress,
      };

      console.log('New state after word submission:', newState);
      return newState;
    });
  }, []);

  // Debug: Expose a function to check current state
  const debugState = useCallback(() => {
    console.log('Current game state:', state);
  }, [state]);

  return {
    ...state,
    addLetter,
    deleteLetter,
    submitWord,
    debugState,  // Expose debug function
  };
}