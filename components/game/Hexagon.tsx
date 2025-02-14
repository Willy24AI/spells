"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface HexagonProps {
  letter: string;
  isCenter?: boolean;
  onClick?: () => void;
}

export function Hexagon({ letter, isCenter = false, onClick }: HexagonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-14 h-14 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center",
        "text-xl sm:text-2xl font-bold shadow-md cursor-pointer transition-all duration-200",
        isCenter
          ? "bg-yellow-400 hover:bg-yellow-500"
          : "bg-white hover:bg-gray-50"
      )}
    >
      {letter}
    </button>
  );
}