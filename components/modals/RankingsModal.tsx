// components/modals/RankingsModal.tsx

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { getRankLevels } from '@/lib/utils/rankSystem';

interface RankingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScore?: number;
  maxScore?: number;
}

export function RankingsModal({ isOpen, onClose, currentScore = 0, maxScore = 0 }: RankingsModalProps) {
  // Thresholds are derived from the day's max score so the rankings shown always
  // match the puzzle of the day.
  const rankLevels = getRankLevels(maxScore);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Hive Rankings">
      <div className="space-y-4">
        {rankLevels.map((rank, index) => (
          <div
            key={index}
            className={`flex items-center justify-between py-2 ${
              currentScore >= rank.score && currentScore < (rankLevels[index + 1]?.score || Infinity)
                ? 'text-yellow-600 font-medium'
                : 'text-gray-600'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span>{rank.icon}</span>
              <span>{rank.title}</span>
            </div>
            <span className="text-gray-500">({rank.score})</span>
          </div>
        ))}
      </div>
    </Modal>
  );
}