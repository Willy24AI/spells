"use client";

import React from 'react';
import { Modal } from '@/components/ui/Modal';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="How to Play">
      <div className="space-y-6">
        <section>
          <h3 className="font-semibold text-lg mb-2">Game Rules</h3>
          <ul className="list-disc pl-5 space-y-2 text-gray-600">
            <li>Create words using letters from the hexagon</li>
            <li>Words must be at least 4 letters long</li>
            <li>Words must include the center letter</li>
            <li>Letters can be reused</li>
            <li>Proper nouns are not allowed</li>
          </ul>
        </section>

        <section>
          <h3 className="font-semibold text-lg mb-2">Scoring</h3>
          <ul className="list-disc pl-5 space-y-2 text-gray-600">
            <li>4 letters = 1 point</li>
            <li>5+ letters = 1 point per letter</li>
            <li>Pangrams (using all letters) = bonus points</li>
          </ul>
        </section>

        <section>
          <h3 className="font-semibold text-lg mb-2">Controls</h3>
          <ul className="list-disc pl-5 space-y-2 text-gray-600">
            <li>Click letters or type on keyboard</li>
            <li>Enter or click "Enter" to submit</li>
            <li>Backspace or click "Delete" to remove last letter</li>
            <li>Click "Shuffle" to rearrange letters</li>
          </ul>
        </section>
      </div>
    </Modal>
  );
}