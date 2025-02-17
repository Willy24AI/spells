import React from 'react';
import { Modal } from '@/components/ui/Modal';
import StatsDisplay from '@/components/game/StatsDisplay';
import type { GameStats } from '@/lib/types/game';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats?: GameStats;
}

export function StatsModal({ isOpen, onClose, stats }: StatsModalProps) {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Statistics"
    >
      <div className="px-2 py-4">
        <StatsDisplay />
      </div>
    </Modal>
  );
}