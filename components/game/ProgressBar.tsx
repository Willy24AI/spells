"use client";

import React from 'react';

interface ProgressBarProps {
  score: number;
  rank: string;
  progress: number;
  nextRankPoints: number;
}

export function ProgressBar({ score, rank, progress, nextRankPoints }: ProgressBarProps) {
  return (
    <div className="max-w-2xl mx-auto mt-4 sm:mt-8 px-4">
      <div className="text-center mb-3 sm:mb-4">
        <div className="text-2xl sm:text-3xl font-bold text-yellow-600 mb-1 sm:mb-2">
          {score}
        </div>
        <h2 className="text-lg sm:text-xl font-semibold">{rank}</h2>
        <p className="text-sm sm:text-base text-gray-600">{nextRankPoints} to next rank</p>
      </div>
      
      <div className="bg-white rounded-full h-1.5 sm:h-2 mb-6 sm:mb-8 shadow-inner">
        <div 
          className="bg-yellow-400 h-1.5 sm:h-2 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
}