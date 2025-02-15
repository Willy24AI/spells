import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface WordCelebrationProps {
  word: string;
  score: number;
  isPangram?: boolean;
  onAnimationComplete?: () => void;
}

const WordCelebration = ({ 
  word, 
  score, 
  isPangram = false,
  onAnimationComplete 
}: WordCelebrationProps) => {
  useEffect(() => {
    if (isPangram) {
      // Shoot confetti for pangrams
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [isPangram]);

  return (
    <AnimatePresence mode="wait" onExitComplete={onAnimationComplete}>
      <div className="fixed top-1/4 left-1/2 transform -translate-x-1/2 pointer-events-none z-50">
        <motion.div
          key={word} // This ensures the animation runs for each new word
          initial={{ scale: 0.5, opacity: 0, y: 0 }}
          animate={{ 
            scale: [0.5, 1.2, 1],
            opacity: [0, 1, 1, 0],
            y: [0, -20, -40]
          }}
          transition={{ 
            duration: 1.5,
            times: [0, 0.3, 0.5, 1]
          }}
          className="flex flex-col items-center"
        >
          <motion.div
            className={`text-4xl font-bold mb-2 ${
              isPangram ? 'text-yellow-500' : 'text-green-500'
            }`}
          >
            {word}
          </motion.div>
          <motion.div
            className="text-2xl font-semibold text-gray-700"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            +{score} points
          </motion.div>
          {isPangram && (
            <motion.div
              className="mt-2 text-xl text-yellow-600 font-semibold"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 15,
                delay: 0.4
              }}
            >
              Pangram! 🌟
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WordCelebration;