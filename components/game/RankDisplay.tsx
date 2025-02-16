import { Trophy } from 'lucide-react';
import { rankLevels, calculateRank } from '@/lib/utils/rankCalculator';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export default function RankDisplay({ score, maxScore }: { score: number; maxScore: number }) {
  const ranking = calculateRank(score);

  const getRankIcon = (rank: string) => {
    switch (rank) {
      case 'Queen Bee':
        return '👑';
      case 'Hive Elder':
        return '⭐';
      case 'Nectar Master':
        return '🌺';
      default:
        return '🐝';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4">
      {/* Current Rank Display */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getRankIcon(ranking.currentRank)}</span>
            <h2 className="text-2xl font-bold text-yellow-600">{ranking.currentRank}</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700 cursor-default"
            aria-label="Trophy icon"
          >
            <Trophy className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="relative pt-1">
          <Progress 
            value={ranking.progress}
            className="h-2 bg-yellow-100"
          />
        </div>

        {/* Points to Next Rank */}
        {ranking.pointsToNextRank && (
          <p className="text-sm text-gray-600 mt-2">
            {ranking.pointsToNextRank} points to advance to next rank
          </p>
        )}
      </div>
    </div>
  );
}