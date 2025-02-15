// components/modals/StatsModal.tsx
"use client";

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { BarChart2 } from 'lucide-react';
import type { GameStats } from '@/lib/types/game';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StatsModal({ isOpen, onClose }: StatsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Your Statistics">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <StatBox 
            label="Games Played"
            value={0}
          />
          <StatBox 
            label="Average Score"
            value={0}
          />
          <StatBox 
            label="Best Score"
            value={0}
          />
          <StatBox 
            label="Current Streak"
            value={0}
          />
        </div>

        <StatBox 
          label="Longest Streak"
          value={0}
          fullWidth
        />
      </div>
    </Modal>
  );
}

interface StatBoxProps {
  label: string;
  value: number;
  fullWidth?: boolean;
}

function StatBox({ label, value, fullWidth = false }: StatBoxProps) {
  return (
    <div className={`text-center p-4 bg-gray-50 rounded-lg ${
      fullWidth ? 'col-span-2' : ''
    }`}>
      <div className="text-2xl font-bold text-yellow-600">
        {value}
      </div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}