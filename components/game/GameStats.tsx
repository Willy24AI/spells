"use client";

import React from 'react';
import { Star } from 'lucide-react';

interface GameStatsProps {
  foundWords: string[];
  totalWords: number;
  score: number;
  difficulty: 'easy' | 'normal' | 'hard';
  showLetterCount?: boolean;
}

export function GameStats({
  foundWords,
  totalWords,
  score,
  difficulty,
  showLetterCount
}: GameStatsProps) {
  const letterCounts = foundWords.reduce((acc, word) => {
    const length = word.length;
    acc[length] = (acc[length] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{score}</div>
          <div className="text-sm text-gray-600">Points</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {foundWords.length}/{totalWords}
          </div>
          <div className="text-sm text-gray-600">Words Found</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </div>
          <div className="text-sm text-gray-600">Difficulty</div>
        </div>
      </div>

      {showLetterCount && (
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Word Lengths:</h3>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(letterCounts).map(([length, count]) => (
              <div key={length} className="text-center">
                <div className="text-lg font-semibold">{count}</div>
                <div className="text-xs text-gray-600">{length} letters</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}