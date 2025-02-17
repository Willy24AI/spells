import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CalendarDays, Award, Star } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface GameStats {
  gamesPlayed: number;
  bestScore: number;
}

interface YesterdaysPuzzle {
  valid_words: string[];
  pangrams: string[];
  center_letter: string;
  outer_letters: string[];
  max_score: number;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
}

const rankLevels = [
  { title: 'Worker Bee', score: 0, icon: '🐝' },
  { title: 'Busy Bee', score: 15, icon: '🐝' },
  { title: 'Honey Maker', score: 35, icon: '🐝' },
  { title: 'Hive Scout', score: 60, icon: '🐝' },
  { title: 'Royal Guard', score: 100, icon: '🐝' },
  { title: 'Nectar Master', score: 150, icon: '🌺' },
  { title: 'Hive Elder', score: 200, icon: '⭐' },
  { title: 'Queen Bee', score: 275, icon: '👑' }
] as const;

const StatsDisplay = () => {
  const [activeTab, setActiveTab] = useState('current');
  const [stats, setStats] = useState<GameStats | null>(null);
  const [yesterdaysWords, setYesterdaysWords] = useState<YesterdaysPuzzle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
    fetchYesterdaysWords();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchYesterdaysWords = async () => {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];
      
      const response = await fetch(`/api/puzzle?date=${dateStr}`);
      const data = await response.json();
      setYesterdaysWords(data);
    } catch (err) {
      console.error('Failed to load yesterday&apos;s words:', err);
    }
  };

  const getCompletedRanks = (totalScore: number) => {
    return rankLevels.filter(rank => totalScore >= rank.score);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>;

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="current">Today&apos;s Stats</TabsTrigger>
          <TabsTrigger value="yesterday">Yesterday&apos;s Words</TabsTrigger>
          <TabsTrigger value="ranks">Rank Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="current">
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              title="Games Played"
              value={stats?.gamesPlayed || 0}
              icon={<CalendarDays className="w-5 h-5 text-yellow-500" />}
            />
            <StatCard
              title="Best Score"
              value={stats?.bestScore || 0}
              icon={<Star className="w-5 h-5 text-yellow-500" />}
            />
          </div>
        </TabsContent>

        <TabsContent value="yesterday">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Yesterday&apos;s Puzzle Words</h3>
            {yesterdaysWords ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {yesterdaysWords.valid_words.sort().map((word: string, index: number) => (
                  <div key={index} className="p-2 bg-gray-50 rounded">
                    <span className="font-medium">
                      {word}
                      {yesterdaysWords.pangrams.includes(word) && (
                        <Badge className="ml-2" variant="secondary">Pangram</Badge>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500">No data available</div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="ranks">
          <div className="space-y-4">
            {rankLevels.map((rank, index) => {
              const isCompleted = (stats?.bestScore ?? 0) >= rank.score;
              const nextRank = rankLevels[index + 1];
              const progress = nextRank 
                ? Math.min(((stats?.bestScore ?? 0) - rank.score) / (nextRank.score - rank.score) * 100, 100)
                : 100;

              return (
                <div key={rank.title} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{rank.icon}</span>
                      <span className="font-medium">{rank.title}</span>
                    </div>
                    {isCompleted && (
                      <Badge variant="secondary">Completed</Badge>
                    )}
                  </div>
                  <Progress value={progress} className="h-2" />
                  {nextRank && (
                    <div className="text-sm text-gray-500 mt-1">
                      {isCompleted 
                        ? `Next: ${nextRank.title} at ${nextRank.score} points`
                        : `${rank.score} points required`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const StatCard = ({ title, value, icon }: StatCardProps) => (
  <div className="bg-gray-50 rounded-lg p-4">
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <span className="text-sm text-gray-600">{title}</span>
    </div>
    <div className="text-2xl font-bold">{value}</div>
  </div>
);

export default StatsDisplay;