import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import WordCelebration from './WordCelebration';

interface WordDisplayProps {
  word: string;
  isValid?: boolean;
  score?: number;
  isPangram?: boolean;
}

export function WordDisplay({ 
  word, 
  isValid, 
  score = 0,
  isPangram = false 
}: WordDisplayProps) {
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (isValid) {
      setShowCelebration(true);
      const timer = setTimeout(() => {
        setShowCelebration(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isValid]);

  return (
    <div className="max-w-md mx-auto mt-4 px-4 relative">
      <motion.div 
        className={`text-center text-3xl font-semibold min-h-[48px] 
          ${isValid === true ? 'text-green-600' : 
            isValid === false ? 'text-red-600' : 
            word.length >= 4 ? 'text-gray-800' :
            'text-gray-400'}`}
        animate={{
          scale: isValid === false ? [1, 0.9, 1] : 1,
        }}
        transition={{
          duration: 0.2,
          times: [0, 0.5, 1]
        }}
      >
        {word}
      </motion.div>

      {word.length > 0 && word.length < 4 && (
        <div className="text-center text-sm text-gray-500 mt-1">
          Need {4 - word.length} more letter{4 - word.length !== 1 ? 's' : ''}
        </div>
      )}

      {showCelebration && (
        <WordCelebration 
          word={word} 
          score={score} 
          isPangram={isPangram} 
        />
      )}
    </div>
  );
}