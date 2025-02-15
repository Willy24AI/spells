import { NextResponse } from 'next/server';
import { queries } from '@/lib/db/queries';
import { dateUtils } from '@/lib/utils/dateUtils';
import { gameLogic } from '@/lib/utils/gameLogic';

// You might want to define an interface for the puzzle structure
interface Puzzle {
  center_letter: string;
  other_letters: string[];
  answers: string[];
  pangrams: string[];
  date: string;
}

export async function GET() {
  try {
    const today = dateUtils.getDayKey(new Date());
    console.log('Fetching puzzle for date:', today);

    const puzzle = await queries.getDailyPuzzle(today);
    console.log('Raw puzzle data:', puzzle);

    // Calculate max score from valid words and pangrams
    const maxScore = puzzle.answers.reduce((total: number, word: string) => {
      // Base score: 1 point for 4-letter words, word length for longer words
      const wordScore = word.length === 4 ? 1 : word.length;

      // Additional points for pangrams
      const isPangram = puzzle.pangrams.includes(word);
      const pangramBonus = isPangram ? 7 : 0;

      return total + wordScore + pangramBonus;
    }, 0);

    // Format the response to match the frontend expectations
    const formattedPuzzle = {
      center_letter: puzzle.center_letter,
      other_letters: puzzle.other_letters,
      answers: puzzle.answers,
      pangrams: puzzle.pangrams,
      max_score: maxScore,
      date: today
    };

    console.log('Formatted puzzle data:', formattedPuzzle);

    return NextResponse.json(formattedPuzzle);
  } catch (error) {
    console.error('Error fetching puzzle:', error);
    return NextResponse.json(
      { error: 'Failed to fetch puzzle' },
      { status: 500 }
    );
  }
}