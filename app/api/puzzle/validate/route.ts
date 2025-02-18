import { NextResponse } from 'next/server';
import { queries } from '@/lib/db/queries';
import { validation } from '@/lib/utils/validation';
import { gameLogic } from '@/lib/utils/gameLogic';
import { dateUtils } from '@/lib/utils/dateUtils';
import type { GeneratedPuzzle } from '@/lib/types/puzzleGenerator';

export async function POST(req: Request) {
  try {
    const { word, centerLetter, outerLetters } = await req.json();
    
    // Create the allowed letters array
    const allowedLetters = [centerLetter, ...outerLetters];
    
    // Basic validation first
    const validationResult = validation.validateGameInput(word, {
      minLength: 4,
      requiredLetter: centerLetter,
      allowedLetters: allowedLetters
    });

    if (!validationResult.isValid) {
      return NextResponse.json(
        { valid: false, error: validationResult.error },
        { status: 200 }
      );
    }

    // Get today's puzzle
    const today = dateUtils.getDayKey(new Date());
    const puzzle = await queries.getDailyPuzzle(today);

    // Check if puzzle exists
    if (!puzzle) {
      return NextResponse.json(
        { valid: false, error: 'No puzzle found for today' },
        { status: 404 }
      );
    }

    // Convert everything to uppercase for comparison
    const normalizedWord = word.toUpperCase();
    const normalizedValidWords = puzzle.validWords.map(word => word.toUpperCase());
    
    console.log('Checking word:', normalizedWord);
    console.log('Valid words:', normalizedValidWords);
    
    // Check if word is in the puzzle's valid words list
    const isValidPuzzleWord = normalizedValidWords.includes(normalizedWord);
    console.log('Is word valid:', isValidPuzzleWord);

    if (!isValidPuzzleWord) {
      return NextResponse.json(
        { valid: false, error: 'Word not in today\'s puzzle list' },
        { status: 200 }
      );
    }

    // Calculate additional properties
    const isPangram = puzzle.pangrams.map(pangram => pangram.toUpperCase()).includes(normalizedWord);
    
    // Calculate word score
    const wordLength = normalizedWord.length;
    const score = wordLength === 4 ? 1 : isPangram ? wordLength + 7 : wordLength;

    // If we get here, the word is valid
    return NextResponse.json({
      valid: true,
      score,
      isPangram
    });
    
  } catch (error) {
    console.error('Error validating word:', error);
    return NextResponse.json(
      { error: 'Failed to validate word' },
      { status: 500 }
    );
  }
}