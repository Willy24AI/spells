import { supabase } from '@/lib/db';
import type { GeneratedPuzzle } from '@/lib/types/puzzleGenerator';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class CacheService {
  private puzzleCache: Map<string, CacheEntry<GeneratedPuzzle>>;
  private validationCache: Map<string, CacheEntry<boolean>>;
  private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly VALIDATION_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.puzzleCache = new Map();
    this.validationCache = new Map();
  }

  /**
   * Get puzzle from cache
   */
  getPuzzle(date: string): GeneratedPuzzle | null {
    const entry = this.puzzleCache.get(date);
    if (!entry) return null;

    // Check expiration
    if (Date.now() > entry.expiresAt) {
      this.puzzleCache.delete(date);
      return null;
    }

    return entry.data;
  }

  /**
   * Set puzzle in cache
   */
  setPuzzle(
    date: string, 
    puzzle: GeneratedPuzzle,
    ttl: number = this.DEFAULT_TTL
  ): void {
    const entry: CacheEntry<GeneratedPuzzle> = {
      data: puzzle,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl
    };

    this.puzzleCache.set(date, entry);
  }

  /**
   * Clear specific puzzle from cache
   */
  clearPuzzle(date: string): void {
    this.puzzleCache.delete(date);
  }

  /**
   * Validate word against puzzle
   */
  async validateWord(
    word: string,
    puzzleId: string
  ): Promise<{
    valid: boolean;
    score?: number;
    isPangram?: boolean;
    error?: string;
  }> {
    const cacheKey = `${puzzleId}:${word.toLowerCase()}`;
    
    // Check validation cache
    const cached = this.validationCache.get(cacheKey);
    if (cached && Date.now() <= cached.expiresAt) {
      return { valid: cached.data };
    }

    // Get puzzle and check dictionary
    try {
      const [puzzle, dictWord] = await Promise.all([
        this.getPuzzleById(puzzleId),
        supabase
          .from('words')
          .select('points, isPangram')
          .eq('word', word.toLowerCase())
          .single()
      ]);

      if (!puzzle) {
        return { valid: false, error: 'Puzzle not found' };
      }

      if (!dictWord.data) {
        return { valid: false, error: 'Word not in dictionary' };
      }

      // Validate word
      const normalizedWord = word.toLowerCase();
      const isValid = puzzle.validWords.includes(normalizedWord);
      const isPangram = puzzle.pangrams.includes(normalizedWord);

      // Calculate score if valid
      let score;
      if (isValid) {
        score = dictWord.data.points;
      }

      // Cache result
      this.validationCache.set(cacheKey, {
        data: isValid,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.VALIDATION_TTL
      });

      return {
        valid: isValid,
        score,
        isPangram,
        error: isValid ? undefined : 'Word not in puzzle list'
      };
    } catch (error) {
      console.error('Error validating word:', error);
      return { valid: false, error: 'Validation error occurred' };
    }
  }

  /**
   * Get puzzle by ID (using date)
   */
  private async getPuzzleById(id: string): Promise<GeneratedPuzzle | null> {
    // Check cache first
    const cached = this.getPuzzle(id);
    if (cached) return cached;

    // Fetch from database
    const { data: puzzle } = await supabase
      .from('daily_puzzles')
      .select('*')
      .eq('date', id)
      .single();

    if (!puzzle) return null;

    // Convert to GeneratedPuzzle format
    const result: GeneratedPuzzle = {
      id: puzzle.id,
      centerLetter: puzzle.center_letter,
      outerLetters: puzzle.outer_letters,
      validWords: puzzle.valid_words,
      pangrams: puzzle.pangrams,
      maxScore: puzzle.max_score,
      qualityScore: puzzle.quality_score,
      wordCount: puzzle.word_count,
      commonWordCount: puzzle.valid_words.filter((w: string) => w.length <= 6).length,
      shortWordPercentage: (puzzle.valid_words.filter((w: string) => w.length <= 5).length / puzzle.valid_words.length) * 100,
      averageWordLength: puzzle.average_word_length,
      wordLengthDistribution: puzzle.word_length_distribution,
      difficulty: puzzle.difficulty || 'medium',
      stage: puzzle.stage || 1,
      metrics: puzzle.metrics || {
        wordCount: puzzle.word_count,
        uniqueLetters: 7,
        pangramCount: puzzle.pangrams.length,
        averageWordLength: puzzle.average_word_length,
        commonWordPercentage: 0,
        difficultyScore: 0,
        qualityScore: puzzle.quality_score,
        wordFamilyCount: 0
      },
      dateGenerated: puzzle.created_at,
      generatorVersion: puzzle.generator_version,
      date: puzzle.date
    };

    // Cache the result
    this.setPuzzle(id, result);
    return result;
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();

    // Clear expired puzzles
    Array.from(this.puzzleCache).forEach(([key, entry]) => {
      if (now > entry.expiresAt) {
        this.puzzleCache.delete(key);
      }
    });

    // Clear expired validations
    Array.from(this.validationCache).forEach(([key, entry]) => {
      if (now > entry.expiresAt) {
        this.validationCache.delete(key);
      }
    });
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    this.puzzleCache.clear();
    this.validationCache.clear();
  }
}

// Export singleton instance
export const cacheService = new CacheService();