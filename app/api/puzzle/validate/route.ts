import { NextResponse } from 'next/server';
import { queries } from '@/lib/db/queries';
import { validation } from '@/lib/utils/validation';
import { gameLogic } from '@/lib/utils/gameLogic';

export async function POST(req: Request) {
  try {
    const { word, centerLetter, outerLetters } = await req.json();
    
    // Create the allowed letters array
    const allowedLetters = [centerLetter, ...outerLetters];
    
    // Get today's puzzle using getDailyPuzzle
    const today = new Date().toISOString().split('T')[0];
    const puzzle = await queries.getDailyPuzzle(today);
    
    // Basic validation
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

    // Check if word is in the puzzle's valid words list
    const isValidPuzzleWord = puzzle.answers.includes(word.toLowerCase());
    if (!isValidPuzzleWord) {
      return NextResponse.json(
        { valid: false, error: 'Word not in today\'s puzzle list' },
        { status: 200 }
      );
    }

    // Calculate additional properties
    const isPangram = puzzle.pangrams.includes(word.toLowerCase());
    const score = gameLogic.calculateWordScore(word, 'normal');

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