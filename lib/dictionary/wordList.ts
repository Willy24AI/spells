import { supabase } from '@/lib/db';
import { metadata } from './metadata';
import { filters } from './filters';
import { validation } from './validation';
import type { WordMetadata } from './metadata';

export interface SimplifiedWordMetadata {
  word: string;
  length: number;
  isPangram: boolean;
  points: number;
}

export class WordList {
  private cache: Map<string, SimplifiedWordMetadata>;

  constructor() {
    this.cache = new Map();
  }

  async initialize() {
    const { data: words } = await supabase
      .from('words')
      .select('*');
    
    if (words) {
      for (const word of words) {
        this.cache.set(word.word, {
          word: word.word,
          length: word.length,
          isPangram: word.is_pangram,
          points: word.points
        });
      }
    }
  }

  async addWord(word: string): Promise<boolean> {
    const validationResult = validation.validateDictionaryWord(word);
    if (!validationResult.isValid) {
      return false;
    }

    const fullMetadata = metadata.calculateWordMetadata(word);

    const { error } = await supabase
      .from('words')
      .insert({
        word: word.toLowerCase(),
        length: word.length,
        points: fullMetadata.points,
        is_pangram: fullMetadata.isPangram
      });

    if (error) {
      console.error('Error adding word:', error);
      return false;
    }

    this.cache.set(word.toLowerCase(), {
      word: word.toLowerCase(),
      length: word.length,
      isPangram: fullMetadata.isPangram,
      points: fullMetadata.points
    });
    
    return true;
  }

  async findPangrams(): Promise<string[]> {
    const { data: pangrams } = await supabase
      .from('words')
      .select('word')
      .eq('is_pangram', true);

    return pangrams?.map(p => p.word) || [];
  }

  async findValidWords(
    centerLetter: string,
    outerLetters: string[]
  ): Promise<string[]> {
    const allLetters = [centerLetter, ...outerLetters].map(l => l.toLowerCase());
    
    // Check cache first
    const cachedWords: string[] = [];
    this.cache.forEach((_, word) => {
      if (metadata.isValidForPuzzle(word, centerLetter, outerLetters)) {
        cachedWords.push(word);
      }
    });

    if (cachedWords.length > 0) {
      return cachedWords;
    }

    // Query database if cache misses
    const { data: words } = await supabase
      .from('words')
      .select('word');

    return words
      ?.map(w => w.word)
      .filter(word => 
        metadata.isValidForPuzzle(word, centerLetter, outerLetters)
      ) || [];
  }

  async getWordMetadata(word: string): Promise<SimplifiedWordMetadata | null> {
    const cached = this.cache.get(word.toLowerCase());
    if (cached) {
      return cached;
    }

    const { data } = await supabase
      .from('words')
      .select('*')
      .eq('word', word.toLowerCase())
      .single();

    if (!data) {
      return null;
    }

    const simplified: SimplifiedWordMetadata = {
      word: data.word,
      length: data.length,
      isPangram: data.is_pangram,
      points: data.points
    };

    this.cache.set(word.toLowerCase(), simplified);
    return simplified;
  }

  getLetterFrequencies(): Record<string, number> {
    const frequencies: Record<string, number> = {};
    const totalWords = this.cache.size;
    
    // Count letter occurrences in each word
    this.cache.forEach((_, word) => {
      Array.from(word.toLowerCase()).forEach((letter: string) => {
        frequencies[letter] = (frequencies[letter] || 0) + 1;
      });
    });

    // Convert to percentages
    Object.keys(frequencies).forEach(letter => {
      frequencies[letter] = (frequencies[letter] / totalWords) * 100;
    });

    return frequencies;
  }
}