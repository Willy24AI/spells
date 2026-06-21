import { WordList } from '../dictionary/wordList';
import { supabase } from '@/lib/db';
import type { 
  GeneratedPuzzle, 
  PuzzleMetrics, 
  PuzzleDifficulty 
} from '../types/puzzleGenerator';

export class PuzzleGenerator {
  // Proven high-performing combinations based on analysis
  private readonly CORE_COMBINATIONS = [
    ['e', 'a', 'n', 't', 'i', 'h', 's'],  // Proven 59-word combination
    ['a', 'e', 's', 't', 'r', 'n'],       // Based on database stats
    ['e', 'r', 's', 't', 'a', 'i'],       // Common letter combination
    ['a', 'n', 't', 'e', 'r', 's'],       // High-frequency pattern
    ['e', 'a', 's', 't', 'i', 'r'],       // Based on word frequency
    ['e', 'a', 'r', 'l', 'i', 'n']        // Common word pattern
  ];

  // Optimized letter weights based on performance analysis
  private readonly LETTER_WEIGHTS = {
    e: 2.0,    // Primary vowel, highest frequency
    a: 1.8,    // Secondary vowel, high frequency
    t: 1.6,    // Top consonant
    n: 1.6,    // Highly productive
    s: 1.6,    // Great for plurals and variations
    r: 1.5,    // Common in prefixes
    i: 1.4,    // Important vowel
    h: 1.3,    // Good consonant
    o: 1.2,    // Useful vowel
    l: 1.1     // Productive consonant
  };

  // Thresholds for puzzle quality
  private readonly MIN_WORD_COUNT = 30;
  private readonly MIN_QUALITY_SCORE = 60;
  private readonly MIN_PANGRAMS = 1;
  private readonly OPTIMAL_VOWEL_COUNT = 2;
  // How many letter sets to examine and how big a candidate pool to build before
  // making the seeded pick. These bound generation cost while keeping variety.
  private readonly MAX_SETS = 40;
  private readonly TARGET_POOL_SIZE = 12;

  constructor(private wordList: WordList) {}

  async generatePuzzle(targetDate?: string): Promise<GeneratedPuzzle> {
    // Seed the generation from the target date so each day deterministically
    // produces a DIFFERENT puzzle, while the same date always yields the same one.
    const seedKey = targetDate || new Date().toISOString().split('T')[0];
    const random = this.createSeededRandom(seedKey);

    // Build candidate letter sets and shuffle them with the date seed so
    // different dates explore different combinations.
    const allLetterSets = await this.generateOptimizedLetterSets();
    const letterSets = this.shuffleWithSeed(allLetterSets, random).slice(0, this.MAX_SETS);

    // Collect qualifying puzzles into a pool, then pick one with the date seed.
    const candidates: GeneratedPuzzle[] = [];

    for (const letterSet of letterSets) {
      const centerCandidates = this.prioritizeCenterLetters(letterSet);

      for (const centerLetter of centerCandidates) {
        const outerLetters = letterSet.filter(l => l !== centerLetter);

        if (!this.isValidLetterSet(centerLetter, outerLetters)) {
          continue;
        }

        // Find valid words
        const validWords = await this.wordList.findValidWords(
          centerLetter,
          outerLetters,
          {
            minLength: 4,
            maxLength: 15
          }
        );

        if (validWords.length < this.MIN_WORD_COUNT) {
          continue;
        }

        const pangrams = validWords.filter(word =>
          this.isPangram(word, [centerLetter, ...outerLetters])
        );

        if (pangrams.length < this.MIN_PANGRAMS) {
          continue;
        }

        const qualityScore = this.calculateQualityScore(validWords, pangrams);
        if (qualityScore < this.MIN_QUALITY_SCORE) {
          continue;
        }

        const metrics = this.calculatePuzzleMetrics(validWords, pangrams);
        candidates.push({
          id: this.generatePuzzleId(),
          centerLetter,
          outerLetters,
          validWords,
          pangrams,
          maxScore: this.calculateMaxScore(validWords, pangrams),
          qualityScore,
          wordCount: validWords.length,
          commonWordCount: validWords.filter(w => w.length <= 6).length,
          shortWordPercentage: (validWords.filter(w => w.length <= 5).length / validWords.length) * 100,
          averageWordLength: metrics.averageWordLength,
          wordLengthDistribution: metrics.wordLengthDistribution,
          difficulty: this.calculateDifficulty(metrics),
          stage: this.determineStage(metrics),
          metrics,
          dateGenerated: new Date().toISOString(),
          generatorVersion: '2.0.0',
          date: targetDate
        });

        // One puzzle per letter set keeps the pool diverse and generation fast.
        break;
      }

      if (candidates.length >= this.TARGET_POOL_SIZE) {
        break;
      }
    }

    if (candidates.length === 0) {
      throw new Error('Failed to generate a valid puzzle meeting quality thresholds');
    }

    // Order candidates deterministically (independent of DB row order) so the
    // seeded pick is reproducible, then choose one with the date seed.
    candidates.sort((a, b) =>
      (a.centerLetter + a.outerLetters.join('')).localeCompare(
        b.centerLetter + b.outerLetters.join('')
      )
    );

    const index = Math.floor(random() * candidates.length);
    const chosen = candidates[index];
    console.log(
      `Generated puzzle for ${seedKey}: ${candidates.length} candidates, ` +
      `picked #${index} (${chosen.centerLetter.toUpperCase()}|${chosen.outerLetters.join('').toUpperCase()}) ` +
      `with ${chosen.wordCount} words`
    );
    return chosen;
  }

  /**
   * Deterministic PRNG (mulberry32) seeded from a string. The same seed always
   * produces the same sequence, so a given date yields a stable puzzle.
   */
  private createSeededRandom(seed: string): () => number {
    let h = 1779033703 ^ seed.length;
    for (let i = 0; i < seed.length; i++) {
      h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    let a = h >>> 0;
    return () => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** Fisher-Yates shuffle driven by a seeded PRNG (does not mutate input). */
  private shuffleWithSeed<T>(items: T[], random: () => number): T[] {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  private async generateOptimizedLetterSets(): Promise<string[][]> {
    const letterSets: string[][] = [];
    
    // Start with proven core combinations
    letterSets.push(...this.CORE_COMBINATIONS);

    // Add variations of core combinations
    for (const core of this.CORE_COMBINATIONS) {
      if (core.length < 7) {
        const complementary = this.selectComplementaryLetters(core, 7 - core.length);
        letterSets.push([...core, ...complementary]);
      }
    }

    // Add high-scoring pangrams from database
    const pangrams = await this.wordList.findPangrams();
    for (const pangram of pangrams) {
      const letters = Array.from(new Set(pangram.toLowerCase().split('')));
      if (letters.length === 7 && this.hasRequiredVowels(letters)) {
        letterSets.push(letters);
      }
    }

    return this.uniqueLetterSets(letterSets);
  }

  private selectComplementaryLetters(existingSet: string[], count: number): string[] {
    const complementary: string[] = [];
    const letters = Object.keys(this.LETTER_WEIGHTS)
      .filter(l => !existingSet.includes(l))
      .sort((a, b) => 
        (this.LETTER_WEIGHTS[b as keyof typeof this.LETTER_WEIGHTS] || 0) -
        (this.LETTER_WEIGHTS[a as keyof typeof this.LETTER_WEIGHTS] || 0)
      );

    // Ensure vowel balance
    const existingVowels = existingSet.filter(l => 'aeiou'.includes(l));
    if (existingVowels.length < this.OPTIMAL_VOWEL_COUNT) {
      const vowels = ['a', 'e', 'i', 'o', 'u'].filter(v => !existingSet.includes(v));
      while (complementary.length < count && 
             existingVowels.length + complementary.filter(l => 'aeiou'.includes(l)).length < this.OPTIMAL_VOWEL_COUNT) {
        const vowel = vowels.shift();
        if (vowel) complementary.push(vowel);
      }
    }

    // Fill remaining slots with high-scoring consonants
    while (complementary.length < count) {
      const letter = letters.find(l => !complementary.includes(l) && !'aeiou'.includes(l));
      if (!letter) break;
      complementary.push(letter);
    }

    return complementary;
  }

  private prioritizeCenterLetters(letters: string[]): string[] {
    return letters.sort((a, b) => {
      const aWeight = this.LETTER_WEIGHTS[a as keyof typeof this.LETTER_WEIGHTS] || 0;
      const bWeight = this.LETTER_WEIGHTS[b as keyof typeof this.LETTER_WEIGHTS] || 0;
      return bWeight - aWeight;
    });
  }

  private isValidLetterSet(centerLetter: string, outerLetters: string[]): boolean {
    const allLetters = [centerLetter, ...outerLetters];
    const vowels = allLetters.filter(l => 'aeiou'.includes(l));
    
    // Validate vowel count
    if (vowels.length < 2 || vowels.length > 3) return false;
    
    // Check for required letters
    if (!allLetters.some(l => this.LETTER_WEIGHTS[l as keyof typeof this.LETTER_WEIGHTS] >= 1.5)) {
      return false;
    }

    return true;
  }

  private calculatePuzzleMetrics(words: string[], pangrams: string[]): PuzzleMetrics {
    const wordLengthDistribution = words.reduce((acc, word) => {
      acc[word.length] = (acc[word.length] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const uniqueLetters = new Set(words.flatMap(word => word.split(''))).size;

    return {
      totalWords: words.length,
      wordCount: words.length,
      uniqueLetters,
      maxScore: this.calculateMaxScore(words, pangrams),
      pangramCount: pangrams.length,
      averageWordLength: words.reduce((sum, word) => sum + word.length, 0) / words.length,
      wordLengthDistribution,
      commonWordPercentage: ((wordLengthDistribution[4] || 0) + (wordLengthDistribution[5] || 0)) / words.length * 100,
      difficultyScore: this.calculateDifficultyScore(words, pangrams, wordLengthDistribution),
      qualityScore: this.calculateQualityScore(words, pangrams),
      fourLetterWordCount: wordLengthDistribution[4] || 0,
      fiveLetterWordCount: wordLengthDistribution[5] || 0,
      longWordCount: Object.entries(wordLengthDistribution)
        .filter(([length]) => parseInt(length) >= 7)
        .reduce((sum, [_, count]) => sum + count, 0),
      wordFamilyCount: words.length
    };
  }

  private calculateMaxScore(words: string[], pangrams: string[]): number {
    return words.reduce((total, word) => {
      let score = word.length === 4 ? 1 : word.length;
      if (pangrams.includes(word)) score += 7;
      return total + score;
    }, 0);
  }

  private calculateDifficultyScore(
    words: string[],
    pangrams: string[],
    distribution: Record<number, number>
  ): number {
    const longWordRatio = Object.entries(distribution)
      .filter(([length]) => parseInt(length) >= 7)
      .reduce((sum, [_, count]) => sum + count, 0) / words.length;

    const difficulty = Math.min(
      100,
      longWordRatio * 100 +
      pangrams.length * 20 +
      (words.length > 30 ? 20 : 0)
    );

    return Math.round(difficulty);
  }

  private calculateQualityScore(words: string[], pangrams: string[]): number {
    const distribution = words.reduce((acc, word) => {
      acc[word.length] = (acc[word.length] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const shortWordScore = ((distribution[4] || 0) + (distribution[5] || 0)) / words.length * 100;
    const pangramScore = Math.min(pangrams.length * 20, 100);
    const balanceScore = (1 - Math.abs(0.6 - shortWordScore / 100)) * 100;
    const wordCountScore = Math.min(words.length * 2, 100);

    const score = Math.min(
      100,
      (shortWordScore * 0.3) +
      (pangramScore * 0.2) +
      (balanceScore * 0.2) +
      (wordCountScore * 0.3)
    );

    return Math.round(score);
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

  private generatePuzzleId(): string {
    return `puzzle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private isPangram(word: string, letters: string[]): boolean {
    const uniqueLetters = new Set(word.toLowerCase());
    return letters.every(letter => uniqueLetters.has(letter.toLowerCase()));
  }

  private hasRequiredVowels(letters: string[]): boolean {
    const vowels = letters.filter(l => 'aeiou'.includes(l));
    return vowels.length >= 2 && vowels.length <= 3;
  }

  private uniqueLetterSets(sets: string[][]): string[][] {
    const seen = new Set<string>();
    return sets.filter(set => {
      const key = [...set].sort().join('');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}