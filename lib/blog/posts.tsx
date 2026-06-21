import React from 'react';
import Link from 'next/link';

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  datePublished: string; // YYYY-MM-DD
  dateModified: string; // YYYY-MM-DD
  keywords: string[];
  /** Short teaser shown on the blog index. */
  excerpt: string;
  /** Article body. */
  Body: React.FC;
  /** Optional FAQ rendered + emitted as FAQPage structured data. */
  faq?: { q: string; a: string }[];
}

const h2 = 'mt-10 text-2xl font-semibold text-gray-900';
const p = 'mt-4 text-gray-700';
const ul = 'mt-4 space-y-2 text-gray-700 list-disc list-inside';

export const posts: BlogPost[] = [
  {
    slug: 'spelling-bee-tips-and-tricks',
    title: 'Spelling Bee Tips and Tricks: How to Reach Queen Bee',
    description:
      'Practical Spelling Bee tips and tricks to score more points and reach Queen Bee — from finding the pangram to spotting suffixes and unusual letter pairs.',
    datePublished: '2026-06-21',
    dateModified: '2026-06-21',
    keywords: ['spelling bee tips and tricks', 'spelling bee tips', 'how to get queen bee', 'spelling bee strategy'],
    excerpt:
      'From hunting the pangram to milking suffixes, here are the tips that reliably push your score from Good to Queen Bee.',
    faq: [
      {
        q: 'What is the fastest way to score points in Spelling Bee?',
        a: 'Find the pangram early — it uses all seven letters and adds a 7-point bonus on top of its length — then chase the longest words, since each letter is worth a point.'
      },
      {
        q: 'How do you reach Queen Bee?',
        a: 'Queen Bee is based on the share of the total points you collect. Find the long words and every pangram, work suffixes like -ing and -ed, and shuffle the letters to spot combinations you missed.'
      }
    ],
    Body: function Body() {
      return (
        <>
          <p className={p}>
            Spelling Bee looks simple — make words from seven letters — but climbing from a casual score to{' '}
            <strong>Queen Bee</strong> takes a bit of strategy. These are the tips that make the biggest
            difference, whether you play our{' '}
            <Link href="/" className="text-yellow-700 underline">free Spelling Bee</Link> or any honeycomb word game.
          </p>

          <h2 className={h2}>1. Hunt the pangram first</h2>
          <p className={p}>
            Every puzzle has at least one <Link href="/pangram" className="text-yellow-700 underline">pangram</Link> — a
            word that uses all seven letters. It scores a point per letter <em>plus</em> a 7-point bonus, so it&apos;s
            the single most valuable find. Look at the seven letters and ask: is there a common word that touches all of them?
          </p>

          <h2 className={h2}>2. Lean on suffixes and prefixes</h2>
          <p className={p}>When you find one word, you often unlock several more with endings and beginnings:</p>
          <ul className={ul}>
            <li>Endings: <strong>-ing, -ed, -er, -ers, -est, -tion, -able, -ment</strong></li>
            <li>Beginnings: <strong>re-, un-, de-, over-, out-</strong></li>
            <li>Plurals: if S is available, almost every noun gives you a second word.</li>
          </ul>

          <h2 className={h2}>3. Chase length, not count</h2>
          <p className={p}>
            A handful of seven- and eight-letter words is worth more than a pile of four-letter ones. Once you&apos;ve
            swept the short words, deliberately try to extend them: <em>cat → coat → coats → coaster</em>.
          </p>

          <h2 className={h2}>4. Shuffle to see fresh patterns</h2>
          <p className={p}>
            Re-arranging the outer letters breaks the mental rut of reading them in the same order. A quick shuffle often
            reveals a word that was hiding in plain sight.
          </p>

          <h2 className={h2}>5. Work the centre letter</h2>
          <p className={p}>
            Every word must use the centre letter, so pair it with each other letter in turn (CA, CE, CI, CO…) and listen
            for word starts. It&apos;s a systematic way to make sure you haven&apos;t missed an obvious word.
          </p>

          <h2 className={h2}>6. Come back later</h2>
          <p className={p}>
            Fresh eyes find words. Leave the puzzle and return — you&apos;ll spot answers you walked past the first time.
            Yesterday&apos;s puzzle and its full answer list live in the{' '}
            <Link href="/yesterday" className="text-yellow-700 underline">archive</Link> if you want to compare.
          </p>

          <p className={p}>
            New to the format? Start with{' '}
            <Link href="/how-to-play" className="text-yellow-700 underline">how to play Spelling Bee</Link>, then put these
            tips to work on <Link href="/" className="text-yellow-700 underline">today&apos;s puzzle</Link>.
          </p>
        </>
      );
    }
  },
  {
    slug: 'how-to-find-pangrams',
    title: 'How to Find Pangrams in Spelling Bee',
    description:
      'A simple method for finding pangrams in Spelling Bee. Learn how to use all seven letters, spot common pangram patterns, and grab the bonus every day.',
    datePublished: '2026-06-21',
    dateModified: '2026-06-21',
    keywords: ['how to find pangrams', 'find pangram spelling bee', 'pangram tips', 'what is a pangram'],
    excerpt:
      'The pangram is the biggest score in the puzzle. Here’s a repeatable way to find the word that uses all seven letters.',
    faq: [
      {
        q: 'What is a pangram?',
        a: 'A pangram is a word that uses all seven of the puzzle’s letters at least once. A perfect pangram uses each letter exactly once.'
      },
      {
        q: 'How many pangrams are in a Spelling Bee puzzle?',
        a: 'There is always at least one, and some puzzles have two or more.'
      }
    ],
    Body: function Body() {
      return (
        <>
          <p className={p}>
            The <Link href="/pangram" className="text-yellow-700 underline">pangram</Link> — a word using all seven
            letters — is the highest-value find in any Spelling Bee. Here&apos;s a reliable method to track it down
            instead of waiting for luck.
          </p>

          <h2 className={h2}>Start from the rare letters</h2>
          <p className={p}>
            Look at the least common letters in the set — things like <strong>G, H, K, M, P, V, Y</strong>. A pangram must
            include them, so they narrow the search fast. Ask what words could possibly contain that awkward letter
            alongside the centre letter.
          </p>

          <h2 className={h2}>Count vowels and consonants</h2>
          <p className={p}>
            Most pangrams are 7–9 letters long with a workable vowel balance. If the set has two vowels, you&apos;re
            usually looking for a longer word that repeats one of them.
          </p>

          <h2 className={h2}>Think in word shapes</h2>
          <ul className={ul}>
            <li>Compound-ish words and -ing/-tion endings often soak up all seven letters.</li>
            <li>Try planting the rare letter at the start, middle, and end of a candidate word.</li>
            <li>If S is present, a plural or third-person verb frequently completes a pangram.</li>
          </ul>

          <h2 className={h2}>Use the shuffle</h2>
          <p className={p}>
            Shuffling the outer letters re-frames the set and helps your brain assemble the long word. Pangrams tend to
            &quot;pop&quot; once the letters aren&apos;t in their usual position.
          </p>

          <h2 className={h2}>Practise on past puzzles</h2>
          <p className={p}>
            Want to train your eye? Open the <Link href="/yesterday" className="text-yellow-700 underline">archive</Link>,
            look at the letters, and try to find the pangram before revealing the answers. Then jump into{' '}
            <Link href="/" className="text-yellow-700 underline">today&apos;s puzzle</Link> and grab the bonus.
          </p>
        </>
      );
    }
  }
];

export function getPost(slug: string): BlogPost | undefined {
  return posts.find((post) => post.slug === slug);
}
