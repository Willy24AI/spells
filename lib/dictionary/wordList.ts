// lib/dictionary/wordList.ts

import { supabase } from '@/lib/db';
import { metadata, type WordMetadata } from './metadata';
import { filters } from './filters';
import { validation } from './validation';

export class WordList {
  private cache: Map<string, WordMetadata>;
  private exclusionList: Set<string>;

  constructor() {
    this.cache = new Map();
    this.exclusionList = new Set();
  }

  /**
   * Initialize the word list
   */
  async initialize() {
    // Load exclusion list
    const { data: exclusions } = await supabase
      .from('word_exclusions')
      .select('word');
    
    this.exclusionList = new Set(
      exclusions?.map(e => e.word.toLowerCase()) || []
    );

    // Prime cache with common words
    const { data: commonWords } = await supabase
      .from('dictionary')
      .select('*')
      .eq('is_common', true);

    if (commonWords) {
      for (const word of commonWords) {
        this.cache.set(word.word, {
          word: word.word,
          length: word.length,
          letters: word.letters,
          uniqueLetters: word.unique_letters,
          letterCount: word.letter_count,
          isPangram: word.is_pangram,
          isPangram7: word.is_pangram_7,
          vowelCount: word.vowel_count,
          consonantCount: word.consonant_count
        });
      }
    }
  }

  /**
   * Add a new word to the dictionary
   */
  async addWord(word: string): Promise<boolean> {
    // Validate the word
    const validationResult = validation.validateDictionaryWord(word);
    if (!validationResult.isValid) {
      return false;
    }

    // Calculate metadata
    const wordMetadata = metadata.calculateWordMetadata(word);

    // Store in database
    const { error } = await supabase
      .from('dictionary')
      .insert({
        word: wordMetadata.word,
        length: wordMetadata.length,
        letters: wordMetadata.letters,
        unique_letters: wordMetadata.uniqueLetters,
        letter_count: wordMetadata.letterCount,
        is_pangram: wordMetadata.isPangram,
        is_pangram_7: wordMetadata.isPangram7,
        vowel_count: wordMetadata.vowelCount,
        consonant_count: wordMetadata.consonantCount
      });

    if (error) {
      console.error('Error adding word:', error);
      return false;
    }

    // Update cache
    this.cache.set(wordMetadata.word, wordMetadata);
    return true;
  }

  /**
   * Batch import words
   */
  async importWords(words: string[]): Promise<{
    added: number;
    skipped: number;
    errors: number;
  }> {
    let added = 0;
    let skipped = 0;
    let errors = 0;

    // Process in batches
    const batchSize = 100;
    for (let i = 0; i < words.length; i += batchSize) {
      const batch = words.slice(i, i + batchSize);
      const validWords = batch.filter(word => 
        filters.applyAll(word, {
          exclusionList: this.exclusionList
        })
      );

      if (validWords.length > 0) {
        const wordData = validWords.map(word => {
          const wordMetadata = metadata.calculateWordMetadata(word);
          return {
            word: wordMetadata.word,
            length: wordMetadata.length,
            letters: wordMetadata.letters,
            unique_letters: wordMetadata.uniqueLetters,
            letter_count: wordMetadata.letterCount,
            is_pangram: wordMetadata.isPangram,
            is_pangram_7: wordMetadata.isPangram7,
            vowel_count: wordMetadata.vowelCount,
            consonant_count: wordMetadata.consonantCount
          };
        });

        // Batch insert into database
        const { error } = await supabase
          .from('dictionary')
          .insert(wordData);

        if (error) {
          console.error('Batch import error:', error);
          errors += batch.length;
        } else {
          added += validWords.length;
          skipped += batch.length - validWords.length;

          // Update cache for valid words
          validWords.forEach(word => {
            const wordMetadata = metadata.calculateWordMetadata(word);
            this.cache.set(word, wordMetadata);
          });
        }
      } else {
        skipped += batch.length;
      }
    }

    return { added, skipped, errors };
  }

  /**
   * Find pangrams in the dictionary
   */
  async findPangrams(exact7: boolean = true): Promise<string[]> {
    const { data: pangrams } = await supabase
      .from('dictionary')
      .select('word')
      .eq(exact7 ? 'is_pangram_7' : 'is_pangram', true);

    return pangrams?.map(p => p.word) || [];
  }

  /**
   * Find all valid words for a puzzle
   */
  async findValidWords(
    centerLetter: string,
    outerLetters: string[]
  ): Promise<string[]> {
    const allLetters = [centerLetter, ...outerLetters].map(l => l.toLowerCase());
    
    // First check cache
    const cachedWords = Array.from(this.cache.entries())
      .filter(([word, meta]) => 
        metadata.isValidForPuzzle(word, centerLetter, outerLetters)
      )
      .map(([word]) => word);

    if (cachedWords.length > 0) {
      return cachedWords;
    }

    // Query database if cache misses
    const { data: words } = await supabase
      .from('dictionary')
      .select('word')
      .contains('letters', allLetters);

    // Filter for valid puzzle words
    return words
      ?.map(w => w.word)
      .filter(word => 
        metadata.isValidForPuzzle(word, centerLetter, outerLetters)
      ) || [];
  }

  /**
   * Get word metadata
   */
  async getWordMetadata(word: string): Promise<WordMetadata | null> {
    // Check cache first
    const cached = this.cache.get(word.toLowerCase());
    if (cached) {
      return cached;
    }

    // Query database
    const { data } = await supabase
      .from('dictionary')
      .select('*')
      .eq('word', word.toLowerCase())
      .single();

    if (!data) {
      return null;
    }

    const wordMetadata: WordMetadata = {
      word: data.word,
      length: data.length,
      letters: data.letters,
      uniqueLetters: data.unique_letters,
      letterCount: data.letter_count,
      isPangram: data.is_pangram,
      isPangram7: data.is_pangram_7,
      vowelCount: data.vowel_count,
      consonantCount: data.consonant_count
    };

    // Update cache
    this.cache.set(word.toLowerCase(), wordMetadata);
    return wordMetadata;
  }
}