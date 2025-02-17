import React from 'react';
import { Settings, Trophy, HelpCircle, BarChart2, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RankProgress } from '@/components/game/RankProgress';

interface NavbarProps {
  onOpenRankings: () => void;
  onOpenStats: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onOpenYesterday: () => void;
  currentScore: number;
  maxScore: number;
  completedRanks: string[];
}

export function Navbar({ 
  onOpenRankings, 
  onOpenStats, 
  onOpenSettings, 
  onOpenHelp,
  onOpenYesterday,
  currentScore,
  maxScore,
  completedRanks
}: NavbarProps) {
  return (
    <nav className="bg-yellow-400 dark:bg-yellow-600 p-4 shadow-md">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🐝</span>
              <span className="font-bold text-lg">Daily Bee</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenYesterday}
              className="hidden sm:flex items-center space-x-2 hover:bg-yellow-300 transition-colors"
            >
              <History className="w-4 h-4" />
              <span>Yesterday</span>
            </Button>
          </div>
          
          <div className="flex items-center space-x-3 sm:space-x-6">
            <button 
              onClick={onOpenRankings}
              className="hover:text-yellow-700 transition-colors"
              aria-label="Rankings"
            >
              <Trophy size={20} className="sm:w-6 sm:h-6" />
            </button>
            <button 
              onClick={onOpenStats}
              className="hover:text-yellow-700 transition-colors"
              aria-label="Statistics"
            >
              <BarChart2 size={20} className="sm:w-6 sm:h-6" />
            </button>
            <button 
              onClick={onOpenSettings}
              className="hover:text-yellow-700 transition-colors"
              aria-label="Settings"
            >
              <Settings size={20} className="sm:w-6 sm:h-6" />
            </button>
            <button 
              onClick={onOpenHelp}
              className="hover:text-yellow-700 transition-colors"
              aria-label="Help"
            >
              <HelpCircle size={20} className="sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 flex justify-center">
          <RankProgress 
            currentScore={currentScore}
            maxScore={maxScore}
            completedRanks={completedRanks}
            variant="compact"
          />
        </div>
      </div>
    </nav>
  );
}