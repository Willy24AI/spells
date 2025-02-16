// app/api/puzzle/route.ts

import { NextResponse } from 'next/server';
import { puzzleService } from '@/lib/services/puzzleService';
import { cacheService } from '@/lib/services/cacheService';
import { dateUtils } from '@/lib/utils/dateUtils';

// Force dynamic to ensure we don't cache the API response
export const dynamic = 'force-dynamic';

// Helper to safely format a date
function formatDate(date: Date): string {
  try {
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error formatting date:', error);
    // Return today's date as fallback
    return new Date().toISOString().split('T')[0];
  }
}

// Helper to get date range for puzzle generation
function getDateRange(): string[] {
  try {
    const dates: string[] = [];
    const today = new Date();
    
    // Include today and next 7 days
    for (let i = 0; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      dates.push(formatDate(date));
    }
    return dates;
  } catch (error) {
    console.error('Error generating date range:', error);
    return [formatDate(new Date())]; // Return today as fallback
  }
}

// Initialize puzzles for the next week if needed
async function ensureUpcomingPuzzles() {
  try {
    const dates = getDateRange();
    console.log('Checking puzzles for dates:', dates);
    
    // Check for existing puzzles
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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let date = searchParams.get('date');
    
    // Validate and format the date
    if (date) {
      try {
        // Ensure date is in correct format
        const parsedDate = new Date(date);
        date = formatDate(parsedDate);
      } catch (error) {
        console.error('Invalid date provided:', error);
        date = formatDate(new Date()); // Fallback to today
      }
    } else {
      date = formatDate(new Date()); // No date provided, use today
    }

    // Ensure we have upcoming puzzles
    await ensureUpcomingPuzzles();

    // Try to get puzzle from cache first
    const cachedPuzzle = cacheService.getPuzzle(date);
    if (cachedPuzzle) {
      return NextResponse.json(cachedPuzzle);
    }

    // Get puzzle from database
    let puzzle = await puzzleService.getPuzzle(date);
    
    // If no puzzle exists, generate one
    if (!puzzle) {
      console.log(`No puzzle found for ${date}, generating new puzzle...`);
      
      const { puzzle: generatedPuzzle } = await puzzleService.generatePuzzle({
        seed: date,
        minQualityScore: 70
      });

      // Store the generated puzzle
      await puzzleService.storePuzzle({
        ...generatedPuzzle,
        dateGenerated: date
      });

      puzzle = generatedPuzzle;
    }

    // Cache the puzzle
    cacheService.setPuzzle(date, puzzle);
    
    return NextResponse.json(puzzle);
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

    // Validate and format the date
    if (!date || !date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Generate a new puzzle
    const { puzzle, attempts, generationTime } = await puzzleService.generatePuzzle({
      seed: date,
      ...options
    });

    // Store the puzzle
    await puzzleService.storePuzzle({
      ...puzzle,
      dateGenerated: date
    });

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
      { 
        error: 'Failed to generate puzzle',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}