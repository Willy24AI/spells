// components/game/StatsDisplay.tsx
import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CalendarDays, Award, Star } from 'lucide-react';
import { RankProgress } from './RankProgress';

interface GameStats {
  gamesPlayed: number;
  bestScore: number;
  currentStreak: number;
  completed_ranks?: Array<{
    title: string;
    score: number;
    completed_at: string;
  }>;
  recentGames?: Array<{
    date: string;
    score: number;
    words_found: number;
  }>;
}

const StatsDisplay = () => {
  const [activeTab, setActiveTab] = useState('current');
  const [stats, setStats] = useState<GameStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to load statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  const completedRankTitles = stats?.completed_ranks?.map(rank => rank.title) || [];

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="current">Todays Stats</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
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

        <TabsContent value="history">
          <div className="space-y-4">
            {stats?.recentGames?.map((game, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">
                      {new Date(game.date).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {game.words_found} words found
                    </div>
                  </div>
                  <div className="text-xl font-bold text-yellow-600">
                    {game.score}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ranks">
          <RankProgress 
            currentScore={stats?.bestScore || 0}
            maxScore={300}
            completedRanks={completedRankTitles}
            variant="full"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const StatCard = ({ title, value, icon }: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) => (
  <div className="bg-gray-50 rounded-lg p-4">
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <span className="text-sm text-gray-600">{title}</span>
    </div>
    <div className="text-2xl font-bold">{value}</div>
  </div>
);

export default StatsDisplay;