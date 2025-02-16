"use client"

import React, { useState, useEffect } from 'react';
import { Settings, Trophy, HelpCircle, BarChart2 } from 'lucide-react';
import { useGame } from '@/lib/hooks/useGame';
import { useKeyboard } from '@/lib/hooks/useKeyboard';
import { useRankings } from '@/lib/hooks/useRankings';
import { useGameStats } from '@/lib/hooks/useGameStats';
import { useGameSettings } from '@/lib/hooks/useGameSettings';
import { gameLogic } from '@/lib/utils/gameLogic';
import { useAuth } from '@/lib/hooks/useAuth';
import { statsTracking } from '@/lib/utils/statsTracking';
import { dateUtils } from '@/lib/utils/dateUtils';
import type { ValidationResponse, Puzzle } from '@/lib/types/game';
import type { GeneratedPuzzle } from '@/lib/types/puzzleGenerator';

// Components
import { PuzzleDebugger } from '@/components/debug/PuzzleDebugger';
import { WordDisplay } from '@/components/game/WordDisplay';
import { WordList } from '@/components/game/WordList';
import { ProgressBar } from '@/components/game/ProgressBar';
import { GameControls } from '@/components/game/GameControls';
import { Timer } from '@/components/game/Timer';
import { HelpModal } from '@/components/modals/HelpModal';
import { RankingsModal } from '@/components/modals/RankingsModal';
import { StatsModal } from '@/components/modals/StatsModal';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { HoneycombGrid } from '@/components/game/HoneycombGrid';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import RankDisplay from '@/components/game/RankDisplay';

function playSoundEffect(type: 'correct' | 'incorrect' | 'pangram' | 'gameOver') {
  const audio = new Audio(`/sounds/${type}.mp3`);
  audio.play().catch(() => {
    console.log('Sound playback failed - this is normal if user hasn\'t interacted with the page yet');
  });
}

// Convert Puzzle to GeneratedPuzzle
function convertToGeneratedPuzzle(puzzle: Puzzle): GeneratedPuzzle {
  return {
    id: crypto.randomUUID(),
    centerLetter: puzzle.centerLetter,
    outerLetters: puzzle.outerLetters,
    validWords: puzzle.validWords,
    pangrams: puzzle.pangrams,
    maxScore: puzzle.maxScore,
    qualityScore: 0,
    wordCount: puzzle.validWords.length,
    commonWordCount: puzzle.validWords.filter(word => word.length <= 6).length,
    shortWordPercentage: (puzzle.validWords.filter(word => word.length <= 5).length / puzzle.validWords.length) * 100,
    averageWordLength: puzzle.validWords.reduce((sum, word) => sum + word.length, 0) / puzzle.validWords.length,
    wordLengthDistribution: puzzle.validWords.reduce((acc, word) => {
      acc[word.length] = (acc[word.length] || 0) + 1;
      return acc;
    }, {} as Record<number, number>),
    difficulty: 'medium',
    stage: 1,
    metrics: {
      wordCount: puzzle.validWords.length,
      uniqueLetters: 7,
      pangramCount: puzzle.pangrams.length,
      averageWordLength: puzzle.validWords.reduce((sum, word) => sum + word.length, 0) / puzzle.validWords.length,
      commonWordPercentage: (puzzle.validWords.filter(word => word.length <= 6).length / puzzle.validWords.length) * 100,
      difficultyScore: 0,
      qualityScore: 0,
      wordFamilyCount: new Set(puzzle.validWords.map(word => word.toLowerCase())).size
    },
    dateGenerated: new Date().toISOString(),
    generatorVersion: '1.0.0',
    date: dateUtils.getDayKey(new Date())
  };
}

export default function HomePage() {
  // Auth
  const { user } = useAuth();

  // Game state from hooks
  const {
    currentWord,
    correctWords,
    score,
    addLetter,
    deleteLetter,
    submitWord
  } = useGame();

  // Rankings, Stats, and Settings hooks
  const { refreshRankings } = useRankings();
  const { stats, refreshStats } = useGameStats();
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
        const today = dateUtils.getDayKey(new Date());
        const response = await fetch(`/api/puzzle?date=${today}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch puzzle: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }

        // Verify puzzle data
        if (!data.center_letter || !Array.isArray(data.outer_letters)) {
          throw new Error('Invalid puzzle format');
        }

        // Format and set puzzle
        setPuzzle({
          centerLetter: data.center_letter.toUpperCase(),
          outerLetters: data.outer_letters.map((l: string) => l.toUpperCase()),
          validWords: data.valid_words || [],
          pangrams: data.pangrams || [],
          maxScore: data.max_score || 0
        });
        setError(null);
      } catch (err) {
        console.error('Error fetching puzzle:', err);
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
      console.log('Word too short or no puzzle loaded');
      return;
    }

    try {
      // Validate word using game logic
      const validation = await gameLogic.validateWord(
        currentWord,
        puzzle.validWords,
        puzzle.pangrams,
        {
          centerLetter: puzzle.centerLetter,
          outerLetters: puzzle.outerLetters
        }
      );

      setValidationData(validation);
      setIsWordValid(validation.valid);

      if (validation.valid && validation.score !== undefined) {
        // Submit word
        submitWord(currentWord);

        // Play appropriate sound
        if (settings.soundEnabled) {
          playSoundEffect(validation.isPangram ? 'pangram' : 'correct');
        }

        // Update stats if user is authenticated
        if (user) {
          await statsTracking.updateGameStats(
            user.id,
            score + validation.score,
            [...correctWords, currentWord]
          );
          refreshStats();
          refreshRankings();
        }

        // Check for game completion
        if (gameLogic.isGameComplete(
          [...correctWords, currentWord],
          puzzle.validWords
        )) {
          if (settings.soundEnabled) {
            playSoundEffect('gameOver');
          }
        }
      } else {
        // Handle invalid word
        if (settings.soundEnabled) {
          playSoundEffect('incorrect');
        }
      }

      // Reset validation state after delay
      setTimeout(() => {
        setIsWordValid(undefined);
        setValidationData(null);
      }, 1000);
    } catch (err) {
      console.error('Error validating word:', err);
      setIsWordValid(false);
      setTimeout(() => {
        setIsWordValid(undefined);
        setValidationData(null);
      }, 1000);
    }
  }

  // Letter shuffle handler
  function handleShuffle() {
    if (!puzzle) return;
    const shuffled = gameLogic.shuffleLetters(puzzle.outerLetters);
    setPuzzle(prev => prev ? { ...prev, outerLetters: shuffled } : null);
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ErrorMessage message={error} />
      </div>
    );
  }

  // No puzzle state
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
              <span className="font-bold text-lg">
                Daily Bee
              </span>
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

      {/* Game Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Puzzle Debugger - Development Only */}
        {process.env.NODE_ENV === 'development' && puzzle && (
          <div className="mb-8">
            <PuzzleDebugger initialPuzzle={convertToGeneratedPuzzle(puzzle)} />
          </div>
        )}

        {/* Rank Display */}
        <RankDisplay score={score} maxScore={puzzle.maxScore} />

        {/* Progress */}
        <ProgressBar score={score} maxScore={puzzle.maxScore} />

        {/* Word Display */}
        <WordDisplay 
          word={currentWord}
          isValid={isWordValid}
          score={validationData?.score}
          isPangram={validationData?.isPangram}
        />

        {/* Word List */}
        <WordList
          words={correctWords}
          isOpen={isWordListOpen}
          onToggle={() => setIsWordListOpen(!isWordListOpen)}
        />

        {/* Game Grid */}
        <div className="max-w-2xl mx-auto mt-4 sm:mt-8">
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
      </div>

      {/* Modals */}
      <HelpModal
        isOpen={modals.help}
        onClose={() => setModals(prev => ({ ...prev, help: false }))}
      />
      
      <RankingsModal
        isOpen={modals.rankings}
        onClose={() => setModals(prev => ({ ...prev, rankings: false }))}
        currentScore={score}
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