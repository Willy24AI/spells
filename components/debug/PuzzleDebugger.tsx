"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import type { GeneratedPuzzle } from '@/lib/types/puzzleGenerator';

interface PuzzleDebugState {
  puzzle: GeneratedPuzzle | null;
  error: string | null;
  loading: boolean;
  fetchAttempts: number;
}

interface PuzzleDebuggerProps {
  initialPuzzle?: GeneratedPuzzle;
}

export function PuzzleDebugger({ initialPuzzle }: PuzzleDebuggerProps = {}) {
  const [debugState, setDebugState] = useState<PuzzleDebugState>({
    puzzle: initialPuzzle || null,
    error: null,
    loading: !initialPuzzle,
    fetchAttempts: 0
  });

  const [sortBy, setSortBy] = useState<'length' | 'alphabetical'>('length');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'words' | 'metrics' | 'debug'>('overview');
  const [showAll, setShowAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchPuzzle = async () => {
    try {
      setDebugState(prev => ({
        ...prev,
        loading: true,
        fetchAttempts: prev.fetchAttempts + 1
      }));

      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/puzzle/generate`);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setDebugState(prev => ({
        ...prev,
        puzzle: data,
        loading: false,
        error: null
      }));
    } catch (error) {
      console.error('Puzzle fetch error:', error);
      setDebugState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An error occurred',
        loading: false
      }));
    }
  };

  useEffect(() => {
    if (!initialPuzzle) {
      fetchPuzzle();
    }
  }, [initialPuzzle]);

  const sortWords = (words: string[]) => {
    if (!Array.isArray(words)) return [];
    if (sortBy === 'length') {
      return [...words].sort((a, b) => b.length - a.length || a.localeCompare(b));
    }
    return [...words].sort();
  };

  const filterWords = (words: string[]) => {
    if (!searchTerm) return words;
    return words.filter(word => 
      word.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const renderOverview = (puzzle: GeneratedPuzzle) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Letter Set</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid place-items-center gap-4">
              <div className="text-4xl font-bold text-yellow-600">
                {puzzle.centerLetter?.toUpperCase()}
              </div>
              <div className="flex gap-2 text-2xl">
                {puzzle.outerLetters?.map((letter, i) => (
                  <span key={i} className="text-blue-600">{letter.toUpperCase()}</span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Basic Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-2">
              <dt>Total Words:</dt>
              <dd className="font-mono">{puzzle.wordCount}</dd>
              <dt>Pangrams:</dt>
              <dd className="font-mono">{puzzle.pangrams?.length || 0}</dd>
              <dt>Max Score:</dt>
              <dd className="font-mono">{puzzle.maxScore}</dd>
              <dt>Quality Score:</dt>
              <dd className="font-mono">{Math.round(puzzle.qualityScore)}</dd>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Word Length Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-4">
            {Object.entries(puzzle.wordLengthDistribution || {})
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([length, count]) => (
                <div key={length} className="text-center p-2 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold">{count}</div>
                  <div className="text-sm text-gray-600">{length} letters</div>
                  <div className="text-xs text-gray-500">
                    {((count / puzzle.wordCount) * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderWordList = (puzzle: GeneratedPuzzle) => {
    const allWords = puzzle.validWords || [];
    const sortedWords = sortWords(allWords);
    const filteredWords = filterWords(sortedWords);
    const displayWords = showAll ? filteredWords : filteredWords.slice(0, 100);

    return (
      <div className="space-y-4">
        <div className="flex gap-4 items-center">
          <input
            type="text"
            placeholder="Search words..."
            className="px-3 py-2 border rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortBy('length')}
            className={sortBy === 'length' ? 'bg-yellow-100' : ''}
          >
            Sort by Length
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortBy('alphabetical')}
            className={sortBy === 'alphabetical' ? 'bg-yellow-100' : ''}
          >
            Sort A-Z
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Word</TableHead>
              <TableHead>Length</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayWords.map((word, index) => (
              <TableRow key={index}>
                <TableCell className="font-mono">{word}</TableCell>
                <TableCell>{word.length}</TableCell>
                <TableCell>
                  {word.length === 4 ? 1 : word.length + 
                    (puzzle.pangrams?.includes(word) ? 7 : 0)}
                </TableCell>
                <TableCell>
                  {puzzle.pangrams?.includes(word) ? 
                    <Badge variant="destructive">Pangram</Badge> : 
                    <Badge variant="secondary">Regular</Badge>
                  }
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {!showAll && filteredWords.length > 100 && (
          <Button onClick={() => setShowAll(true)}>
            Show All ({filteredWords.length} words)
          </Button>
        )}
      </div>
    );
  };

  const renderMetrics = (puzzle: GeneratedPuzzle) => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Quality Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4">
            <dt>Quality Score:</dt>
            <dd className="font-mono">{Math.round(puzzle.qualityScore)}</dd>
            <dt>Difficulty:</dt>
            <dd>
              <Badge 
                variant={
                  puzzle.difficulty === 'easy' ? 'secondary' : 
                  puzzle.difficulty === 'medium' ? 'default' : 
                  'destructive'
                }
              >
                {puzzle.difficulty.toUpperCase()} - Stage {puzzle.stage}
              </Badge>
            </dd>
            <dt>Word Count:</dt>
            <dd className="font-mono">{puzzle.wordCount}</dd>
            <dt>Common Words:</dt>
            <dd className="font-mono">{puzzle.commonWordCount}</dd>
            <dt>Average Length:</dt>
            <dd className="font-mono">{puzzle.averageWordLength.toFixed(2)}</dd>
            <dt>Short Word %:</dt>
            <dd className="font-mono">{puzzle.shortWordPercentage.toFixed(2)}%</dd>
            <dt>Word Families:</dt>
            <dd className="font-mono">{puzzle.metrics.wordFamilyCount}</dd>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Technical Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4">
            <dt>Generator Version:</dt>
            <dd className="font-mono">{puzzle.generatorVersion}</dd>
            <dt>Generation Date:</dt>
            <dd className="font-mono">{new Date(puzzle.dateGenerated).toLocaleString()}</dd>
            <dt>Puzzle ID:</dt>
            <dd className="font-mono text-sm">{puzzle.id}</dd>
          </dl>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <Card className="w-full max-w-5xl mx-auto mt-4">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Puzzle Debugger</CardTitle>
          <Button 
            onClick={fetchPuzzle} 
            variant="outline"
            disabled={debugState.loading}
          >
            {debugState.loading ? 'Generating...' : 'Generate New Puzzle'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {debugState.error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{debugState.error}</AlertDescription>
          </Alert>
        )}

        {debugState.puzzle && (
          <Tabs value={selectedTab} onValueChange={(value: any) => setSelectedTab(value)}>
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="words">Words</TabsTrigger>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              {renderOverview(debugState.puzzle)}
            </TabsContent>

            <TabsContent value="words">
              {renderWordList(debugState.puzzle)}
            </TabsContent>

            <TabsContent value="metrics">
              {renderMetrics(debugState.puzzle)}
            </TabsContent>
          </Tabs>
        )}

        {debugState.loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2">Generating puzzle...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}