import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  RefreshCcw,
  Check,
  X,
  BarChart
} from 'lucide-react';

interface ScheduledPuzzle {
  id: string;
  scheduled_date: string;
  daily_puzzles?: {
    quality_score: number;
  };
}

interface MetricsData {
  aggregates: {
    averageQualityScore: number;
    averageWordCount: number;
    averageScore: number;
    totalPuzzles: number;
    wordLengthDistribution: Record<string, number>;
  };
}

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('schedule');
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [schedule, setSchedule] = useState<ScheduledPuzzle[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch schedule data
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const response = await fetch('/api/puzzle/schedule');
        const data = await response.json();
        setSchedule(data);
      } catch (error) {
        console.error('Error fetching schedule:', error);
      }
    };
    fetchSchedule();
  }, []);

  // Fetch metrics data
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/puzzle/quality');
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error('Error fetching metrics:', error);
      }
    };
    fetchMetrics();
  }, []);

  // Generate new puzzle
  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/puzzle/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate.toISOString().split('T')[0] })
      });
      const data = await response.json();
      
      // Refresh schedule after generation
      const scheduleResponse = await fetch('/api/puzzle/schedule');
      const scheduleData = await response.json();
      setSchedule(scheduleData);
    } catch (error) {
      console.error('Error generating puzzle:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Approve puzzle
  const handleApprove = async (puzzleId: string) => {
    try {
      await fetch('/api/puzzle/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'approve',
          puzzleId 
        })
      });
      // Refresh schedule
      const response = await fetch('/api/puzzle/schedule');
      const data = await response.json();
      setSchedule(data);
    } catch (error) {
      console.error('Error approving puzzle:', error);
    }
  };

  // Reject puzzle
  const handleReject = async (puzzleId: string) => {
    try {
      await fetch('/api/puzzle/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'reject',
          puzzleId 
        })
      });
      // Refresh schedule
      const response = await fetch('/api/puzzle/schedule');
      const data = await response.json();
      setSchedule(data);
    } catch (error) {
      console.error('Error rejecting puzzle:', error);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Puzzle Admin</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="dictionary">Dictionary</TabsTrigger>
        </TabsList>

        {/* Schedule Tab */}
        <TabsContent value="schedule">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Generate Puzzle</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="rounded-md border"
                  />
                  <Button 
                    onClick={handleGenerate}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <RefreshCcw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Generate
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Scheduled Puzzles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {schedule.map((puzzle) => (
                    <div 
                      key={puzzle.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium">
                          {new Date(puzzle.scheduled_date).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          Quality Score: {puzzle.daily_puzzles?.quality_score}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprove(puzzle.id)}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(puzzle.id)}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics">
          <Card>
            <CardHeader>
              <CardTitle>Puzzle Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics && (
                <div className="grid gap-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500">Average Quality</div>
                      <div className="text-2xl font-bold">
                        {metrics.aggregates.averageQualityScore.toFixed(1)}
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500">Average Words</div>
                      <div className="text-2xl font-bold">
                        {Math.round(metrics.aggregates.averageWordCount)}
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500">Average Score</div>
                      <div className="text-2xl font-bold">
                        {Math.round(metrics.aggregates.averageScore)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Word Length Distribution</h3>
                    {Object.entries(metrics.aggregates.wordLengthDistribution)
                      .sort(([a], [b]) => Number(a) - Number(b))
                      .map(([length, count]) => (
                        <div key={length} className="mb-2">
                          <div className="flex justify-between text-sm mb-1">
                            <span>{length} letters</span>
                            <span>{count}</span>
                          </div>
                          <Progress 
                            value={(count / metrics.aggregates.totalPuzzles) * 100} 
                          />
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dictionary Tab */}
        <TabsContent value="dictionary">
          <Card>
            <CardHeader>
              <CardTitle>Dictionary Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Input 
                    type="text"
                    placeholder="Search words..."
                    className="max-w-sm"
                  />
                </div>
                
                <div className="flex gap-4">
                  <Button variant="outline">
                    Import Words
                  </Button>
                  <Button variant="outline">
                    Export Dictionary
                  </Button>
                </div>

                {/* Word list would go here */}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;