// components/modals/RankingsModal.tsx
"use client";

import React from 'react';
import { Modal } from '@/components/ui/Modal';

interface RankingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScore?: number;
}

const rankLevels = [
  { title: 'Worker Bee', score: 0, icon: '🐝' },
  { title: 'Busy Bee', score: 15, icon: '🐝' },
  { title: 'Honey Maker', score: 35, icon: '🐝' },
  { title: 'Hive Scout', score: 60, icon: '🐝' },
  { title: 'Royal Guard', score: 100, icon: '🐝' },
  { title: 'Nectar Master', score: 150, icon: '🌺' },
  { title: 'Hive Elder', score: 200, icon: '⭐' },
  { title: 'Queen Bee', score: 275, icon: '👑' }
];

export function RankingsModal({ isOpen, onClose, currentScore = 0 }: RankingsModalProps) {
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