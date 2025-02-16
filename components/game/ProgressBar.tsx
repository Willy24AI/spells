import React from 'react';
import { rankLogic } from '@/lib/utils/rankLogic';

export interface ProgressBarProps {
  score: number;
  maxScore: number;
}

export function ProgressBar({ score, maxScore }: ProgressBarProps) {
  const { currentRank, nextRank, progress, pointsToNext } = rankLogic.calculateRank(score);
  const totalProgress = Math.min((score / maxScore) * 100, 100);

  return (
    <div className="max-w-2xl mx-auto mt-4 sm:mt-8 px-4">
      <div className="text-center mb-3 sm:mb-4">
        <div className="text-2xl sm:text-3xl font-bold text-yellow-600 mb-1 sm:mb-2">
          {score} / {maxScore}
        </div>
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
          {currentRank}
        </h2>
        {nextRank && (
          <p className="text-sm sm:text-base text-gray-600">
            {pointsToNext} points to {nextRank}
          </p>
        )}
      </div>
      
      <div className="bg-gray-200 rounded-full h-2.5 sm:h-3 mb-6 sm:mb-8 overflow-hidden">
        <div 
          className="bg-yellow-400 h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${totalProgress}%` }}
        />
      </div>
    </div>
  );
}