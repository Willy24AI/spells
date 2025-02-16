// components/modals/StatsModal.tsx
"use client";

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { BarChart2, Award, Zap, Calendar, Target } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { GameStats } from '@/lib/types/game';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats?: GameStats;
}

export function StatsModal({ isOpen, onClose, stats }: StatsModalProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Your Statistics">
      <div className="space-y-6">
        {/* Overall Stats */}
        <div className="grid grid-cols-2 gap-4">
          <StatBox 
            icon={<Calendar className="w-5 h-5 text-yellow-500" />}
            label="Games Played"
            value={stats?.gamesPlayed ?? 0}
          />
          <StatBox 
            icon={<Target className="w-5 h-5 text-yellow-500" />}
            label="Average Score"
            value={stats?.averageScore ?? 0}
          />
          <StatBox 
            icon={<Award className="w-5 h-5 text-yellow-500" />}
            label="Best Score"
            value={stats?.bestScore ?? 0}
          />
          <StatBox 
            icon={<Zap className="w-5 h-5 text-yellow-500" />}
            label="Current Streak"
            value={stats?.currentStreak ?? 0}
          />
        </div>

        {/* Recent Games */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">Recent Games</h3>
          {(!stats?.recentGames || stats.recentGames.length === 0) ? (
            <div className="text-center py-4">
              <BarChart2 className="mx-auto h-12 w-12 text-yellow-400 mb-2" />
              <p className="text-gray-500">No games played yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.recentGames.map((game, index) => (
                <div 
                  key={index}
                  className="bg-gray-50 rounded-lg p-3"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">
                      {formatDate(game.date)}
                    </span>
                    <span className="font-semibold text-yellow-600">
                      {game.score} points
                    </span>
                  </div>
                  <Progress 
                    value={(game.score / (stats?.bestScore || 1)) * 100} 
                    className="h-2 bg-yellow-100"
                  />
                  <div className="mt-1 text-xs text-gray-500">
                    {game.words_found} words found
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Achievement Progress */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">Achievements</h3>
          <div className="space-y-2">
            <Achievement 
              title="Word Hunter"
              description="Find 100 words"
              progress={((stats?.gamesPlayed ?? 0) * 10)}
              total={100}
            />
            <Achievement 
              title="Streak Master"
              description="Maintain a 7-day streak"
              progress={stats?.currentStreak ?? 0}
              total={7}
            />
            <Achievement 
              title="High Scorer"
              description="Reach Queen Bee status"
              progress={stats?.bestScore ?? 0}
              total={275}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}

interface StatBoxProps {
  icon: React.ReactNode;
  label: string;
  value: number;
}

function StatBox({ icon, label, value }: StatBoxProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 text-center">
      <div className="flex justify-center mb-2">
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">
        {value}
      </div>
      <div className="text-sm text-gray-600">
        {label}
      </div>
    </div>
  );
}

interface AchievementProps {
  title: string;
  description: string;
  progress: number;
  total: number;
}

function Achievement({ title, description, progress, total }: AchievementProps) {
  const percentage = Math.min((progress / total) * 100, 100);
  const isComplete = percentage >= 100;

  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h4 className="font-medium text-gray-900">{title}</h4>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        {isComplete && (
          <Award className="w-5 h-5 text-yellow-500" />
        )}
      </div>
      <Progress 
        value={percentage} 
        className="h-2 bg-yellow-100" 
      />
      <div className="mt-1 text-xs text-gray-500">
        {progress} / {total}
      </div>
    </div>
  );
}