// lib/types/game.ts

export interface GameStatsRecord {
    date: string;
    score: number;
    words_found: number;
  }
  
  export interface GameStats {
    gamesPlayed: number;
    averageScore: number;
    bestScore: number;
    currentStreak: number;
    longestStreak: number;
    recentGames: GameStatsRecord[];
  }
  
  export interface ValidationResponse {
    valid: boolean;
    score?: number;
    isPangram?: boolean;
    error?: string;
  }
  
  export interface Puzzle {
    centerLetter: string;
    outerLetters: string[];
    validWords: string[];
    pangrams: string[];
    maxScore: number; 
  }