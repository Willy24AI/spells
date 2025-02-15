// app/api/dictionary/route.ts

import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { WordList } from '@/lib/dictionary/wordList';
import { metadata } from '@/lib/dictionary/metadata';
import { filters } from '@/lib/dictionary/filters';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.toLowerCase();
    const type = searchParams.get('type'); // 'all', 'pangrams', 'common'
    
    const supabase = createRouteHandlerClient({ cookies });

    let dbQuery = supabase.from('dictionary').select('*');

    if (query) {
      dbQuery = dbQuery.ilike('word', `%${query}%`);
    }

    if (type === 'pangrams') {
      dbQuery = dbQuery.eq('is_pangram', true);
    } else if (type === 'common') {
      dbQuery = dbQuery.eq('is_common', true);
    }

    const { data, error } = await dbQuery.limit(100);

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Dictionary query error:', error);
    return NextResponse.json(
      { error: 'Failed to query dictionary' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check admin status
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.user_metadata.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { words, operation } = body;

    if (!Array.isArray(words)) {
      return NextResponse.json(
        { error: 'Invalid input' },
        { status: 400 }
      );
    }

    const wordList = new WordList();
    await wordList.initialize();

    if (operation === 'add') {
      // Filter and process words
      const validWords = words.filter(word => 
        filters.applyAll(word, {
          minLength: 4,
          checkProperNouns: true,
          requireVowels: true
        })
      );

      // Calculate metadata and prepare for insertion
      const wordData = validWords.map(word => {
        const meta = metadata.calculateWordMetadata(word);
        return {
          word: meta.word,
          length: meta.length,
          letters: meta.letters,
          unique_letters: meta.uniqueLetters,
          letter_count: meta.letterCount,
          is_pangram: meta.isPangram,
          is_pangram_7: meta.isPangram7,
          vowel_count: meta.vowelCount,
          consonant_count: meta.consonantCount
        };
      });

      // Batch insert
      const { data, error } = await supabase
        .from('dictionary')
        .upsert(wordData, {
          onConflict: 'word',
          ignoreDuplicates: true
        });

      if (error) throw error;

      return NextResponse.json({
        added: wordData.length,
        skipped: words.length - wordData.length
      });
    } else if (operation === 'remove') {
      // Add to exclusions and remove from dictionary
      const { error: exclusionError } = await supabase
        .from('word_exclusions')
        .insert(
          words.map(word => ({
            word: word.toLowerCase(),
            reason: 'Manual removal'
          }))
        );

      if (exclusionError) throw exclusionError;

      const { error: removalError } = await supabase
        .from('dictionary')
        .delete()
        .in('word', words.map(w => w.toLowerCase()));

      if (removalError) throw removalError;

      return NextResponse.json({
        removed: words.length
      });
    }

    return NextResponse.json(
      { error: 'Invalid operation' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Dictionary modification error:', error);
    return NextResponse.json(
      { error: 'Failed to modify dictionary' },
      { status: 500 }
    );
  }
}