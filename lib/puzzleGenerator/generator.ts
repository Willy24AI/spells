import { WordList } from '../dictionary/wordList';
import { metadata } from '../dictionary/metadata';
import { supabase } from '@/lib/db';
import { 
  GeneratedPuzzle, 
  GeneratorOptions, 
  GenerationResult,
  PuzzleMetrics,
  DifficultySettings,
  PuzzleDifficulty
} from '../types/puzzleGenerator';

const DIFFICULTY_SETTINGS: Record<PuzzleDifficulty, {
  minCommonWords: number;
  maxWordLength: number;
  minFrequency: number;
  targetShortWordPercentage: number;
}> = {
  easy: {
    minCommonWords: 20,
    maxWordLength: 6,
    minFrequency: 50,
    targetShortWordPercentage: 0.7
  },
  medium: {
    minCommonWords: 15,
    maxWordLength: 7,
    minFrequency: 40,
    targetShortWordPercentage: 0.6
  },
  hard: {
    minCommonWords: 10,
    maxWordLength: 8,
    minFrequency: 30,
    targetShortWordPercentage: 0.5
  }
};

export class PuzzleGenerator {
  private wordList: WordList;

  constructor(wordList: WordList) {
    this.wordList = wordList;
  }

  async generatePuzzle(targetDate?: string): Promise<GeneratedPuzzle> {
    try {
      console.log('Starting puzzle generation');
      
      // Get pangrams from dictionary
      const pangrams = await this.wordList.findPangrams();
      console.log(`Found ${pangrams.length} pangrams`);

      if (!pangrams.length) {
        throw new Error('No pangrams found in dictionary');
      }

      // Get a random pangram
      const pangram = pangrams[Math.floor(Math.random() * pangrams.length)];
      console.log(`Selected pangram: ${pangram}`);

      // Generate letter combinations
      const letters = Array.from(new Set(pangram.split('')));
      const centerLetter = letters[Math.floor(Math.random() * letters.length)];
      const outerLetters = letters.filter(l => l !== centerLetter);

      console.log(`Letter set: center=${centerLetter}, outer=${outerLetters.join(',')}`);

      // Find valid words
      const validWords = await this.wordList.findValidWords(
        centerLetter,
        outerLetters,
        {
          minLength: 4,
          maxLength: 15
        }
      );

      // Verify all words exist in dictionary
      const { data: dictWords } = await supabase
        .from('words')
        .select('word')
        .in('word', validWords);

      const validDictionaryWords = new Set(dictWords?.map(d => d.word.toLowerCase()) || []);
      
      // Filter out any words not in dictionary
      const verifiedWords = validWords.filter(word => 
        validDictionaryWords.has(word.toLowerCase())
      );

      const verifiedPangrams = pangrams.filter(word => 
        validDictionaryWords.has(word.toLowerCase())
      );

      console.log(`Found ${verifiedWords.length} verified words`);

      // Calculate word length distribution
      const wordLengthDistribution = verifiedWords.reduce((acc, word) => {
        acc[word.length] = (acc[word.length] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      // Calculate metrics
      const metrics: PuzzleMetrics = {
        totalWords: verifiedWords.length,
        wordCount: verifiedWords.length,
        uniqueLetters: letters.length,
        maxScore: this.calculateMaxScore(verifiedWords, verifiedPangrams),
        pangramCount: verifiedPangrams.length,
        averageWordLength: verifiedWords.reduce((sum, word) => sum + word.length, 0) / verifiedWords.length,
        wordLengthDistribution,
        commonWordPercentage: this.calculateCommonWordPercentage(verifiedWords),
        difficultyScore: this.calculateDifficultyScore(verifiedWords, verifiedPangrams),
        qualityScore: verifiedWords.length >= 30 ? 80 : 60,
        fourLetterWordCount: wordLengthDistribution[4] || 0,
        fiveLetterWordCount: wordLengthDistribution[5] || 0,
        longWordCount: Object.entries(wordLengthDistribution)
          .filter(([length]) => parseInt(length) >= 7)
          .reduce((sum, [_, count]) => sum + count, 0),
        wordFamilyCount: verifiedWords.length
      };

      // Create puzzle object
      const puzzle: GeneratedPuzzle = {
        id: `puzzle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        centerLetter,
        outerLetters,
        validWords: verifiedWords,
        pangrams: verifiedPangrams,
        maxScore: metrics.maxScore,
        qualityScore: metrics.qualityScore,
        wordCount: verifiedWords.length,
        commonWordCount: this.calculateCommonWords(verifiedWords),
        shortWordPercentage: this.calculateShortWordPercentage(verifiedWords),
        averageWordLength: metrics.averageWordLength,
        wordLengthDistribution,
        difficulty: this.calculateDifficulty(metrics),
        stage: this.determineStage(metrics),
        metrics,
        dateGenerated: new Date().toISOString(),
        generatorVersion: '2.0.0',
        date: targetDate
      };

      console.log('Puzzle generation complete');
      return puzzle;

    } catch (error) {
      console.error('Error generating puzzle:', error);
      throw error;
    }
  }

  private calculateMaxScore(words: string[], pangrams: string[]): number {
    return words.reduce((total, word) => {
      let score = word.length === 4 ? 1 : word.length;
      if (pangrams.includes(word)) score += 7;
      return total + score;
    }, 0);
  }

  private calculateCommonWords(words: string[]): number {
    return words.filter(word => word.length <= 6).length;
  }

  private calculateShortWordPercentage(words: string[]): number {
    const shortWords = words.filter(word => word.length <= 5);
    return (shortWords.length / words.length) * 100;
  }

  private calculateCommonWordPercentage(words: string[]): number {
    return (this.calculateCommonWords(words) / words.length) * 100;
  }

  private calculateDifficultyScore(words: string[], pangrams: string[]): number {
    const distribution = this.calculateWordLengthDistribution(words);
    const longWordRatio = Object.entries(distribution)
      .filter(([length]) => parseInt(length) >= 7)
      .reduce((sum, [_, count]) => sum + count, 0) / words.length;

    return Math.min(
      100,
      longWordRatio * 100 +
      pangrams.length * 20 +
      (words.length > 50 ? 20 : 0)
    );
  }

  private calculateWordLengthDistribution(words: string[]): Record<number, number> {
    return words.reduce((acc, word) => {
      acc[word.length] = (acc[word.length] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
  }

  private calculateDifficulty(metrics: PuzzleMetrics): PuzzleDifficulty {
    if (metrics.difficultyScore < 40) return 'easy';
    if (metrics.difficultyScore < 70) return 'medium';
    return 'hard';
  }

  private determineStage(metrics: PuzzleMetrics): 1 | 2 | 3 {
    if (metrics.qualityScore < 60) return 1;
    if (metrics.qualityScore < 80) return 2;
    return 3;
  }
}