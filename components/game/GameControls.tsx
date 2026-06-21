// components/game/GameControls.tsx
"use client";

import React from 'react';
import { Trash2, RotateCcw, ArrowRight } from 'lucide-react';

interface GameControlsProps {
  onDelete: () => void;
  onShuffle: () => void;
  onEnter: () => void;
  currentWordLength?: number;
}

export function GameControls({ 
  onDelete, 
  onShuffle, 
  onEnter,
  currentWordLength = 0
}: GameControlsProps) {
  const canSubmit = currentWordLength >= 4;

  return (
    <div className="flex flex-row items-center justify-center gap-3">
      <button
        onClick={onDelete}
        className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 bg-white rounded-full
                  hover:bg-gray-50 transition-colors duration-200 shadow-md hover:shadow-lg
                  text-gray-700 font-medium text-sm sm:text-base"
        aria-label="Delete"
      >
        <Trash2 className="w-5 h-5" />
      </button>
      
      <button
        onClick={onShuffle}
        className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 bg-white rounded-full 
                  hover:bg-gray-50 transition-colors duration-200 shadow-md hover:shadow-lg
                  text-gray-700 font-medium text-sm sm:text-base"
        aria-label="Shuffle"
      >
        <RotateCcw className="w-5 h-5" />
      </button>
      
      <button
        onClick={() => {
          if (canSubmit) onEnter();
        }}
        disabled={!canSubmit}
        className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2 rounded-full 
                   transition-colors duration-200 shadow-md hover:shadow-lg font-medium text-sm sm:text-base
                   ${canSubmit 
                     ? 'bg-yellow-400 hover:bg-yellow-500 text-gray-800' 
                     : 'bg-gray-200 text-gray-500 cursor-not-allowed hover:shadow-md'}`}
        aria-label="Enter"
      >
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}