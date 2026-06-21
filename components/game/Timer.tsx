"use client";

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
  isEnabled: boolean;
  onToggle: () => void;
}

export function Timer({ isEnabled, onToggle }: TimerProps) {
  const [time, setTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isEnabled) {
      interval = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isEnabled]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2">
      {isEnabled && (
        <span className="text-gray-600 font-medium text-sm">
          {formatTime(time)}
        </span>
      )}
      <button
        onClick={onToggle}
        className={`flex items-center justify-center w-10 h-10 rounded-full shadow-md hover:shadow-lg bg-white
                   transition-colors duration-200
                   ${isEnabled
                     ? 'text-yellow-600 hover:bg-yellow-50'
                     : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'}`}
        aria-label={isEnabled ? 'Disable Timer' : 'Enable Timer'}
      >
        <Clock className="w-5 h-5" />
      </button>
    </div>
  );
}