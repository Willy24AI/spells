import { NextResponse } from 'next/server';
import { WordList } from '@/lib/dictionary/wordList';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const center = searchParams.get('center');
    const outer = searchParams.get('outer')?.split(',');

    if (!center || !outer) {
      return NextResponse.json(
        { error: 'Center letter and outer letters are required' },
        { status: 400 }
      );
    }

    const wordList = new WordList();
    await wordList.initialize();

    // Find all possible words
    const startTime = performance.now();
    const allPossibleWords = await wordList.findValidWords(
      center,
      outer,
      {
        minLength: 4,
        maxLength: 15
      }
    );
    const endTime = performance.now();

    // Group words by length
    const wordsByLength = allPossibleWords.reduce((acc: Record<number, string[]>, word) => {
      acc[word.length] = acc[word.length] || [];
      acc[word.length].push(word);
      return acc;
    }, {});

    // Calculate pangrams
    const pangrams = allPossibleWords.filter(word => {
      const uniqueLetters = new Set(word.toLowerCase());
      return [center, ...outer].every(letter => 
        uniqueLetters.has(letter.toLowerCase())
      );
    });

    // Calculate word statistics
    const stats = {
      totalWords: allPossibleWords.length,
      shortWords: allPossibleWords.filter(w => w.length <= 5).length,
      mediumWords: allPossibleWords.filter(w => w.length > 5 && w.length <= 7).length,
      longWords: allPossibleWords.filter(w => w.length > 7).length,
      averageLength: allPossibleWords.length > 0 
        ? allPossibleWords.reduce((sum, word) => sum + word.length, 0) / allPossibleWords.length 
        : 0,
      processingTime: endTime - startTime
    };

    return NextResponse.json({
      letters: {
        center,
        outer
      },
      results: {
        totalWords: allPossibleWords.length,
        wordsByLength,
        pangrams,
        pangram_count: pangrams.length,
        allWords: allPossibleWords.sort(),
        stats
      }
    });

  } catch (error) {
    console.error('Error analyzing letter set:', error);
    return NextResponse.json(
      { error: 'Failed to analyze letter set' },
      { status: 500 }
    );
  }
}