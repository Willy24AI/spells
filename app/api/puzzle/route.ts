// app/api/puzzle/route.ts

import { NextResponse } from 'next/server';
import { puzzleService } from '@/lib/services/puzzleService';
import { cacheService } from '@/lib/services/cacheService';
import { dateUtils } from '@/lib/utils/dateUtils';
import type { GeneratedPuzzle, PuzzleMetrics } from '@/lib/types/puzzleGenerator';

export const dynamic = 'force-dynamic';

function formatDate(date: Date): string {
  try {
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error formatting date:', error);
    return new Date().toISOString().split('T')[0];
  }
}

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
        retryDelay: 1000,
        difficultyProgression: true,
        stageVariation: true,
        requireCommonWords: true
      });
    } else {
      console.log('All dates have puzzles already');
    }
  } catch (error) {
    console.error('Error ensuring upcoming puzzles:', error);
  }
}

function calculatePuzzleMetrics(validWords: string[], pangrams: string[]): PuzzleMetrics {
  const wordLengthDistribution = validWords.reduce((acc: Record<number, number>, word: string) => {
    acc[word.length] = (acc[word.length] || 0) + 1;
    return acc;
  }, {});

  const total = validWords.length;
  const fourLetterCount = wordLengthDistribution[4] || 0;
  const fiveLetterCount = wordLengthDistribution[5] || 0;
  const longWordCount = Object.entries(wordLengthDistribution)
    .filter(([length]) => parseInt(length) >= 7)
    .reduce((sum, [_, count]) => sum + count, 0);

  return {
    totalWords: total,
    maxScore: validWords.reduce((sum, word) => {
      const baseScore = word.length === 4 ? 1 : word.length;
      const pangramBonus = pangrams.includes(word) ? 7 : 0;
      return sum + baseScore + pangramBonus;
    }, 0),
    pangramCount: pangrams.length,
    averageWordLength: validWords.reduce((sum, word) => sum + word.length, 0) / total,
    wordLengthDistribution,
    commonWordPercentage: ((fourLetterCount + fiveLetterCount) / total) * 100,
    difficultyScore: Math.min(100, 
      ((fourLetterCount + fiveLetterCount) / total * 40) +
      (longWordCount / total * 30) +
      (pangrams.length * 10)
    ),
    qualityScore: 70, // Default quality score
    fourLetterWordCount: fourLetterCount,
    fiveLetterWordCount: fiveLetterCount,
    longWordCount,
    wordFamilyCount: new Set(validWords.map(word => {
      if (word.endsWith('ing')) return word.slice(0, -3);
      if (word.endsWith('ed')) return word.slice(0, -2);
      if (word.endsWith('s')) return word.slice(0, -1);
      return word;
    })).size
  };
}

function normalizePuzzleData(puzzle: any, generatedDate: string): GeneratedPuzzle {
  const validWords = Array.isArray(puzzle.validWords) 
    ? puzzle.validWords 
    : Array.isArray(puzzle.valid_words)
    ? puzzle.valid_words
    : [];

  const pangrams = Array.isArray(puzzle.pangrams)
    ? puzzle.pangrams
    : [];

  const metrics = calculatePuzzleMetrics(validWords, pangrams);

  return {
    id: puzzle.id || crypto.randomUUID(),
    centerLetter: puzzle.centerLetter || puzzle.center_letter,
    outerLetters: puzzle.outerLetters || puzzle.outer_letters || [],
    validWords,
    pangrams,
    maxScore: metrics.maxScore,
    qualityScore: puzzle.qualityScore || puzzle.quality_score || metrics.qualityScore,
    wordCount: validWords.length,
    averageWordLength: metrics.averageWordLength,
    wordLengthDistribution: metrics.wordLengthDistribution,
    commonWordCount: metrics.fourLetterWordCount + metrics.fiveLetterWordCount,
    shortWordPercentage: (metrics.fourLetterWordCount + metrics.fiveLetterWordCount) / validWords.length,
    difficulty: puzzle.difficulty || 'medium',
    stage: puzzle.stage || 1,
    metrics,
    dateGenerated: generatedDate,
    generatorVersion: puzzle.generatorVersion || '2.0.0'
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
      
      const { puzzle: generatedPuzzle, error } = await puzzleService.generatePuzzle({
        seed: date,
        minQualityScore: 70,
        minCommonWords: 20,
        preferCommonWords: true,
        stage: 1
      });

      if (error || !generatedPuzzle) {
        throw new Error(error || 'Failed to generate puzzle');
      }

      puzzle = generatedPuzzle;
    }

    const normalizedPuzzle = normalizePuzzleData(puzzle, date);
    
    await puzzleService.storePuzzle(normalizedPuzzle);
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

    const { puzzle, attempts, generationTime, error } = await puzzleService.generatePuzzle({
      seed: date,
      minQualityScore: 70,
      minCommonWords: 20,
      preferCommonWords: true,
      stage: 1,
      ...options
    });

    if (error || !puzzle) {
      throw new Error(error || 'Failed to generate puzzle');
    }

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