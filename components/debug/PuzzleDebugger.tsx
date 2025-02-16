// components/debug/PuzzleDebugger.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface PuzzleDebugState {
  puzzle: any;
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

  useEffect(() => {
    const fetchPuzzle = async () => {
      try {
        setDebugState(prev => ({
          ...prev,
          loading: true,
          fetchAttempts: prev.fetchAttempts + 1
        }));

        const response = await fetch('/api/puzzle');
        const data = await response.json();

        console.log('Raw puzzle data:', data);

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

    fetchPuzzle();
  }, []);

  return (
    <Card className="w-full max-w-2xl mx-auto mt-4">
      <CardHeader>
        <CardTitle>Puzzle Debugger</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="font-medium">Status:</div>
            <div>
              {debugState.loading ? 'Loading...' : 
               debugState.error ? 'Error' : 
               debugState.puzzle ? 'Loaded' : 'Unknown'}
            </div>
            
            <div className="font-medium">Fetch Attempts:</div>
            <div>{debugState.fetchAttempts}</div>
          </div>

          {debugState.error && (
            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-md">
              <div className="font-medium">Error:</div>
              <div>{debugState.error}</div>
            </div>
          )}

          {debugState.puzzle && (
            <div className="mt-4 space-y-2">
              <div className="font-medium">Puzzle Data:</div>
              <pre className="p-4 bg-gray-50 rounded-md overflow-auto max-h-96">
                {JSON.stringify(debugState.puzzle, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}