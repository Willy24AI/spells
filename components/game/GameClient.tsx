"use client";

import React, { useState, useEffect } from 'react';
import { Trophy, Settings, HelpCircle, BarChart2, History } from 'lucide-react';
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

// Components
import { WordDisplay } from '@/components/game/WordDisplay';
import { WordList } from '@/components/game/WordList';
import { GameControls } from '@/components/game/GameControls';
import { Timer } from '@/components/game/Timer';
import { HelpModal } from '@/components/modals/HelpModal';
import { RankingsModal } from '@/components/modals/RankingsModal';
import { StatsModal } from '@/components/modals/StatsModal';
import { SettingsModal } from '@/components/modals/SettingsModal';
import { YesterdayModal } from '@/components/modals/YesterdayModal';
import { HoneycombGrid } from '@/components/game/HoneycombGrid';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { RankProgress } from '@/components/game/RankProgress';
import { Button } from '@/components/ui/button';

interface ModalState {
  help: boolean;
  rankings: boolean;
  stats: boolean;
  settings: boolean;
  yesterday: boolean;
}

export default function GameClient() {
  // Auth
  const { user } = useAuth();

  // Game state from hooks
  const {
    currentWord,
    correctWords,
    score,
    addLetter,
    deleteLetter,
    submitWord,
    clearWord
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
  const [completedRanks, setCompletedRanks] = useState<string[]>([]);
  const [modals, setModals] = useState<ModalState>({
    help: false,
    rankings: false,
    stats: false,
    settings: false,
    yesterday: false
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

  // Handle rank updates
  const handleRankUpdate = async (newCompletedRanks: string[]) => {
    if (!user) return;

    try {
      // Only update if there are new completed ranks
      if (newCompletedRanks.length > completedRanks.length) {
        await fetch('/api/stats/rankings/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            score: score,
            completedRanks: newCompletedRanks,
            date: dateUtils.getDayKey(new Date())
          })
        });

        setCompletedRanks(newCompletedRanks);
        refreshStats();
      }
    } catch (error) {
      console.error('Failed to update ranks:', error);
    }
  };

  // Keyboard handling
  useKeyboard({
    onEnter: handleSubmitWord,
    onDelete: deleteLetter,
    onLetter: addLetter,
    enabled: !Object.values(modals).some(isOpen => isOpen)
  });

  // Word submission handler
  async function handleSubmitWord() {
    if (!puzzle || currentWord.length < 4) return;

    try {
      // Reject already-found words up front so points can't be earned twice.
      const alreadyFound = correctWords.includes(currentWord);
      if (alreadyFound) {
        setValidationData({ valid: false, error: 'Already found' });
        setIsWordValid(false);
        clearWord();
        if (settings.soundEnabled) {
          playSoundEffect('incorrect');
        }
        setTimeout(() => {
          setIsWordValid(undefined);
          setValidationData(null);
        }, 1000);
        return;
      }

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
        // Award the word using the SAME score that is shown to the player.
        submitWord(currentWord, validation.score);

        // Play appropriate sound
        if (settings.soundEnabled) {
          playSoundEffect(validation.isPangram ? 'pangram' : 'correct');
        }

        // Update stats if user is authenticated
        if (user) {
          // Update game stats with the new running total
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

  // Sound effect helper
  function playSoundEffect(type: 'correct' | 'incorrect' | 'pangram' | 'gameOver') {
    const audio = new Audio(`/sounds/${type}.mp3`);
    audio.play().catch(console.error);
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <ErrorMessage message={error} />
      </div>
    );
  }

  if (!puzzle) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <ErrorMessage message="No puzzle available" />
      </div>
    );
  }

  return (
    <div className={`${settings.darkMode ? 'dark' : ''} bg-gray-50 dark:bg-gray-900`}>
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
                onClick={() => setModals(prev => ({ ...prev, yesterday: true }))}
                className="hidden sm:flex items-center space-x-2 hover:bg-yellow-300 transition-colors"
              >
                <History className="w-4 h-4" />
                <span>Yesterday</span>
              </Button>
            </div>

            <div className="flex items-center space-x-3 sm:space-x-6">
              <button
                onClick={() => setModals(prev => ({ ...prev, rankings: true }))}
                className="hover:text-yellow-700 transition-colors"
                aria-label="Rankings"
              >
                <Trophy className="sm:w-6 sm:h-6" />
              </button>
              <button
                onClick={() => setModals(prev => ({ ...prev, stats: true }))}
                className="hover:text-yellow-700 transition-colors"
                aria-label="Statistics"
              >
                <BarChart2 className="sm:w-6 sm:h-6" />
              </button>
              <button
                onClick={() => setModals(prev => ({ ...prev, settings: true }))}
                className="hover:text-yellow-700 transition-colors"
                aria-label="Settings"
              >
                <Settings className="sm:w-6 sm:h-6" />
              </button>
              <button
                onClick={() => setModals(prev => ({ ...prev, help: true }))}
                className="hover:text-yellow-700 transition-colors"
                aria-label="Help"
              >
                <HelpCircle className="sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* RankProgress moved from navbar to here, above WordDisplay */}
        <div className="mt-4 mb-6">
          <RankProgress
            currentScore={score}
            maxScore={puzzle.maxScore}
            onRankUpdate={handleRankUpdate}
            variant="compact"
          />
        </div>

        <WordDisplay
          word={currentWord}
          isValid={isWordValid}
          score={validationData?.score}
          isPangram={validationData?.isPangram}
        />

        <WordList
          words={correctWords}
          isOpen={isWordListOpen}
          onToggle={() => setIsWordListOpen(!isWordListOpen)}
        />

        <div className="max-w-2xl mx-auto mt-4 sm:mt-8">
          <HoneycombGrid
            centerLetter={puzzle.centerLetter}
            outerLetters={puzzle.outerLetters}
            onLetterClick={addLetter}
          />
        </div>

        <GameControls
          onDelete={deleteLetter}
          onShuffle={handleShuffle}
          onEnter={handleSubmitWord}
          currentWordLength={currentWord.length}
        />

        <Timer
          isEnabled={isTimerEnabled}
          onToggle={() => {
            setIsTimerEnabled(!isTimerEnabled);
            updateSetting('showTimer', !isTimerEnabled);
          }}
        />
      </div>

      <HelpModal
        isOpen={modals.help}
        onClose={() => setModals(prev => ({ ...prev, help: false }))}
      />

      <RankingsModal
        isOpen={modals.rankings}
        onClose={() => setModals(prev => ({ ...prev, rankings: false }))}
        currentScore={score}
        maxScore={puzzle.maxScore}
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

      <YesterdayModal
        isOpen={modals.yesterday}
        onClose={() => setModals(prev => ({ ...prev, yesterday: false }))}
      />
    </div>
  );
}
