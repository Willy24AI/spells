"use client";

import React from 'react';
import { Settings, Trophy, HelpCircle, BarChart2 } from 'lucide-react';

interface NavbarProps {
  onOpenRankings: () => void;
  onOpenStats: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
}

export function Navbar({ 
  onOpenRankings, 
  onOpenStats, 
  onOpenSettings, 
  onOpenHelp 
}: NavbarProps) {
  return (
    <nav className="bg-yellow-400 p-4 shadow-md">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🐝</span>
            <button className="font-bold text-lg hover:text-yellow-700 transition-colors">
              Daily
            </button>
          </div>
          <span className="text-yellow-600">|</span>
          <button className="hover:text-yellow-700 transition-colors">
            Calendar
          </button>
        </div>
        
        <div className="flex items-center space-x-6">
          <button 
            onClick={onOpenRankings}
            className="hover:text-yellow-700 transition-colors"
          >
            <Trophy size={24} />
          </button>
          <button 
            onClick={onOpenStats}
            className="hover:text-yellow-700 transition-colors"
          >
            <BarChart2 size={24} />
          </button>
          <button 
            onClick={onOpenSettings}
            className="hover:text-yellow-700 transition-colors"
          >
            <Settings size={24} />
          </button>
          <button 
            onClick={onOpenHelp}
            className="hover:text-yellow-700 transition-colors"
          >
            <HelpCircle size={24} />
          </button>
        </div>
      </div>
    </nav>
  );
}