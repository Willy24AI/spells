// lib/hooks/useGame.ts
"use client";

import { useState, useCallback, useEffect } from 'react';

interface GameState {
  currentWord: string;
  correctWords: string[];
  score: number;
}

export function useGame() {
  const [state, setState] = useState<GameState>({
    currentWord: '',
    correctWords: [],
    score: 0
  });

  // Debug: Monitor state changes
  useEffect(() => {
    console.log('Game state updated:', state);
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

  // Award a validated word. The caller passes the authoritative point value
  // (from gameLogic.calculateWordScore, which includes the pangram bonus) so the
  // running total always matches what the player sees per word.
  const submitWord = useCallback((validWord: string, wordScore: number) => {
    if (validWord.length < 4) {
      return;
    }

    setState(prev => {
      // Ignore duplicates so points can't be earned twice for the same word.
      if (prev.correctWords.includes(validWord)) {
        return { ...prev, currentWord: '' };
      }

      return {
        ...prev,
        correctWords: [...prev.correctWords, validWord],
        currentWord: '',
        score: prev.score + wordScore
      };
    });
  }, []);

  // Clear the in-progress word without scoring it (e.g. on a rejected entry).
  const clearWord = useCallback(() => {
    setState(prev => ({ ...prev, currentWord: '' }));
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
    clearWord,
    debugState  // Expose debug function
  };
}