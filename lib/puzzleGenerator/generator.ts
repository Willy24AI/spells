import { WordList } from '../dictionary/wordList';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import type { GeneratedPuzzle, PuzzleStage } from '@/lib/types/puzzleGenerator';

const VOWELS = ['a', 'e', 'i', 'o', 'u'];
const COMMON_CONSONANTS = ['r', 's', 't', 'n', 'l', 'd'];

// Scoring weights for letter combinations
const SCORING_WEIGHTS = {
  commonConsonants: 3,
  vowels: 2,
  centerLetterFrequency: 2,
  letterBalance: 1
};

export class PuzzleGenerator {
  private wordList: WordList;
  private minWordCount: number;
  private minQualityScore: number;
  private maxAttempts: number;
  private supabase: any;

  constructor(
    wordList: WordList,
    options = {
      minWordCount: 25,
      minQualityScore: 60,
      maxAttempts: 100
    }
  ) {
    this.wordList = wordList;
    this.minWordCount = options.minWordCount;
    this.minQualityScore = options.minQualityScore;
    this.maxAttempts = options.maxAttempts;
    this.initializeSupabase();
  }

  private initializeSupabase() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }

  private generatePuzzleId(): string {
    return uuidv4();
  }

  async generatePuzzle(targetDate?: string): Promise<GeneratedPuzzle> {
    try {
      // Get pangrams from dictionary
      const pangrams = await this.wordList.findPangrams();
      console.log(`Found ${pangrams.length} pangrams`);

      if (!pangrams.length) {
        throw new Error('No pangrams found in dictionary');
      }

      let bestPuzzle: GeneratedPuzzle | null = null;
      let attempts = 0;

      while (attempts < this.maxAttempts) {
        // Get a random pangram
        const pangram = pangrams[Math.floor(Math.random() * pangrams.length)];
        console.log(`Trying pangram: ${pangram}`);

        // Generate letter combinations
        const letterSets = this.generateLetterCombinations(pangram);
        console.log(`Generated ${letterSets.length} letter sets`);

        for (const letterSet of letterSets) {
          try {
            // Find valid words from dictionary - no more includeVariations
            const validWords = await this.wordList.findValidWords(
              letterSet.centerLetter,
              letterSet.outerLetters,
              {
                minLength: 4,
                maxLength: 15
              }
            );

            console.log(`Found ${validWords.length} valid words`);

            if (validWords.length < this.minWordCount) {
              console.log('Failed: Not enough words');
              continue;
            }

            // Analyze word distribution
            const distribution = this.analyzeWordDistribution(validWords);
            if (!this.isGoodDistribution(distribution)) {
              console.log('Failed: Bad distribution', distribution);
              continue;
            }

            // Find pangrams in valid words
            const puzzlePangrams = validWords.filter(word => 
              this.isPangram(word, letterSet.centerLetter, letterSet.outerLetters)
            );

            if (puzzlePangrams.length === 0) {
              console.log('Failed: No pangrams found');
              continue;
            }

            // Calculate metrics
            const metrics = this.calculateMetrics(validWords, puzzlePangrams);
            console.log('Puzzle metrics:', metrics);

            // Create puzzle object
            const puzzle: GeneratedPuzzle = {
              id: this.generatePuzzleId(),
              centerLetter: letterSet.centerLetter,
              outerLetters: letterSet.outerLetters,
              validWords,
              pangrams: puzzlePangrams,
              maxScore: this.calculateTotalScore(validWords, puzzlePangrams),
              qualityScore: metrics.qualityScore,
              wordCount: validWords.length,
              commonWordCount: this.countCommonWords(validWords),
              shortWordPercentage: this.calculateShortWordPercentage(validWords),
              averageWordLength: this.calculateAverageLength(validWords),
              wordLengthDistribution: distribution,
              difficulty: this.calculateDifficulty(metrics),
              stage: this.determineStage(metrics) as PuzzleStage,
              metrics: {
                wordCount: validWords.length,
                uniqueLetters: 7,
                pangramCount: puzzlePangrams.length,
                averageWordLength: this.calculateAverageLength(validWords),
                commonWordPercentage: this.calculateCommonWordPercentage(validWords),
                difficultyScore: metrics.difficultyScore,
                qualityScore: metrics.qualityScore,
                wordFamilyCount: this.countWordFamilies(validWords)
              },
              dateGenerated: new Date().toISOString(),
              generatorVersion: '2.0.0',
              date: targetDate
            };

            // Update best puzzle if better quality
            if (!bestPuzzle || puzzle.qualityScore > bestPuzzle.qualityScore) {
              bestPuzzle = puzzle;
              console.log(`New best puzzle found with quality score: ${puzzle.qualityScore}`);

              // Save puzzle if it meets minimum quality
              if (puzzle.qualityScore >= this.minQualityScore) {
                try {
                  await this.savePuzzleToDatabase(puzzle);
                  console.log('Found puzzle meeting minimum quality score');
                  return puzzle;
                } catch (dbError) {
                  console.error('Database error:', dbError);
                  continue;
                }
              }
            }
          } catch (error) {
            console.error('Error processing letter set:', error);
            continue;
          }
        }

        attempts++;
        console.log(`Attempt ${attempts} completed`);
      }

      if (!bestPuzzle) {
        throw new Error(`Failed to generate valid puzzle after ${attempts} attempts`);
      }

      try {
        await this.savePuzzleToDatabase(bestPuzzle);
      } catch (error) {
        console.error('Failed to save best puzzle:', error);
      }

      return bestPuzzle;

    } catch (error) {
      console.error('Error generating puzzle:', error);
      throw error;
    }
  }

  private async savePuzzleToDatabase(puzzle: GeneratedPuzzle): Promise<void> {
    try {
      const puzzleData = {
        id: puzzle.id,
        center_letter: puzzle.centerLetter,
        outer_letters: puzzle.outerLetters,
        valid_words: puzzle.validWords,
        pangrams: puzzle.pangrams,
        max_score: puzzle.maxScore,
        quality_score: Math.round(puzzle.qualityScore),
        word_count: puzzle.wordCount,
        metrics: puzzle.metrics,
        difficulty: puzzle.difficulty,
        stage: puzzle.stage,
        date: puzzle.date || new Date().toISOString().split('T')[0],
        word_length_distribution: puzzle.wordLengthDistribution,
        created_at: new Date().toISOString(),
        created_by: null,
        is_published: true,
        creator_type: 'SYSTEM'
      };

      const { error } = await this.supabase
        .from('daily_puzzles')
        .insert([puzzleData]);

      if (error) {
        throw error;
      }

      console.log('Successfully saved puzzle to database');
    } catch (error) {
      console.error('Error saving puzzle to database:', error);
      throw error;
    }
  }

  private generateLetterCombinations(pangram: string) {
    const uniqueLetters = Array.from(new Set(pangram.toLowerCase()));
    const combinations: Array<{
      centerLetter: string;
      outerLetters: string[];
      score: number;
    }> = [];

    for (const centerLetter of uniqueLetters) {
      const outerLetters = uniqueLetters.filter(l => l !== centerLetter);
      const score = this.scoreLetterCombination(centerLetter, outerLetters);
      
      combinations.push({
        centerLetter,
        outerLetters,
        score
      });
    }

    return combinations.sort((a, b) => b.score - a.score);
  }

  private scoreLetterCombination(centerLetter: string, outerLetters: string[]): number {
    const allLetters = [centerLetter, ...outerLetters];
    
    // Count vowels and common consonants
    const vowelCount = allLetters.filter(l => VOWELS.includes(l)).length;
    const commonConsonantCount = allLetters.filter(l => COMMON_CONSONANTS.includes(l)).length;
    
    // Score components
    const commonConsonantScore = commonConsonantCount * SCORING_WEIGHTS.commonConsonants;
    const vowelScore = vowelCount * SCORING_WEIGHTS.vowels;
    const centerLetterScore = (COMMON_CONSONANTS.includes(centerLetter) || VOWELS.includes(centerLetter)) 
      ? SCORING_WEIGHTS.centerLetterFrequency 
      : 0;
    const letterBalanceScore = (vowelCount >= 2 && (7 - vowelCount) >= 4) 
      ? SCORING_WEIGHTS.letterBalance 
      : 0;

      return commonConsonantScore + vowelScore + centerLetterScore + letterBalanceScore;
    }
  
    private analyzeWordDistribution(words: string[]): Record<number, number> {
      return words.reduce((acc, word) => {
        acc[word.length] = (acc[word.length] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);
    }
  
    private isGoodDistribution(distribution: Record<number, number>): boolean {
      const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
      
      // Calculate percentage of short words (4-6 letters)
      const shortWordCount = (distribution[4] || 0) + (distribution[5] || 0) + (distribution[6] || 0);
      const shortWordPercentage = shortWordCount / total;
  
      return (
        shortWordPercentage >= 0.15 && // At least 15% short words
        Object.keys(distribution).length >= 3 && // At least 3 different lengths
        total >= this.minWordCount // Minimum word count
      );
    }
  
    private isPangram(word: string, centerLetter: string, outerLetters: string[]): boolean {
      const allLetters = [centerLetter, ...outerLetters].map(l => l.toLowerCase());
      const wordLetters = new Set(word.toLowerCase());
      
      // Must use exactly 7 letters
      if (wordLetters.size !== 7) return false;
      
      // Must use all available letters
      return allLetters.every(letter => wordLetters.has(letter));
    }
  
    private calculateMetrics(words: string[], pangrams: string[]) {
      const scores = {
        wordCount: words.length >= 60 ? 100 : (words.length / 60) * 100,
        pangramCount: pangrams.length > 0 && pangrams.length <= 3 ? 100 : 50,
        averageLength: this.calculateAverageLength(words),
        difficultyScore: this.calculateDifficultyScore(words, pangrams)
      };
  
      const qualityScore = (
        scores.wordCount * 0.4 +
        scores.pangramCount * 0.3 +
        scores.averageLength * 0.2 +
        scores.difficultyScore * 0.1
      );
  
      return {
        qualityScore,
        difficultyScore: scores.difficultyScore
      };
    }
  
    private calculateDifficultyScore(words: string[], pangrams: string[]): number {
      const distribution = this.analyzeWordDistribution(words);
      const longWordRatio = (
        (distribution[7] || 0) + (distribution[8] || 0)
      ) / words.length;
  
      return Math.min(
        100,
        longWordRatio * 100 +
        pangrams.length * 20 +
        (words.length > 50 ? 20 : 0)
      );
    }
  
    private calculateTotalScore(words: string[], pangrams: string[]): number {
      return words.reduce((total, word) => {
        let score = word.length === 4 ? 1 : word.length;
        if (pangrams.includes(word)) score += 7;
        return total + score;
      }, 0);
    }
  
    private countCommonWords(words: string[]): number {
      return words.filter(word => word.length <= 6).length;
    }
  
    private calculateShortWordPercentage(words: string[]): number {
      const shortWords = words.filter(word => word.length <= 5);
      return (shortWords.length / words.length) * 100;
    }
  
    private calculateCommonWordPercentage(words: string[]): number {
      const commonWords = this.countCommonWords(words);
      return (commonWords / words.length) * 100;
    }
  
    private calculateAverageLength(words: string[]): number {
      return words.reduce((sum, word) => sum + word.length, 0) / words.length;
    }
  
    private calculateDifficulty(metrics: { difficultyScore: number }): 'easy' | 'medium' | 'hard' {
      if (metrics.difficultyScore < 40) return 'easy';
      if (metrics.difficultyScore < 70) return 'medium';
      return 'hard';
    }
  
    private determineStage(metrics: { qualityScore: number }): 1 | 2 | 3 {
      if (metrics.qualityScore < 60) return 1;
      if (metrics.qualityScore < 80) return 2;
      return 3;
    }
  
    private countWordFamilies(words: string[]): number {
      const families = new Set<string>();
      for (const word of words) {
        const base = this.getWordRoot(word);
        if (base) families.add(base);
      }
      return families.size;
    }
  
    private getWordRoot(word: string): string {
      const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
      let root = word.toLowerCase();
  
      // Check if word is too short to have a suffix
      if (root.length < 4) return root;
  
      // Handle common suffixes
      if (root.endsWith('ing')) {
        root = root.slice(0, -3);
        // Add back 'e' if needed
        if (root.length >= 3) {
          const lastChar = root[root.length - 1];
          const secondLastChar = root[root.length - 2];
          if (!vowels.has(lastChar) && vowels.has(secondLastChar)) {
            root += 'e';
          }
        }
      } else if (root.endsWith('ed')) {
        root = root.slice(0, -2);
        // Add back 'e' if needed
        if (root.length >= 3) {
          const lastChar = root[root.length - 1];
          const secondLastChar = root[root.length - 2];
          if (!vowels.has(lastChar) && vowels.has(secondLastChar)) {
            root += 'e';
          }
        }
      } else if (root.endsWith('s')) {
        root = root.slice(0, -1);
      }
  
      return root;
    }
  }