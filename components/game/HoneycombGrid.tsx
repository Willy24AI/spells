// components/game/HoneycombGrid.tsx
"use client";

import React from 'react';

interface HexagonCellProps {
  letter: string;
  isCenter: boolean;
  onClick: () => void;
  colorClass?: string;
}

interface HoneycombGridProps {
  centerLetter: string;
  outerLetters: string[];
  onLetterClick: (letter: string) => void;
}

const HexagonCell: React.FC<HexagonCellProps> = ({ 
  letter, 
  isCenter, 
  onClick, 
  colorClass 
}) => {
  // Convert letter to uppercase for display
  const displayLetter = letter.toUpperCase();
  
  return (
    <button
      onClick={onClick}
      className={`
        w-14 h-14 sm:w-16 sm:h-16 
        flex items-center justify-center
        text-xl sm:text-2xl font-bold 
        rounded-lg shadow-md 
        transition-all duration-200
        ${isCenter 
          ? 'bg-yellow-400 hover:bg-yellow-500 text-gray-900' 
          : colorClass || 'bg-white hover:bg-gray-50 text-gray-800'}
      `}
    >
      {displayLetter}
    </button>
  );
};

export function HoneycombGrid({ 
  centerLetter, 
  outerLetters, 
  onLetterClick 
}: HoneycombGridProps) {
  // Define the positions for the hexagonal grid
  const positions = [
    { top: -50, left: 0 },      // Top
    { top: -25, left: 43 },     // Top Right
    { top: 25, left: 43 },      // Bottom Right
    { top: 50, left: 0 },       // Bottom
    { top: 25, left: -43 },     // Bottom Left
    { top: -25, left: -43 }     // Top Left
  ];

  // Define colors for outer cells
  const colors = [
    'bg-blue-100 hover:bg-blue-200',
    'bg-green-100 hover:bg-green-200',
    'bg-purple-100 hover:bg-purple-200',
    'bg-pink-100 hover:bg-pink-200',
    'bg-orange-100 hover:bg-orange-200',
    'bg-teal-100 hover:bg-teal-200'
  ];

  // Convert letters to uppercase when handling clicks
  const handleLetterClick = (letter: string) => {
    onLetterClick(letter.toUpperCase());
  };

  return (
    <div className="relative w-80 h-80 mx-auto">
      {/* Center letter */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <HexagonCell
          letter={centerLetter}
          isCenter={true}
          onClick={() => handleLetterClick(centerLetter)}
        />
      </div>

      {/* Outer letters */}
      {outerLetters.map((letter, index) => (
        <div
          key={index}
          className="absolute left-1/2 top-1/2"
          style={{
            transform: `translate(calc(-50% + ${positions[index].left}px), calc(-50% + ${positions[index].top}px))`
          }}
        >
          <HexagonCell
            letter={letter}
            isCenter={false}
            onClick={() => handleLetterClick(letter)}
            colorClass={colors[index]}
          />
        </div>
      ))}
    </div>
  );
}