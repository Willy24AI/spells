// lib/dictionary/wordList.ts

import { supabase } from '@/lib/db';
import { metadata } from './metadata';
import { filters } from './filters';
import type { WordMetadata } from './metadata';

export class WordList {
  private cache: Map<string, WordMetadata>;
  private wordPatterns: Map<string, string[]>;

  constructor() {
    this.cache = new Map();
    this.wordPatterns = new Map();
  }

  async initialize() {
    const { data: words } = await supabase
      .from('words')
      .select('*');
    
    if (words) {
      for (const word of words) {
        const meta = metadata.calculateWordMetadata(word.word);
        this.cache.set(word.word, meta);
        this.addToWordPatterns(word.word);
      }
    }
  }

  private addToWordPatterns(word: string) {
    // Get base form of word
    const base = this.getBaseForm(word);
    if (!this.wordPatterns.has(base)) {
      this.wordPatterns.set(base, []);
    }
    this.wordPatterns.get(base)?.push(word);
  }

  private getBaseForm(word: string): string {
    const suffixes = ['s', 'es', 'ed', 'ing', 'er', 'ers'];
    let base = word.toLowerCase();
    
    // Remove common suffixes
    for (const suffix of suffixes) {
      if (base.endsWith(suffix)) {
        // Handle special cases
        if (suffix === 'ing' && base.endsWith('ing')) {
          if (base.endsWith('ying')) {
            return base.slice(0, -4) + 'y';
          }
          return base.slice(0, -3) + 'e';
        }
        return base.slice(0, -suffix.length);
      }
    }
    return base;
  }
  async findPangrams(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('words')
        .select('word')
        .eq('is_pangram', true);

      if (error) throw error;
      
      // Return an empty array if no data
      if (!data) return [];

      // Return only the words from the pangrams
      return data.map(p => p.word.toLowerCase());
    } catch (error) {
      console.error('Error finding pangrams:', error);
      return [];
    }
  }

  async findValidWords(
    centerLetter: string,
    outerLetters: string[],
    options: {
      minLength?: number;
      maxLength?: number;
      includeVariations?: boolean;
    } = {}
  ): Promise<string[]> {
    const allLetters = [centerLetter, ...outerLetters].map(l => l.toLowerCase());
    const centerLowerCase = centerLetter.toLowerCase();
    const validWords = new Set<string>();

    // First get all base words
    const { data: baseWords } = await supabase
      .from('words')
      .select('word')
      .gte('length', options.minLength || 4)
      .lte('length', options.maxLength || 15);

    if (!baseWords) return [];

    // Process each base word and its variations
    for (const { word } of baseWords) {
      const normalizedWord = word.toLowerCase();
      
      // Check if word can be formed with given letters
      if (this.canFormWord(normalizedWord, centerLowerCase, allLetters)) {
        validWords.add(normalizedWord);

        // Add variations if enabled
        if (options.includeVariations) {
          const variations = this.getWordVariations(normalizedWord, centerLowerCase, allLetters);
          variations.forEach(v => validWords.add(v));
        }
      }
    }

    return Array.from(validWords);
  }

  private canFormWord(word: string, centerLetter: string, allowedLetters: string[]): boolean {
    // Must contain center letter
    if (!word.includes(centerLetter)) return false;

    // Check each letter
    return word.split('').every(letter => allowedLetters.includes(letter));
  }

  private getWordVariations(baseWord: string, centerLetter: string, allowedLetters: string[]): string[] {
    const variations: string[] = [];
    
    // Common transformations
    const transforms = [
      // Plurals
      (w: string) => w + 's',
      (w: string) => w.endsWith('y') ? w.slice(0, -1) + 'ies' : w + 's',
      // Past tense
      (w: string) => w + 'ed',
      (w: string) => w.endsWith('e') ? w + 'd' : w + 'ed',
      // Present participle
      (w: string) => w + 'ing',
      (w: string) => w.endsWith('e') ? w.slice(0, -1) + 'ing' : w + 'ing',
      // Comparatives
      (w: string) => w + 'er',
      // Superlatives
      (w: string) => w + 'est',
      // Agent nouns
      (w: string) => w + 'er',
      (w: string) => w + 'or',
      // Re- prefix
      (w: string) => 're' + w,
    ];

    // Apply each transformation and validate
    for (const transform of transforms) {
      const variation = transform(baseWord);
      if (this.canFormWord(variation, centerLetter, allowedLetters)) {
        variations.push(variation);
      }
    }

    return variations;
  }
}