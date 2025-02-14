"use client";

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { BarChart2 } from 'lucide-react';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: {
    gamesPlayed: number;
    averageScore: number;
    bestScore: number;
    currentStreak: number;
    longestStreak: number;
  };
}

export function StatsModal({ isOpen, onClose, stats }: StatsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Your Statistics">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.gamesPlayed}
            </div>
            <div className="text-sm text-gray-600">Games Played</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.averageScore}
            </div>
            <div className="text-sm text-gray-600">Average Score</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.bestScore}
            </div>
            <div className="text-sm text-gray-600">Best Score</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {stats.currentStreak}
            </div>
            <div className="text-sm text-gray-600">Current Streak</div>
          </div>
        </div>

        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {stats.longestStreak}
          </div>
          <div className="text-sm text-gray-600">Longest Streak</div>
        </div>
      </div>
    </Modal>
  );
}