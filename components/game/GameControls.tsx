"use client";

import React from 'react';

interface GameControlsProps {
  onDelete: () => void;
  onShuffle: () => void;
  onEnter: () => void;
  currentWordLength?: number; // Add word length prop
}

export function GameControls({ 
  onDelete, 
  onShuffle, 
  onEnter,
  currentWordLength = 0 // Default to 0 if not provided
}: GameControlsProps) {
  const canSubmit = currentWordLength >= 4;

  return (
    <div className="max-w-md mx-auto mt-4 sm:mt-6 px-4 flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
      <button
        onClick={onDelete}
        className="px-4 sm:px-6 py-2 bg-white rounded-full hover:bg-gray-50
                  transition-colors duration-200 shadow-md hover:shadow-lg
                  text-gray-700 font-medium text-sm sm:text-base"
      >
        Delete
      </button>
      
      <button
        onClick={onShuffle}
        className="px-4 sm:px-6 py-2 bg-white rounded-full hover:bg-gray-50
                  transition-colors duration-200 shadow-md hover:shadow-lg
                  text-gray-700 font-medium text-sm sm:text-base"
      >
        Shuffle
      </button>
      
      <button
        onClick={() => {
          if (canSubmit) onEnter();
        }}
        disabled={!canSubmit}
        className={`px-4 sm:px-6 py-2 rounded-full transition-colors duration-200 
                   shadow-md hover:shadow-lg font-medium text-sm sm:text-base
                   ${canSubmit 
                     ? 'bg-yellow-400 hover:bg-yellow-500 text-gray-800' 
                     : 'bg-gray-200 text-gray-500 cursor-not-allowed hover:shadow-md'}`}
      >
        Enter
      </button>
    </div>
  );
}