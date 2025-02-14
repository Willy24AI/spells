"use client";

import React from 'react';

interface WordDisplayProps {
  word: string;
  isValid?: boolean;
}

export function WordDisplay({ word, isValid }: WordDisplayProps) {
  return (
    <div className="max-w-md mx-auto mt-4 px-4">
      <div className={`text-center text-3xl font-semibold min-h-[48px] 
        ${isValid === true ? 'text-green-600' : 
          isValid === false ? 'text-red-600' : 
          word.length >= 4 ? 'text-gray-800' :
          'text-gray-400'}`}>
        {word}
      </div>
      {word.length > 0 && word.length < 4 && (
        <div className="text-center text-sm text-gray-500 mt-1">
          Need {4 - word.length} more letter{4 - word.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}