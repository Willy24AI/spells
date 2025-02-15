"use client";

import React, { useState, useEffect } from 'react';
import { Settings, Trophy, HelpCircle, BarChart2 } from 'lucide-react';
import { useGame } from '@/lib/hooks/useGame';
import { useKeyboard } from '@/lib/hooks/useKeyboard';
import { useRankings } from '@/lib/hooks/useRankings';
import { useGameStats } from '@/lib/hooks/useGameStats';
import { useGameSettings } from '@/lib/hooks/useGameSettings';
import { sounds } from '@/lib/utils/sounds';
import { gameLogic } from '@/lib/utils/gameLogic';

// Components
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
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';

interface Puzzle {
  centerLetter: string;
  outerLetters: string[];
  validWords: string[];
  pangrams: string[];
}

interface ValidationResponse {
  valid: boolean;
  score?: number;
  isPangram?: boolean;
  error?: string;
}

export default function HomePage() {
  // Game state from hooks
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

  // Rankings, Stats, and Settings hooks
  const { rankings, loading: rankingsLoading } = useRankings();
  const { stats, loading: statsLoading } = useGameStats();
  const { settings, updateSetting } = useGameSettings();

  // Local state
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWordListOpen, setIsWordListOpen] = useState(false);
  const [isTimerEnabled, setIsTimerEnabled] = useState(settings.showTimer);
  const [isWordValid, setIsWordValid] = useState<boolean | undefined>(undefined);
  const [validationData, setValidationData] = useState<ValidationResponse | null>(null);
  const [modals, setModals] = useState({
    help: false,
    rankings: false,
    stats: false,
    settings: false
  });

  // Fetch puzzle data
  useEffect(() => {
    const fetchPuzzle = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/puzzle');
        if (!response.ok) throw new Error('Failed to fetch puzzle');
        const data = await response.json();
        
        setPuzzle({
          centerLetter: data.center_letter,
          outerLetters: data.other_letters.split(''),
          validWords: data.answers,
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

  // Keyboard handling
  useKeyboard({
    onEnter: handleSubmitWord,
    onDelete: deleteLetter,
    onLetter: addLetter,
    enabled: !Object.values(modals).some(isOpen => isOpen)
  });

  // Word submission handler
  async function handleSubmitWord() {
    if (!puzzle || currentWord.length < 4) {
      console.log('Word too short or no puzzle');
      return;
    }

    console.log('Attempting to submit word:', currentWord);

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

      const data: ValidationResponse = await response.json();
      setValidationData(data);
      console.log('Validation response:', data);

      if (data.valid) {
        setIsWordValid(true);
        submitWord(currentWord);
        
        setTimeout(() => {
          setIsWordValid(undefined);
          setValidationData(null);
        }, 1000);
        
        if (settings.soundEnabled) {
          if (data.isPangram) {
            sounds.playPangram();
          } else {
            sounds.playCorrect();
          }
        }
      } else {
        setIsWordValid(false);
        setTimeout(() => {
          setIsWordValid(undefined);
          setValidationData(null);
        }, 1000);
        
        if (settings.soundEnabled) {
          sounds.playIncorrect();
        }
      }
    } catch (err) {
      console.error('Error validating word:', err);
    }
  }

  // Letter shuffle handler
  function handleShuffle() {
    if (!puzzle) return;
    const shuffled = gameLogic.shuffleLetters(puzzle.outerLetters);
    setPuzzle(prev => prev ? { ...prev, outerLetters: shuffled } : null);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ErrorMessage message={error} />
      </div>
    );
  }

  if (!puzzle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ErrorMessage message="No puzzle available" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${settings.darkMode ? 'dark' : ''} bg-gray-50 dark:bg-gray-900`}>
      {/* Navigation Bar */}
      <nav className="bg-yellow-400 dark:bg-yellow-600 p-4 shadow-md">
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
      <WordDisplay 
        word={currentWord}
        isValid={isWordValid}
        score={validationData?.valid ? validationData.score : 0}
        isPangram={validationData?.valid ? validationData.isPangram : false}
      />

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
        currentWordLength={currentWord.length}
      />

      {/* Timer */}
      <Timer
        isEnabled={isTimerEnabled}
        onToggle={() => {
          setIsTimerEnabled(!isTimerEnabled);
          updateSetting('showTimer', !isTimerEnabled);
        }}
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
        stats={stats}
      />
      
      <SettingsModal
        isOpen={modals.settings}
        onClose={() => setModals(prev => ({ ...prev, settings: false }))}
        settings={settings}
        onSettingChange={updateSetting}
      />
    </div>
  );
}