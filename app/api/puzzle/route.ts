// app/api/puzzle/route.ts

import { NextResponse } from 'next/server';
import { puzzleService } from '@/lib/services/puzzleService';
import { cacheService } from '@/lib/services/cacheService';
import { dateUtils } from '@/lib/utils/dateUtils';
import type { GeneratedPuzzle } from '@/lib/types/puzzleGenerator';

// Force dynamic to ensure we don't cache the API response
export const dynamic = 'force-dynamic';

// Helper to safely format a date
function formatDate(date: Date): string {
  try {
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error formatting date:', error);
    return new Date().toISOString().split('T')[0];
  }
}

// Helper to get date range for puzzle generation
function getDateRange(): string[] {
  try {
    const dates: string[] = [];
    const today = new Date();
    
    for (let i = 0; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      dates.push(formatDate(date));
    }
    return dates;
  } catch (error) {
    console.error('Error generating date range:', error);
    return [formatDate(new Date())];
  }
}

// Initialize puzzles for the next week if needed
async function ensureUpcomingPuzzles() {
  try {
    const dates = getDateRange();
    console.log('Checking puzzles for dates:', dates);
    
    const existingDates = await puzzleService.checkExistingPuzzles(dates);
    console.log('Found existing puzzles for:', Array.from(existingDates));
    
    const neededDates = dates.filter(date => !existingDates.has(date));
    if (neededDates.length > 0) {
      console.log('Generating puzzles for dates:', neededDates);
      await puzzleService.schedulePuzzles({
        dates: neededDates,
        minQualityScore: 70,
        maxAttempts: 10,
        retryDelay: 1000
      });
    } else {
      console.log('All dates have puzzles already');
    }
  } catch (error) {
    console.error('Error ensuring upcoming puzzles:', error);
  }
}

// Helper to normalize puzzle data
function normalizePuzzleData(puzzle: any, generatedDate: string): GeneratedPuzzle {
  const validWords = Array.isArray(puzzle.validWords) 
    ? puzzle.validWords 
    : Array.isArray(puzzle.valid_words)
    ? puzzle.valid_words
    : [];

  const wordLengthDistribution = validWords.reduce((acc: Record<number, number>, word: string) => {
    const length = word.length;
    acc[length] = (acc[length] || 0) + 1;
    return acc;
  }, {});

  const averageWordLength = validWords.length
    ? validWords.reduce((sum: number, word: string) => sum + word.length, 0) / validWords.length
    : 0;

  return {
    id: puzzle.id || crypto.randomUUID(),
    centerLetter: puzzle.centerLetter || puzzle.center_letter,
    outerLetters: puzzle.outerLetters || puzzle.outer_letters || [],
    validWords,
    pangrams: puzzle.pangrams || [],
    maxScore: puzzle.maxScore || puzzle.max_score || 0,
    qualityScore: puzzle.qualityScore || puzzle.quality_score || 70,
    wordCount: validWords.length,
    averageWordLength,
    wordLengthDistribution,
    dateGenerated: generatedDate,
    generatorVersion: puzzle.generatorVersion || '1.0.0'
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let date = searchParams.get('date');
    
    if (date) {
      try {
        const parsedDate = new Date(date);
        date = formatDate(parsedDate);
      } catch (error) {
        console.error('Invalid date provided:', error);
        date = formatDate(new Date());
      }
    } else {
      date = formatDate(new Date());
    }

    await ensureUpcomingPuzzles();

    const cachedPuzzle = cacheService.getPuzzle(date);
    if (cachedPuzzle) {
      return NextResponse.json(normalizePuzzleData(cachedPuzzle, date));
    }

    let puzzle = await puzzleService.getPuzzle(date);
    
    if (!puzzle) {
      console.log(`No puzzle found for ${date}, generating new puzzle...`);
      
      const { puzzle: generatedPuzzle } = await puzzleService.generatePuzzle({
        seed: date,
        minQualityScore: 70
      });

      puzzle = generatedPuzzle;
    }

    const normalizedPuzzle = normalizePuzzleData(puzzle, date);
    
    // Store the normalized puzzle
    await puzzleService.storePuzzle(normalizedPuzzle);
    
    // Cache the normalized puzzle
    cacheService.setPuzzle(date, normalizedPuzzle);
    
    return NextResponse.json(normalizedPuzzle);
  } catch (error) {
    console.error('Error getting/generating puzzle:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get/generate puzzle',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { date, options } = await req.json();

    if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    const { puzzle, attempts, generationTime } = await puzzleService.generatePuzzle({
      seed: date,
      ...options
    });

    const normalizedPuzzle = normalizePuzzleData(puzzle, date);
    await puzzleService.storePuzzle(normalizedPuzzle);

    cacheService.clearPuzzle(date);

    return NextResponse.json({
      puzzle: normalizedPuzzle,
      metadata: {
        attempts,
        generationTime
      }
    });
  } catch (error) {
    console.error('Error generating puzzle:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate puzzle',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}