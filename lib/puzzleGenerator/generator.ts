import { WordList } from '../dictionary/wordList';
import type { GeneratedPuzzle, PuzzleStage } from '@/lib/types/puzzleGenerator';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Common consonants used in word pattern matching
const consonants = 'bcdfghjklmnpqrstvwxz';
const vowels = 'aeiou';

interface LetterSet {
  centerLetter: string;
  outerLetters: string[];
  score: number;
  vowelCount: number;
  consonantCount: number;
  commonLetterScore: number;
}

// Letter frequencies in modern English usage
const letterFrequencies: Record<string, number> = {
  'e': 12.7, 't': 9.1, 'a': 8.2, 'o': 7.5, 'i': 7.0,
  'n': 6.7, 's': 6.3, 'h': 6.1, 'r': 6.0, 'd': 4.3,
  'l': 4.0, 'u': 2.8, 'c': 2.8, 'm': 2.4, 'w': 2.4,
  'f': 2.2, 'g': 2.0, 'y': 2.0, 'p': 1.9, 'b': 1.5,
  'v': 1.0, 'k': 0.8, 'j': 0.15, 'x': 0.15, 'q': 0.10,
  'z': 0.07
};

// Common word patterns and affixes
const COMMON_PATTERNS = {
  prefixes: [
    're', 'un', 'in', 'de', // Short prefixes prioritized
    'dis', 'pre', 'sub', 'non',
    'over', 'under', 'post' // Longer ones last
  ],
  suffixes: [
    's', 'ed', 'er', 'y', // Short suffixes first
    'ing', 'es', 'ly', 'ish',
    'able', 'ible', 'ful', 'less', 'ness', 'ment' // Longer ones last
  ],
  compounds: true
};

export class PuzzleGenerator {
  private wordList: WordList;
  private minWordCount: number;
  private minQualityScore: number;
  private maxAttempts: number;
  private supabase: any; // Type will be SupabaseClient

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
    // Initialize Supabase with service role for system operations
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
    const pangrams = await this.wordList.findPangrams();
    console.log(`Found ${pangrams.length} pangrams`);
    
    if (!pangrams.length) {
      throw new Error('No pangrams found in dictionary');
    }

    let bestPuzzle: GeneratedPuzzle | null = null;
    let attempts = 0;
    let errors: Error[] = [];

    while (attempts < this.maxAttempts) {
      try {
        // Get a random pangram
        const pangram = pangrams[Math.floor(Math.random() * pangrams.length)];
        console.log(`Trying pangram: ${pangram}`);
        
        // Generate letter combinations
        const letterSets = this.generateLetterCombinations(pangram);
        console.log(`Generated ${letterSets.length} letter sets`);
        
        for (const letterSet of letterSets) {
          try {
            // Find all possible words
            const validWords = await this.findAllPossibleWords(letterSet);
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
              new Set(word.split('')).size >= 7
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

            // Update best puzzle if this one is better
            if (!bestPuzzle || puzzle.qualityScore > bestPuzzle.qualityScore) {
              bestPuzzle = puzzle;
              console.log('New best puzzle found with quality score:', puzzle.qualityScore);
            }

            // If puzzle meets minimum quality, try to save and return it
            if (puzzle.qualityScore >= this.minQualityScore) {
              try {
                await this.savePuzzleToDatabase(puzzle);
                console.log('Found puzzle meeting minimum quality score');
                return puzzle;
              } catch (dbError: any) {
                console.error('Database error:', dbError);
                errors.push(new Error(`Database error: ${dbError.message}`));
                continue;
              }
            }
          } catch (letterSetError) {
            console.error('Error processing letter set:', letterSetError);
            continue;
          }
        }

        attempts++;
        console.log(`Attempt ${attempts} completed`);
      } catch (error) {
        console.error('Error generating puzzle:', error);
        errors.push(error as Error);
        attempts++;
      }
    }

    if (!bestPuzzle) {
      const errorMessage = errors.map(e => e.message).join('; ');
      throw new Error(`Failed to generate valid puzzle after ${attempts} attempts. Errors: ${errorMessage}`);
    }

    console.log('Returning best puzzle found after all attempts');
    try {
      await this.savePuzzleToDatabase(bestPuzzle);
    } catch (error) {
      console.error('Failed to save best puzzle:', error);
      // Still return the puzzle even if save fails
    }
    return bestPuzzle;
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
        quality_score: puzzle.qualityScore,
        word_count: puzzle.wordCount,
        metrics: puzzle.metrics,
        difficulty: puzzle.difficulty,
        stage: puzzle.stage,
        date: puzzle.date || new Date().toISOString().split('T')[0],
        word_length_distribution: puzzle.wordLengthDistribution,
        created_at: new Date().toISOString(),
        created_by: null, // Set to null for system-generated puzzles
        is_published: true,
        creator_type: 'SYSTEM'
      };
  
      const { data, error } = await this.supabase
        .from('daily_puzzles')
        .insert([puzzleData])
        .select();
  
      if (error) {
        if (error.code === '42501') {
          throw new Error('Permission denied: Make sure RLS policies are configured correctly');
        } else if (error.code === '23505') {
          throw new Error('A puzzle already exists for this date');
        } else {
          throw new Error(`Database error: ${error.message}`);
        }
      }
  
      console.log('Successfully saved puzzle:', data);
    } catch (error: any) {
      console.error('Error in savePuzzleToDatabase:', error);
      throw new Error(`Failed to save puzzle: ${error.message}`);
    }
  }

  private generateLetterCombinations(pangram: string): LetterSet[] {
    const uniqueLetters = Array.from(new Set(pangram.toLowerCase()));
    const combinations: LetterSet[] = [];
    
    for (const centerLetter of uniqueLetters) {
      const outerLetters = uniqueLetters.filter(l => l !== centerLetter);
      const score = this.scoreLetterSet(centerLetter, outerLetters);
      
      combinations.push({
        centerLetter,
        outerLetters,
        ...score
      });
    }

    return combinations.sort((a, b) => b.score - a.score);
  }

  private async findAllPossibleWords(letters: LetterSet): Promise<string[]> {
    // Get base words
    const baseWords = await this.wordList.findValidWords(
      letters.centerLetter,
      letters.outerLetters,
      {
        minLength: 4,
        maxLength: 15,
        includeVariations: true
      }
    );

    const allWords = new Set<string>();
    
    // Process each base word
    for (const word of baseWords) {
      allWords.add(word);
      
      // Add variations
      const variations = this.generateWordVariations(
        word,
        letters.centerLetter,
        letters.outerLetters
      );
      
      variations.forEach(v => allWords.add(v));

      // Add compounds if enabled
      if (COMMON_PATTERNS.compounds) {
        const compounds = this.generateCompoundWords(
          word,
          letters.centerLetter,
          letters.outerLetters
        );
        compounds.forEach(c => allWords.add(c));
      }
    }

    return Array.from(allWords);
  }

  private generateWordVariations(
    word: string,
    centerLetter: string,
    outerLetters: string[]
  ): string[] {
    const variations = new Set<string>();
    const allLetters = [centerLetter, ...outerLetters];

    // Prioritize short variations first
    const shortPrefixes = COMMON_PATTERNS.prefixes.filter(p => p.length <= 2);
    const shortSuffixes = COMMON_PATTERNS.suffixes.filter(s => s.length <= 2);

    // Try short variations first
    for (const prefix of shortPrefixes) {
      const withPrefix = prefix + word;
      if (this.isValidWord(withPrefix, centerLetter, allLetters) && 
          withPrefix.length <= 6) {
        variations.add(withPrefix);
      }
    }

    for (const suffix of shortSuffixes) {
      let withSuffix = word;
      
      // Handle special cases for short words
      if (suffix === 's' && word.endsWith('y')) {
        withSuffix = word.slice(0, -1) + 'ies';
      } else {
        withSuffix = word + suffix;
      }

      if (this.isValidWord(withSuffix, centerLetter, allLetters) && 
          withSuffix.length <= 6) {
        variations.add(withSuffix);
      }
    }

    // Only add longer variations if we don't have enough short ones
    if (variations.size < 5) {
      const longPrefixes = COMMON_PATTERNS.prefixes.filter(p => p.length > 2);
      const longSuffixes = COMMON_PATTERNS.suffixes.filter(s => s.length > 2);

      for (const prefix of longPrefixes) {
        const withPrefix = prefix + word;
        if (this.isValidWord(withPrefix, centerLetter, allLetters)) {
          variations.add(withPrefix);
        }
      }

      for (const suffix of longSuffixes) {
        let withSuffix = word;
        if (suffix === 'ing' && word.endsWith('e')) {
          withSuffix = word.slice(0, -1) + suffix;
        } else {
          withSuffix = word + suffix;
        }

        if (this.isValidWord(withSuffix, centerLetter, allLetters)) {
          variations.add(withSuffix);
        }
      }
    }

    return Array.from(variations);
  }

  private generateCompoundWords(
    word: string,
    centerLetter: string,
    outerLetters: string[]
  ): string[] {
    const compounds = new Set<string>();
    const allLetters = [centerLetter, ...outerLetters];

    // Focus on short compound endings
    const commonEndings = ['er', 'ed', 's', 'y', 'ly'];
    for (const ending of commonEndings) {
      const compound = word + ending;
      if (this.isValidWord(compound, centerLetter, allLetters) && 
          compound.length <= 7) {
        compounds.add(compound);
      }
    }

    return Array.from(compounds);
  }

  private isValidWord(
    word: string,
    centerLetter: string,
    allowedLetters: string[]
  ): boolean {
    const wordChars = word.toLowerCase().split('');
    const centerLowerCase = centerLetter.toLowerCase();

    // Must contain center letter
    if (!wordChars.includes(centerLowerCase)) {
      return false;
    }

    // All letters must be allowed
    return wordChars.every(char => allowedLetters.includes(char));
  }

  private scoreLetterSet(
    centerLetter: string,
    outerLetters: string[]
  ): {
    score: number;
    vowelCount: number;
    consonantCount: number;
    commonLetterScore: number;
  } {
    const allLetters = [centerLetter, ...outerLetters];

    const vowelCount = allLetters.filter(l => vowels.includes(l)).length;
    const consonantCount = 7 - vowelCount;

    const commonLetterScore = allLetters.reduce(
      (sum, letter) => sum + (letterFrequencies[letter] || 0),
      0
    );

    // Modified scoring to favor combinations good for short words
    const vowelScore = Math.abs(2 - vowelCount) * -10;
    const consonantScore = allLetters.filter(l => 
      consonants.includes(l)
    ).length * 20;

    const shortWordScore = allLetters.filter(l =>
      ['s', 'e', 't', 'a', 'r', 'd'].includes(l)
    ).length * 25;

    const centerScore = letterFrequencies[centerLetter] * 2;
    const balanceScore = (vowelCount >= 2 && consonantCount >= 3) ? 30 : 0;

    return {
      score: vowelScore + consonantScore + centerScore + balanceScore + commonLetterScore + shortWordScore,
      vowelCount,
      consonantCount,
      commonLetterScore
    };
  }

  private analyzeWordDistribution(words: string[]): Record<number, number> {
    return words.reduce((acc, word) => {
      acc[word.length] = (acc[word.length] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
  }

  private isGoodDistribution(distribution: Record<number, number>): boolean {
    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);

    // Calculate overall short word percentage (4-6 letters)
    const shortWordCount = (distribution[4] || 0) + (distribution[5] || 0) + (distribution[6] || 0);
    const shortWordPercentage = shortWordCount / total;

    return (
      shortWordPercentage >= 0.15 && // At least 15% short words
      Object.keys(distribution).length >= 3 && // At least 3 different word lengths
      total >= this.minWordCount // Maintain minimum word count
    );
  }

  private calculateMetrics(words: string[], pangrams: string[]) {
    const scores = {
      wordCount: words.length >= 60 ? 100 : (words.length / 60) * 100,
      pangramCount: pangrams.length > 0 && pangrams.length <= 3 ? 100 : 50,
      averageLength: this.calculateAverageLength(words),
      difficultyScore: this.calculateDifficultyScore(words, pangrams)
    };

    return {
      qualityScore: (
        scores.wordCount * 0.4 +
        scores.pangramCount * 0.3 +
        scores.averageLength * 0.2 +
        scores.difficultyScore * 0.1
      ),
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

  private calculateDifficulty(metrics: any): 'easy' | 'medium' | 'hard' {
    if (metrics.difficultyScore < 40) return 'easy';
    if (metrics.difficultyScore < 70) return 'medium';
    return 'hard';
  }

  private determineStage(metrics: any): 1 | 2 | 3 {
    if (metrics.qualityScore < 60) return 1;
    if (metrics.qualityScore < 80) return 2;
    return 3;
  }

  private countWordFamilies(words: string[]): number {
    const families = new Set<string>();

    for (const word of words) {
      const base = this.getWordRoot(word);
      families.add(base);
    }

    return families.size;
  }

  private getWordRoot(word: string): string {
    const commonSuffixes = ['s', 'es', 'ed', 'ing', 'er', 'ers', 'est', 'able', 'ible'];
    let root = word.toLowerCase();

    // Handle special cases first
    if (root.endsWith('ies')) {
      return root.slice(0, -3) + 'y';
    }
    if (root.endsWith('ing') && root.length > 4) {
      // Check for doubled consonant
      if (this.hasDoubledConsonant(root)) {
        return root.slice(0, -4);
      }
      // Check if we need to add 'e' back
      if (this.shouldAddEBack(root)) {
        return root.slice(0, -3) + 'e';
      }
      return root.slice(0, -3);
    }

    // Try removing common suffixes
    for (const suffix of commonSuffixes) {
      if (root.endsWith(suffix)) {
        const withoutSuffix = root.slice(0, -suffix.length);
        // Don't remove if it makes the word too short
        if (withoutSuffix.length >= 3) {
          return withoutSuffix;
        }
      }
    }

    return root;
  }

  private hasDoubledConsonant(word: string): boolean {
    const beforeIng = word.slice(0, -3);
    if (beforeIng.length < 2) return false;

    const lastTwo = beforeIng.slice(-2);
    return lastTwo[0] === lastTwo[1] && consonants.includes(lastTwo[0]);
  }

  private shouldAddEBack(word: string): boolean {
    const beforeIng = word.slice(0, -3);
    if (beforeIng.length < 3) return false;

    // Check if there's only one syllable and ends in consonant-vowel-consonant
    const lastThree = beforeIng.slice(-3);
    return (
      consonants.includes(lastThree[2]) && // Ends in consonant
      vowels.includes(lastThree[1]) &&     // Vowel before last consonant
      consonants.includes(lastThree[0])     // Consonant before vowel
    );
  }
}