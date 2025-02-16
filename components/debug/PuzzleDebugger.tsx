// components/debug/PuzzleDebugger.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import type { GeneratedPuzzle } from '@/lib/types/puzzleGenerator';

interface PuzzleDebugState {
  puzzle: GeneratedPuzzle | null;
  error: string | null;
  loading: boolean;
  fetchAttempts: number;
}

export function PuzzleDebugger() {
  const [debugState, setDebugState] = useState<PuzzleDebugState>({
    puzzle: null,
    error: null,
    loading: true,
    fetchAttempts: 0
  });

  const [showWords, setShowWords] = useState(true);
  const [sortBy, setSortBy] = useState<'length' | 'alphabetical'>('length');
  const [selectedTab, setSelectedTab] = useState<'words' | 'metrics'>('words');

  const fetchPuzzle = async () => {
    try {
      setDebugState(prev => ({
        ...prev,
        loading: true,
        fetchAttempts: prev.fetchAttempts + 1
      }));

      const response = await fetch('/api/puzzle');
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
    fetchPuzzle();
  }, []);

  const sortWords = (words: string[]) => {
    if (sortBy === 'length') {
      return [...words].sort((a, b) => a.length - b.length || a.localeCompare(b));
    }
    return [...words].sort();
  };

  const renderPuzzleStats = (puzzle: GeneratedPuzzle) => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
      <div>
        <h3 className="font-medium">Letters:</h3>
        <p>Center: <span className="text-yellow-600 font-bold">{puzzle.centerLetter}</span></p>
        <p>Outer: {puzzle.outerLetters.join(', ')}</p>
      </div>
      <div>
        <h3 className="font-medium">Basic Stats:</h3>
        <p>Total Words: {puzzle.wordCount}</p>
        <p>Common Words: {puzzle.commonWordCount}</p>
        <p>Pangrams: {puzzle.pangrams.length}</p>
      </div>
      <div>
        <h3 className="font-medium">Scoring:</h3>
        <p>Max Score: {puzzle.maxScore}</p>
        <p>Quality Score: {Math.round(puzzle.qualityScore)}</p>
        <Badge 
          variant={puzzle.difficulty === 'easy' ? 'secondary' : 
                 puzzle.difficulty === 'medium' ? 'default' : 'destructive'}
        >
          {puzzle.difficulty.toUpperCase()} - Stage {puzzle.stage}
        </Badge>
      </div>
    </div>
  );

  const renderWordDistribution = (puzzle: GeneratedPuzzle) => (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h3 className="font-medium mb-2">Word Length Distribution:</h3>
      <div className="grid grid-cols-5 gap-4">
        {Object.entries(puzzle.wordLengthDistribution)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([length, count]) => (
            <div key={length} className="text-center">
              <div className="font-medium">{count}</div>
              <div className="text-sm text-gray-600">{length} letters</div>
              <div className="text-xs text-gray-500">
                {((count / puzzle.wordCount) * 100).toFixed(1)}%
              </div>
            </div>
          ))}
      </div>
    </div>
  );

  const renderMetrics = (puzzle: GeneratedPuzzle) => (
    <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
      <h3 className="font-medium mb-2">Detailed Metrics:</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium">Word Composition:</h4>
          <p>Average Length: {puzzle.averageWordLength.toFixed(1)}</p>
          <p>Short Word %: {(puzzle.shortWordPercentage * 100).toFixed(1)}%</p>
          <p>Common Word %: {(puzzle.metrics.commonWordPercentage).toFixed(1)}%</p>
        </div>
        <div>
          <h4 className="text-sm font-medium">Difficulty Metrics:</h4>
          <p>Difficulty Score: {Math.round(puzzle.metrics.difficultyScore)}</p>
          <p>Quality Score: {Math.round(puzzle.metrics.qualityScore)}</p>
          <p>Word Families: {puzzle.metrics.wordFamilyCount}</p>
        </div>
      </div>
    </div>
  );

  const renderWordList = (puzzle: GeneratedPuzzle) => {
    const sortedWords = sortWords(puzzle.validWords);
    return (
      <div className="mt-4 bg-gray-50 rounded-lg p-4">
        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-lg font-medium">Word List ({puzzle.validWords.length} words)</h3>
          <div className="space-x-2">
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
            {sortedWords.map((word, index) => (
              <TableRow key={index}>
                <TableCell>{word}</TableCell>
                <TableCell>{word.length}</TableCell>
                <TableCell>
                  {word.length === 4 ? 1 : word.length + (puzzle.pangrams.includes(word) ? 7 : 0)}
                </TableCell>
                <TableCell>
                  {puzzle.pangrams.includes(word) ? 
                    <Badge variant="warning">Pangram</Badge> : 
                    <Badge variant="secondary">Regular</Badge>
                  }
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto mt-4">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Puzzle Debugger</span>
          <div className="space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedTab('words')}
              className={selectedTab === 'words' ? 'bg-yellow-100' : ''}
            >
              Words
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSelectedTab('metrics')}
              className={selectedTab === 'metrics' ? 'bg-yellow-100' : ''}
            >
              Metrics
            </Button>
            <Button onClick={fetchPuzzle} variant="outline" size="sm">
              Refresh Puzzle
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {debugState.loading && (
            <div className="text-center p-4">Loading puzzle...</div>
          )}
          
          {debugState.puzzle && (
            <>
              {renderPuzzleStats(debugState.puzzle)}
              {renderWordDistribution(debugState.puzzle)}
              
              {selectedTab === 'metrics' ? (
                renderMetrics(debugState.puzzle)
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Words</h3>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowWords(!showWords)}
                    >
                      {showWords ? 'Hide Words' : 'Show Words'}
                    </Button>
                  </div>
                  {showWords && renderWordList(debugState.puzzle)}
                </>
              )}
            </>
          )}

          {debugState.error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-md">
              <h3 className="font-medium">Error:</h3>
              <p>{debugState.error}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}