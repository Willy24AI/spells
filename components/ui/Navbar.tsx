import React from 'react';
import { Settings, Trophy, HelpCircle, BarChart2, History } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavbarProps {
  onOpenRankings: () => void;
  onOpenStats: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onOpenYesterday: () => void;
}

export function Navbar({ 
  onOpenRankings, 
  onOpenStats, 
  onOpenSettings, 
  onOpenHelp,
  onOpenYesterday
}: NavbarProps) {
  return (
    <nav className="bg-yellow-400 dark:bg-yellow-600 p-4 shadow-md">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
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
    </nav>
  );
}