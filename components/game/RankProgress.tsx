import React, { useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { getRankLevels } from '@/lib/utils/rankSystem';

interface RankProgressProps {
  currentScore: number;
  maxScore: number;
  completedRanks?: string[];
  onRankUpdate?: (completedRanks: string[]) => void;
  variant?: 'compact' | 'full';
}

export function RankProgress({
  currentScore,
  maxScore,
  completedRanks = [],
  onRankUpdate,
  variant = 'full'
}: RankProgressProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Rank thresholds are derived from THIS puzzle's max score, so they always
  // reflect the puzzle of the day.
  const rankLevels = getRankLevels(maxScore);

  // Find current rank and next rank
  let currentRankIndex = 0;
  for (let i = rankLevels.length - 1; i >= 0; i--) {
    if (currentScore >= rankLevels[i].score) {
      currentRankIndex = i;
      break;
    }
  }

  const currentRank = rankLevels[currentRankIndex];
  const nextRank = rankLevels[currentRankIndex + 1];

  // Calculate progress to next rank
  const progressToNext = nextRank ?
    Math.min(((currentScore - currentRank.score) / (nextRank.score - currentRank.score)) * 100, 100) :
    100;

  // Calculate automatically completed ranks based on score
  const calculatedCompletedRanks = rankLevels
    .filter((rank, index) => index <= currentRankIndex)
    .map(rank => rank.title);

  // Current rank display
  const CurrentRankDisplay = () => (
    <div className="flex items-center justify-between bg-white/90 rounded-lg shadow-sm p-3">
      <div className="flex items-center space-x-2">
        <span className="text-2xl">{currentRank.icon}</span>
        <div className="flex flex-col">
          <span className="font-medium text-sm">{currentRank.title}</span>
          {nextRank && (
            <span className="text-xs text-gray-600">
              {nextRank.score - currentScore} points to {nextRank.title}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Progress value={progressToNext} className="w-24 h-2" />
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
    </div>
  );

  // Expanded ranks list
  const RanksList = () => (
    <div className="mt-2 max-h-[70vh] overflow-y-auto bg-white/90 rounded-lg shadow-sm">
      {rankLevels.map((rank, index) => {
        const isCompleted = calculatedCompletedRanks.includes(rank.title);
        const isCurrentRank = index === currentRankIndex;
        
        return (
          <div key={rank.title} 
            className={`p-3 ${
              index !== 0 ? 'border-t border-gray-100' : ''
            } ${
              isCurrentRank ? 'bg-yellow-50' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{rank.icon}</span>
                <div className="flex flex-col">
                  <span className="font-medium text-sm">{rank.title}</span>
                  <span className="text-xs text-gray-600">
                    {rank.score} points required
                  </span>
                </div>
              </div>
              {isCompleted && (
                <Badge 
                  variant="secondary"
                  className={isCurrentRank ? 'bg-yellow-200' : 'bg-green-100'}
                >
                  {isCurrentRank ? 'Current' : 'Completed'}
                </Badge>
              )}
            </div>
            {isCurrentRank && nextRank && (
              <Progress 
                value={progressToNext} 
                className="h-1 mt-2" 
              />
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="relative">
      <CurrentRankDisplay />
      {isExpanded && <RanksList />}
    </div>
  );
}