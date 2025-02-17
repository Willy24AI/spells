import React, { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface YesterdayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function YesterdayModal({ isOpen, onClose }: YesterdayModalProps) {
  const [data, setData] = useState<{
    valid_words: string[];
    pangrams: string[];
    center_letter: string;
    outer_letters: string[];
    max_score: number;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchYesterdaysPuzzle();
    }
  }, [isOpen]);

  const fetchYesterdaysPuzzle = async () => {
    try {
      setLoading(true);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];
      
      const response = await fetch(`/api/puzzle?date=${dateStr}`);
      if (!response.ok) throw new Error('Failed to fetch puzzle');
      
      const puzzleData = await response.json();
      setData(puzzleData);
    } catch (err) {
      setError('Failed to load yesterday\'s puzzle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Yesterday's Puzzle">
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : error ? (
          <div className="text-red-500 text-center py-4">{error}</div>
        ) : data ? (
          <>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-center mb-2">
                <span className="text-lg font-medium">Required Letters</span>
              </div>
              <div className="flex justify-center items-center space-x-2">
                <span className="bg-yellow-400 text-black px-3 py-1 rounded-md font-bold">
                  {data.center_letter}
                </span>
                {data.outer_letters.map((letter, index) => (
                  <span key={index} className="bg-gray-200 px-3 py-1 rounded-md">
                    {letter}
                  </span>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">All Words</span>
                <span className="text-sm text-gray-500">
                  {data.valid_words.length} words found
                </span>
              </div>

              <ScrollArea className="h-[300px] rounded-md border p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {data.valid_words.sort().map((word, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between bg-gray-50 p-2 rounded"
                    >
                      <span className="font-medium">{word}</span>
                      {data.pangrams.includes(word) && (
                        <Badge variant="default" className="ml-2">
                          Pangram
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="mt-4 text-center text-sm text-gray-500">
              Maximum Score: {data.max_score} points
            </div>
          </>
        ) : null}
      </div>
    </Modal>
  );
}