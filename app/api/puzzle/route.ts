// app/api/puzzle/route.ts

import { NextResponse } from 'next/server';
import { puzzleService } from '@/lib/services/puzzleService';
import { cacheService } from '@/lib/services/cacheService';
import { dateUtils } from '@/lib/utils/dateUtils';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || dateUtils.getDayKey(new Date());

    // Try to get puzzle from cache first
    const cachedPuzzle = cacheService.getPuzzle(date);
    if (cachedPuzzle) {
      return NextResponse.json(cachedPuzzle);
    }

    // Get puzzle from database
    const puzzle = await puzzleService.getPuzzle(date);
    if (!puzzle) {
      // Generate a new puzzle if none exists
      const { puzzle: generatedPuzzle } = await puzzleService.generatePuzzle({
        seed: date,
        minQualityScore: 80
      });

      // Cache the generated puzzle
      cacheService.setPuzzle(date, generatedPuzzle);
      
      return NextResponse.json(generatedPuzzle);
    }

    // Cache the retrieved puzzle
    cacheService.setPuzzle(date, puzzle);
    return NextResponse.json(puzzle);
  } catch (error) {
    console.error('Error getting puzzle:', error);
    return NextResponse.json(
      { error: 'Failed to get puzzle' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { date, options } = await req.json();
    
    // Generate a new puzzle
    const { puzzle, attempts, generationTime } = await puzzleService.generatePuzzle({
      seed: date,
      ...options
    });

    // Store the puzzle
    await puzzleService.storePuzzle(puzzle);

    // Clear cache for this date
    cacheService.clearPuzzle(date);

    return NextResponse.json({
      puzzle,
      metadata: {
        attempts,
        generationTime
      }
    });
  } catch (error) {
    console.error('Error generating puzzle:', error);
    return NextResponse.json(
      { error: 'Failed to generate puzzle' },
      { status: 500 }
    );
  }
}