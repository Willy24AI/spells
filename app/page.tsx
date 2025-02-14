"use client";

import React, { useState, useEffect } from 'react';
import { Settings, Trophy, HelpCircle, BarChart2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGame } from '@/lib/hooks/useGame';
import { useKeyboard } from '@/lib/hooks/useKeyboard';
import { queries } from '@/lib/db/queries';
import { dateUtils } from '@/lib/utils/dateUtils';
import { storage } from '@/lib/utils/localStorage';
import { gameLogic } from '@/lib/utils/gameLogic';

// Components
import { Hexagon } from '@/components/game/Hexagon';
import { WordDisplay } from '@/components/game/WordDisplay';
import { WordList } from '@/components/game/WordList';
import { ProgressBar } from '@/components/game/ProgressBar';
import { GameControls } from '@/components/game/GameControls';
import { Timer } from '@/components/game/Timer';
import { HelpModal } from '@/components/modals/HelpModal';
import { RankingsModal } from '@/components/modals/RankingsModal';
import { StatsModal } from '@/components/modals/StatsModal';
import { SettingsModal } from '@/components/modals/SettingsModal';
import HoneycombGrid from '@/components/game/HoneycombGrid';
export default function HomePage() {
  // Game state
  const {
    currentWord,
    correctWords,
    score,
    rank,
    progress,
    addLetter,
    deleteLetter,
    submitWord
  } = useGame();

  // Puzzle state
  const [puzzle, setPuzzle] = useState<{
    centerLetter: string;
    outerLetters: string[];
    validWords: string[];
    pangrams: string[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [isWordListOpen, setIsWordListOpen] = useState(false);
  const [isTimerEnabled, setIsTimerEnabled] = useState(false);
  const [modals, setModals] = useState({
    help: false,
    rankings: false,
    stats: false,
    settings: false
  });

  // Settings state
  const [settings, setSettings] = useState({
    soundEnabled: true,
    darkMode: false,
    showTimer: false
  });

  // Stats state
  const [gameStats, setGameStats] = useState({
    gamesPlayed: 0,
    averageScore: 0,
    bestScore: 0,
    currentStreak: 0,
    longestStreak: 0
  });

  // Rankings state
  const [rankings, setRankings] = useState<Array<{
    rank: number;
    name: string;
    score: number;
  }>>([]);

  // Keyboard handling
  useKeyboard({
    onEnter: submitWord,
    onDelete: deleteLetter,
    onLetter: addLetter,
    enabled: !Object.values(modals).some(isOpen => isOpen)
  });

  // Modify the fetchPuzzle function in your useEffect
useEffect(() => {
  const fetchPuzzle = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/puzzle');
      if (!response.ok) throw new Error('Failed to fetch puzzle');
      const data = await response.json();
      
      // Transform the data to match the expected structure
      setPuzzle({
        centerLetter: data.center_letter,
        outerLetters: data.other_letters.split(''),  // Convert string to array
        validWords: data.answers,  // Assuming this is what you want for validWords
        pangrams: data.pangrams
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  fetchPuzzle();
}, []);

  // Handle word submission
  const handleSubmitWord = async () => {
    if (!puzzle || currentWord.length < 4) return;

    try {
      const response = await fetch('/api/puzzle/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: currentWord,
          centerLetter: puzzle.centerLetter,
          outerLetters: puzzle.outerLetters
        })
      });

      const data = await response.json();
      if (data.valid) {
        submitWord();
        if (settings.soundEnabled) {
          // Play success sound
        }
      }
    } catch (err) {
      console.error('Error validating word:', err);
    }
  };

  // Handle letter shuffle
  const handleShuffle = () => {
    if (!puzzle) return;
    const shuffled = gameLogic.shuffleLetters(puzzle.outerLetters);
    setPuzzle(prev => prev ? { ...prev, outerLetters: shuffled } : null);
    if (settings.soundEnabled) {
      // Play shuffle sound
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl font-semibold">Loading puzzle...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl font-semibold text-red-600">{error}</div>
      </div>
    );
  }

  if (!puzzle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl font-semibold">No puzzle available</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-yellow-400 p-4 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🐝</span>
              <button className="font-bold text-lg hover:text-yellow-700 transition-colors">
                Daily
              </button>
            </div>
            
          </div>
          
          <div className="flex items-center space-x-3 sm:space-x-6">
            <button 
              onClick={() => setModals(prev => ({ ...prev, rankings: true }))}
              className="hover:text-yellow-700 transition-colors"
              aria-label="Rankings"
            >
              <Trophy size={20} className="sm:w-6 sm:h-6" />
            </button>
            <button 
              onClick={() => setModals(prev => ({ ...prev, stats: true }))}
              className="hover:text-yellow-700 transition-colors"
              aria-label="Statistics"
            >
              <BarChart2 size={20} className="sm:w-6 sm:h-6" />
            </button>
            <button 
              onClick={() => setModals(prev => ({ ...prev, settings: true }))}
              className="hover:text-yellow-700 transition-colors"
              aria-label="Settings"
            >
              <Settings size={20} className="sm:w-6 sm:h-6" />
            </button>
            <button 
              onClick={() => setModals(prev => ({ ...prev, help: true }))}
              className="hover:text-yellow-700 transition-colors"
              aria-label="Help"
            >
              <HelpCircle size={20} className="sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Progress */}
      <ProgressBar
        score={score}
        rank={rank}
        progress={progress}
        nextRankPoints={7}
      />

      {/* Word Display */}
      <WordDisplay word={currentWord} />

      {/* Word List */}
      <WordList
        words={correctWords}
        isOpen={isWordListOpen}
        onToggle={() => setIsWordListOpen(!isWordListOpen)}
      />

     {/* Game Grid */}
<div className="max-w-2xl mx-auto mt-4 sm:mt-8 px-4">
  <HoneycombGrid
    centerLetter={puzzle.centerLetter}
    outerLetters={puzzle.outerLetters}
    onLetterClick={addLetter}
  />
</div>

      {/* Controls */}
      <GameControls
        onDelete={deleteLetter}
        onShuffle={handleShuffle}
        onEnter={handleSubmitWord}
      />

      {/* Timer */}
      <Timer
        isEnabled={isTimerEnabled}
        onToggle={() => setIsTimerEnabled(!isTimerEnabled)}
      />

      {/* Modals */}
      <HelpModal
        isOpen={modals.help}
        onClose={() => setModals(prev => ({ ...prev, help: false }))}
      />
      
      <RankingsModal
        isOpen={modals.rankings}
        onClose={() => setModals(prev => ({ ...prev, rankings: false }))}
        rankings={rankings}
      />
      
      <StatsModal
        isOpen={modals.stats}
        onClose={() => setModals(prev => ({ ...prev, stats: false }))}
        stats={gameStats}
      />
      
      <SettingsModal
        isOpen={modals.settings}
        onClose={() => setModals(prev => ({ ...prev, settings: false }))}
        settings={settings}
        onSettingChange={(setting, value) => {
          setSettings(prev => ({ ...prev, [setting]: value }));
          storage.set('settings', { ...settings, [setting]: value });
        }}
      />
    </div>
  );
}