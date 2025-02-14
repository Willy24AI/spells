import { NextResponse } from 'next/server';
import { queries } from '@/lib/db/queries';
import { validation } from '@/lib/utils/validation';
import { gameLogic } from '@/lib/utils/gameLogic';

export async function POST(req: Request) {
  try {
    const { word, centerLetter, outerLetters, difficulty = 'normal' } = await req.json();
    
    // Create the allowed letters array
    const allowedLetters = [centerLetter, ...outerLetters];

    // Validate input
    const validationResult = validation.validateGameInput(word, {
      minLength: 4,
      requiredLetter: centerLetter,
      allowedLetters: allowedLetters
    });

    if (!validationResult.isValid) {
      return NextResponse.json(
        { error: validationResult.error },
        { status: 400 }
      );
    }

    // Check if word exists in dictionary
    const validWord = await queries.validateWord(word);
    if (!validWord) {
      return NextResponse.json(
        { error: 'Word not found in dictionary' },
        { status: 400 }
      );
    }

    // Calculate score - passing word and difficulty level
    const score = gameLogic.calculateWordScore(word, difficulty);
    const isPangram = gameLogic.isPangram(word, allowedLetters);

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