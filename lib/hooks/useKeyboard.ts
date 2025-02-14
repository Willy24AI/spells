"use client";

import { useEffect, useCallback } from 'react';

interface UseKeyboardProps {
  onEnter: () => void;
  onDelete: () => void;
  onLetter: (letter: string) => void;
  enabled?: boolean;
  minLength?: number; // Add minimum length requirement
}

export function useKeyboard({
  onEnter,
  onDelete,
  onLetter,
  enabled = true,
  minLength = 4  // Default minimum length
}: UseKeyboardProps) {
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    // Prevent default behavior for game controls
    if (e.key === 'Enter' || e.key === 'Backspace' || e.key.match(/^[a-zA-Z]$/)) {
      e.preventDefault();
    }

    if (e.key === 'Enter') {
      onEnter();
    } else if (e.key === 'Backspace') {
      onDelete();
    } else if (e.key.match(/^[a-zA-Z]$/)) {
      onLetter(e.key.toUpperCase()); // Ensure uppercase consistency
    }
  }, [enabled, onEnter, onDelete, onLetter]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);
}