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

    // Get puzzle
    const puzzle = await this.getPuzzleById(puzzleId);
    if (!puzzle) {
      return { valid: false, error: 'Puzzle not found' };
    }

    // Validate word
    const normalizedWord = word.toLowerCase();
    const isValid = puzzle.validWords.includes(normalizedWord);
    const isPangram = puzzle.pangrams.includes(normalizedWord);

    // Calculate score if valid
    let score;
    if (isValid) {
      score = normalizedWord.length === 4 ? 1 : normalizedWord.length;
      if (isPangram) score += 7;
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
  }

  /**
   * Get puzzle by ID (using date)
   */
  private async getPuzzleById(id: string): Promise<GeneratedPuzzle | null> {
    // First check cache
    const cached = this.getPuzzle(id);
    if (cached) return cached;

    // Otherwise, need to fetch from database
    // Note: In a real implementation, this would fetch from your database
    // For now, return null to indicate puzzle not found
    return null;
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();

    // Clear expired puzzles using Array.from to handle iteration
    Array.from(this.puzzleCache).forEach(([key, entry]) => {
      if (now > entry.expiresAt) {
        this.puzzleCache.delete(key);
      }
    });

    // Clear expired validations using Array.from to handle iteration
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