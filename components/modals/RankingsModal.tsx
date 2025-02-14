"use client";

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Trophy } from 'lucide-react';

interface RankingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rankings: {
    rank: number;
    name: string;
    score: number;
  }[];
}

export function RankingsModal({ isOpen, onClose, rankings }: RankingsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rankings">
      <div className="space-y-4">
        {rankings.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="mx-auto h-12 w-12 text-yellow-400 mb-2" />
            <p className="text-gray-500">No rankings available yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rankings.map((rank, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-gray-500">#{rank.rank}</span>
                  <span className="font-medium">{rank.name}</span>
                </div>
                <span className="font-semibold text-yellow-600">{rank.score}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}