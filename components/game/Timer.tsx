"use client";

import React, { useState, useEffect } from 'react';

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
    <div className="max-w-md mx-auto mt-8 mb-8 px-4">
      <div className="flex items-center justify-center space-x-4">
        {isEnabled && (
          <span className="text-gray-600 font-medium">
            {formatTime(time)}
          </span>
        )}
        <button 
          onClick={onToggle}
          className="text-yellow-600 hover:text-yellow-700 
                   hover:underline transition-colors font-medium"
        >
          {isEnabled ? 'Disable Timer' : 'Enable Timer'}
        </button>
      </div>
    </div>
  );
}