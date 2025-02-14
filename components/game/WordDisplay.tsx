"use client";

import React from 'react';

interface WordDisplayProps {
  word: string;
}

export function WordDisplay({ word }: WordDisplayProps) {
  return (
    <div className="max-w-md mx-auto mt-4 px-4">
      <div className="text-center text-3xl font-semibold min-h-[48px] text-gray-800">
        {word}
      </div>
    </div>
  );
}