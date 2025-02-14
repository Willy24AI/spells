"use client";

import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WordListProps {
  words: string[];
  isOpen: boolean;
  onToggle: () => void;
}

export function WordList({ words, isOpen, onToggle }: WordListProps) {
  return (
    <div className="max-w-md mx-auto mt-4 px-4">
      <div 
        className="bg-white rounded-lg cursor-pointer shadow-md hover:shadow-lg transition-shadow"
        onClick={onToggle}
      >
        <div className="p-3 sm:p-4 flex justify-between items-center">
          <span className="text-sm sm:text-base text-gray-600 font-medium">
            {words.length === 0 ? "Your words" : `${words.length} words found`}
          </span>
          <ChevronDown 
            className={cn(
              "transform transition-transform duration-200",
              isOpen ? "rotate-180" : ""
            )}
          />
        </div>
        
        {isOpen && (
          <div className="border-t border-gray-100">
            <div className="max-h-48 sm:max-h-60 overflow-y-auto">
              {words.length === 0 ? (
                <div className="p-3 sm:p-4 text-center text-gray-500 text-sm sm:text-base">
                  No words found yet
                </div>
              ) : (
                <div className="p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {words.map((word, index) => (
                    <div 
                      key={index} 
                      className="text-gray-800 font-medium text-sm sm:text-base"
                    >
                      {word}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}