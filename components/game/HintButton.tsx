"use client";

import React, { useState, useEffect } from 'react';
import { Lightbulb } from 'lucide-react';
import { gameLogic } from '@/lib/utils/gameLogic';

interface HintButtonProps {
  difficulty: 'easy' | 'normal' | 'hard';
  validWords: string[];
  foundWords: string[];
  availableLetters: string[]; // Add this prop
  onHintUsed: () => Promise<void> | void; // Make callback more flexible
  disabled?: boolean;
}

export function HintButton({
  difficulty,
  validWords,
  foundWords,
  availableLetters, // Add this to destructuring
  onHintUsed,
  disabled
}: HintButtonProps) {
  const [cooldown, setCooldown] = useState(0);
  const settings = gameLogic.getDifficultySettings(difficulty);
  const [hintsRemaining, setHintsRemaining] = useState(settings.hintsAllowed);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleHintClick = async () => {
    if (cooldown > 0 || hintsRemaining <= 0 || disabled) return;

    const hint = gameLogic.generateHint(
      validWords, 
      foundWords, 
      'random',
      availableLetters // Pass the available letters
    );
    
    if (hint) {
      setHintsRemaining(prev => prev - 1);
      setCooldown(settings.hintCooldown);
      await onHintUsed();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleHintClick}
        disabled={cooldown > 0 || hintsRemaining <= 0 || disabled}
        className={`
          flex items-center space-x-2 px-4 py-2 rounded-full
          ${cooldown > 0 || hintsRemaining <= 0 || disabled
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
            : 'bg-yellow-400 hover:bg-yellow-500 text-gray-800'}
          transition-colors duration-200
        `}
      >
        <Lightbulb size={20} />
        <span>Hint ({hintsRemaining})</span>
      </button>
      {cooldown > 0 && (
        <div className="absolute -bottom-6 left-0 right-0 text-center text-sm text-gray-600">
          {cooldown}s
        </div>
      )}
    </div>
  );
}