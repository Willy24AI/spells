// lib/dictionary/wordList.ts

import { supabase } from '@/lib/db';
import { validation } from './validation';

interface WordFamily {
  base: string;
  variations: string[];
  frequency: number;
}

interface WordMetadata {
  word: string;
  length: number;
  isPangram: boolean;
  frequency: number;  // 1-100, higher means more common
  points: number;
  isCommonWord?: boolean;
}

export class WordList {
  private cache: Map<string, WordMetadata>;
  private wordFamilies: Map<string, WordFamily>;
  private debug: boolean;

  constructor(enableDebug = false) {
    this.cache = new Map();
    this.wordFamilies = new Map();
    this.debug = enableDebug;
  }

  private log(...args: any[]) {
    if (this.debug) {
      console.log('[WordList]', ...args);
    }
  }

  private generateWordVariations(base: string): string[] {
    const variations: Set<string> = new Set([base]);
    
    // Simple plural forms
    variations.add(base + 's');
    if (base.endsWith('y')) {
      variations.add(base.slice(0, -1) + 'ies');
    }
    
    // Verb forms
    if (base.endsWith('e')) {
      variations.add(base + 'd');
      variations.add(base.slice(0, -1) + 'ing');
    } else {
      variations.add(base + 'ed');
      variations.add(base + 'ing');
      
      // Double consonant cases for verbs
      if (base.match(/[bcdfgklmnprstvz]$/)) {
        const doubled = base + base.slice(-1);
        variations.add(doubled + 'ed');
        variations.add(doubled + 'ing');
      }
    }
    
    // Comparative/Superlative forms for shorter words
    if (base.length <= 6) {
      if (base.endsWith('e')) {
        variations.add(base + 'r');
        variations.add(base + 'st');
      } else if (base.endsWith('y')) {
        variations.add(base.slice(0, -1) + 'ier');
        variations.add(base.slice(0, -1) + 'iest');
      } else {
        variations.add(base + 'er');
        variations.add(base + 'est');
      }
    }
    
    // Agent nouns
    variations.add(base + 'er');
    variations.add(base + 'ers');

    // Filter variations
    return Array.from(variations).filter(word => {
      const result = validation.validateDictionaryWord(word, {
        minLength: 4,
        allowVariations: true
      });
      return result.isValid;
    });
  }

  private getBaseForm(word: string): string {
    // Handle more complex cases first
    if (word.endsWith('ies')) return word.slice(0, -3) + 'y';
    if (word.endsWith('iest')) return word.slice(0, -4) + 'y';
    if (word.endsWith('ier')) return word.slice(0, -3) + 'y';

    // Handle doubled consonants in -ing forms
    if (word.endsWith('ing')) {
      const base = word.slice(0, -3);
      if (base.length > 1 && base[base.length - 1] === base[base.length - 2]) {
        return base.slice(0, -1);
      }
      return base;
    }

    // Handle doubled consonants in -ed forms
    if (word.endsWith('ed')) {
      const base = word.slice(0, -2);
      if (base.length > 1 && base[base.length - 1] === base[base.length - 2]) {
        return base.slice(0, -1);
      }
      return base;
    }

    // Handle other common endings
    if (word.endsWith('est')) return word.slice(0, -3);
    if (word.endsWith('er')) return word.slice(0, -2);
    if (word.endsWith('s')) return word.slice(0, -1);
    
    return word;
  }

  async initialize() {
    try {
      this.log('Initializing word list...');

      // Fetch words with more lenient filtering
      const { data: words, error } = await supabase
        .from('words')
        .select('*')
        .or('length.gte.4,frequency.gte.30')
        .order('frequency', { ascending: false });

      if (error) throw error;

      this.log(`Fetched ${words?.length || 0} words from database`);

      if (words) {
        let variationCount = 0;
        let familyCount = 0;

        for (const word of words) {
          const normalizedWord = word.word.toLowerCase();
          
          // Validate the word
          const validationResult = validation.validateDictionaryWord(normalizedWord, {
            minLength: 4,
            allowVariations: true,
            minFrequency: 30
          });

          if (!validationResult.isValid) {
            this.log(`Skipping invalid word: ${normalizedWord} (${validationResult.error})`);
            continue;
          }

          // Store base word
          this.cache.set(normalizedWord, {
            word: normalizedWord,
            length: normalizedWord.length,
            isPangram: validation.validatePangram(normalizedWord).isValid,
            frequency: word.frequency || 40,
            points: validation.calculateWordScore(
              normalizedWord,
              validation.validatePangram(normalizedWord).isValid
            ),
            isCommonWord: normalizedWord.length <= 5
          });

          // Generate and store variations
          const baseForm = this.getBaseForm(normalizedWord);
          const variations = this.generateWordVariations(baseForm);
          
          // Store word family
          if (!this.wordFamilies.has(baseForm)) {
            familyCount++;
            this.wordFamilies.set(baseForm, {
              base: baseForm,
              variations: Array.from(new Set([normalizedWord, ...variations])),
              frequency: word.frequency || 40
            });
          }

          // Add variations to cache
          for (const variation of variations) {
            if (!this.cache.has(variation)) {
              variationCount++;
              this.cache.set(variation, {
                word: variation,
                length: variation.length,
                isPangram: false,
                frequency: Math.max(30, word.frequency - 10 || 30),
                points: validation.calculateWordScore(variation, false),
                isCommonWord: variation.length <= 5
              });
            }
          }
        }

        this.log('Word list initialization complete:');
        this.log(`- Base words: ${words.length}`);
        this.log(`- Word families: ${familyCount}`);
        this.log(`- Word variations: ${variationCount}`);
        this.log(`- Total unique words: ${this.cache.size}`);
      }
    } catch (error) {
      console.error('Error initializing word list:', error);
    }
  }

  async findValidWords(
    centerLetter: string,
    outerLetters: string[],
    options: {
      minLength?: number;
      maxLength?: number;
      minFrequency?: number;
      includeVariations?: boolean;
    } = {}
  ): Promise<string[]> {
    this.log('Finding valid words with options:', options);
    this.log('Letters:', { centerLetter, outerLetters });

    const {
      minLength = 4,
      maxLength = 15,
      minFrequency = 0,
      includeVariations = true
    } = options;

    const normalizedCenter = centerLetter.toLowerCase();
    const normalizedOuter = outerLetters.map(l => l.toLowerCase());
    const allLetters = [normalizedCenter, ...normalizedOuter];
    
    const validWords = new Set<string>();
    let stats = {
      totalChecked: 0,
      rejectedByLength: 0,
      rejectedByFrequency: 0,
      rejectedByLetters: 0,
      validFound: 0
    };

    // Check all words in cache
    for (const [word, metadata] of this.cache.entries()) {
      stats.totalChecked++;
      
      // Apply filters
      if (metadata.length < minLength || metadata.length > maxLength) {
        stats.rejectedByLength++;
        continue;
      }

      if (metadata.frequency < minFrequency) {
        stats.rejectedByFrequency++;
        continue;
      }

      if (!word.includes(normalizedCenter) || 
          !word.split('').every(letter => allLetters.includes(letter))) {
        stats.rejectedByLetters++;
        continue;
      }

      validWords.add(word);
      stats.validFound++;

      // Add variations if enabled
      if (includeVariations) {
        const baseForm = this.getBaseForm(word);
        const family = this.wordFamilies.get(baseForm);
        if (family) {
          for (const variation of family.variations) {
            if (
              variation.length >= minLength && 
              variation.length <= maxLength &&
              variation.includes(normalizedCenter) &&
              variation.split('').every(letter => allLetters.includes(letter))
            ) {
              validWords.add(variation);
              stats.validFound++;
            }
          }
        }
      }
    }

    this.log('Word finding results:', stats);

    return Array.from(validWords);
  }

  async findPangrams(): Promise<string[]> {
    return Array.from(this.cache.entries())
      .filter(([_, metadata]) => metadata.isPangram)
      .map(([word]) => word);
  }

  async getWordMetadata(word: string): Promise<WordMetadata | null> {
    return this.cache.get(word.toLowerCase()) || null;
  }

  getWordFamily(word: string): WordFamily | null {
    const baseForm = this.getBaseForm(word.toLowerCase());
    return this.wordFamilies.get(baseForm) || null;
  }
}