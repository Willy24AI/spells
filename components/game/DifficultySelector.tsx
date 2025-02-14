"use client";

import React from 'react';
import { Shield } from 'lucide-react';

interface DifficultySelectorProps {
  difficulty: 'easy' | 'normal' | 'hard';
  onSelect: (difficulty: 'easy' | 'normal' | 'hard') => void;
  disabled?: boolean;
}

export function DifficultySelector({
  difficulty,
  onSelect,
  disabled
}: DifficultySelectorProps) {
  const difficulties = [
    { value: 'easy', label: 'Easy', color: 'bg-green-100 text-green-700' },
    { value: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-700' },
    { value: 'hard', label: 'Hard', color: 'bg-red-100 text-red-700' }
  ];

  return (
    <div className="flex items-center space-x-2">
      <Shield size={20} className="text-gray-500" />
      <div className="flex rounded-lg overflow-hidden">
        {difficulties.map(({ value, label, color }) => (
          <button
            key={value}
            onClick={() => !disabled && onSelect(value as 'easy' | 'normal' | 'hard')}
            disabled={disabled}
            className={`
              px-4 py-2 text-sm font-medium
              ${difficulty === value ? color : 'bg-gray-100 text-gray-700'}
              ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:opacity-90'}
              transition-colors duration-200
              ${value === 'easy' ? 'rounded-l-lg' : ''}
              ${value === 'hard' ? 'rounded-r-lg' : ''}
            `}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}