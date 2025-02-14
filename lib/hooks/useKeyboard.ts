"use client";

import { useEffect, useCallback } from 'react';

interface UseKeyboardProps {
  onEnter: () => void;
  onDelete: () => void;
  onLetter: (letter: string) => void;
  enabled?: boolean;
}

export function useKeyboard({
  onEnter,
  onDelete,
  onLetter,
  enabled = true
}: UseKeyboardProps) {
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    if (e.key === 'Enter') {
      onEnter();
    } else if (e.key === 'Backspace') {
      onDelete();
    } else if (e.key.match(/^[a-zA-Z]$/)) {
      onLetter(e.key);
    }
  }, [enabled, onEnter, onDelete, onLetter]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);
}