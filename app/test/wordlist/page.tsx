'use client';

import React, { useState } from 'react';

interface WordListResults {
  totalWords: number;
  wordsByLength: Record<number, string[]>;
  pangrams: string[];
  pangram_count: number;
  stats: {
    processingTime: number;
    averageLength: number;
    shortWords: number;
    mediumWords: number;
    longWords: number;
  };
}

export default function WordListTester() {
  const [centerLetter, setCenterLetter] = useState('');
  const [outerLetters, setOuterLetters] = useState('');
  const [results, setResults] = useState<WordListResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async () => {
    if (!centerLetter || !outerLetters) {
      setError('Please enter both center letter and outer letters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/test/wordlist?center=${centerLetter}&outer=${outerLetters}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to test word list');
      }

      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">WordList Tester</h1>
        
        <div className="space-y-2">
          <div>
            <label className="block text-sm font-medium">
              Center Letter:
              <input
                type="text"
                value={centerLetter}
                onChange={(e) => setCenterLetter(e.target.value.toUpperCase())}
                maxLength={1}
                className="mt-1 block w-16 rounded-md border border-gray-300 px-3 py-2"
              />
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium">
              Outer Letters (comma-separated):
              <input
                type="text"
                value={outerLetters}
                onChange={(e) => setOuterLetters(e.target.value.toUpperCase())}
                placeholder="B,C,D,E,F,G"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              />
            </label>
          </div>

          <button
            onClick={handleTest}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test WordList'}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {results && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded p-4">
                <h2 className="font-semibold mb-2">Statistics</h2>
                <ul className="space-y-1 text-sm">
                  <li>Total Words: {results.totalWords}</li>
                  <li>Pangrams: {results.pangram_count}</li>
                  <li>Processing Time: {results.stats.processingTime.toFixed(2)}ms</li>
                  <li>Average Length: {results.stats.averageLength.toFixed(2)}</li>
                  <li>Short Words (≤5): {results.stats.shortWords}</li>
                  <li>Medium Words (6-7): {results.stats.mediumWords}</li>
                  <li>Long Words (≥8): {results.stats.longWords}</li>
                </ul>
              </div>

              <div className="border rounded p-4">
                <h2 className="font-semibold mb-2">Pangrams ({results.pangram_count})</h2>
                <div className="space-y-1 text-sm">
                  {results.pangrams.map((word: string) => (
                    <div key={word}>{word}</div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border rounded p-4">
              <h2 className="font-semibold mb-2">Words by Length</h2>
              <div className="grid grid-cols-4 gap-4">
                {Object.entries(results.wordsByLength).map(([length, words]) => (
                  <div key={length} className="text-sm">
                    <h3 className="font-medium">{length} Letters ({words.length})</h3>
                    <div className="mt-1 space-y-1">
                      {words.map((word: string) => (
                        <div key={word}>{word}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}