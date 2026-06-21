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
  /** Article body — plain semantic HTML, styled by the `prose` wrapper. */
  Body: React.FC;
  /** Optional FAQ rendered + emitted as FAQPage structured data. */
  faq?: { q: string; a: string }[];
  /** Curated related-post slugs shown at the foot of the article. */
  related?: string[];
}

export const posts: BlogPost[] = [
  {
    slug: 'spelling-bee-tips-and-tricks',
    title: 'Spelling Bee Tips and Tricks: How to Reach Queen Bee',
    description:
      'Practical Spelling Bee tips and tricks to score more points and reach Queen Bee — from finding the pangram to spotting suffixes and unusual letter pairs.',
    datePublished: '2026-06-21',
    dateModified: '2026-06-21',
    keywords: ['spelling bee tips and tricks', 'spelling bee tips', 'how to get queen bee', 'spelling bee strategy'],
    related: ['how-to-find-pangrams', 'best-words-for-spelling-bee', 'how-many-words-in-a-spelling-bee'],
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
          <p>
            Spelling Bee looks simple — make words from seven letters — but climbing from a casual score to{' '}
            <strong>Queen Bee</strong> takes a bit of strategy. These are the tips that make the biggest difference,
            whether you play our <Link href="/">free Spelling Bee</Link> or any honeycomb word game.
          </p>

          <h2>1. Hunt the pangram first</h2>
          <p>
            Every puzzle has at least one <Link href="/pangram">pangram</Link> — a word that uses all seven letters. It
            scores a point per letter <em>plus</em> a 7-point bonus, so it&apos;s the single most valuable find. Look at
            the seven letters and ask: is there a common word that touches all of them?
          </p>

          <h2>2. Lean on suffixes and prefixes</h2>
          <p>When you find one word, you often unlock several more with endings and beginnings:</p>
          <ul>
            <li>Endings: <strong>-ing, -ed, -er, -ers, -est, -tion, -able, -ment</strong></li>
            <li>Beginnings: <strong>re-, un-, de-, over-, out-</strong></li>
            <li>Plurals: if S is available, almost every noun gives you a second word.</li>
          </ul>

          <h2>3. Chase length, not count</h2>
          <p>
            A handful of seven- and eight-letter words is worth more than a pile of four-letter ones. Once you&apos;ve
            swept the short words, deliberately try to extend them: <em>cat → coat → coats → coaster</em>.
          </p>

          <h2>4. Shuffle to see fresh patterns</h2>
          <p>
            Re-arranging the outer letters breaks the mental rut of reading them in the same order. A quick shuffle often
            reveals a word that was hiding in plain sight.
          </p>

          <h2>5. Work the centre letter</h2>
          <p>
            Every word must use the <Link href="/blog/what-is-the-centre-letter">centre letter</Link>, so pair it with
            each other letter in turn (CA, CE, CI, CO…) and listen for word starts. It&apos;s a systematic way to make
            sure you haven&apos;t missed an obvious word.
          </p>

          <h2>6. Come back later</h2>
          <p>
            Fresh eyes find words. Leave the puzzle and return — you&apos;ll spot answers you walked past the first time.
            Yesterday&apos;s puzzle and its full answer list live in the <Link href="/yesterday">archive</Link> if you
            want to compare.
          </p>

          <p>
            New to the format? Start with <Link href="/how-to-play">how to play Spelling Bee</Link>, then put these tips
            to work on <Link href="/">today&apos;s puzzle</Link>.
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
    related: ['best-words-for-spelling-bee', 'spelling-bee-tips-and-tricks', 'what-is-the-centre-letter'],
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
          <p>
            The <Link href="/pangram">pangram</Link> — a word using all seven letters — is the highest-value find in any
            Spelling Bee. Here&apos;s a reliable method to track it down instead of waiting for luck.
          </p>

          <h2>Start from the rare letters</h2>
          <p>
            Look at the least common letters in the set — things like <strong>G, H, K, M, P, V, Y</strong>. A pangram
            must include them, so they narrow the search fast. Ask what words could possibly contain that awkward letter
            alongside the centre letter.
          </p>

          <h2>Count vowels and consonants</h2>
          <p>
            Most pangrams are 7–9 letters long with a workable vowel balance. If the set has two vowels, you&apos;re
            usually looking for a longer word that repeats one of them.
          </p>

          <h2>Think in word shapes</h2>
          <ul>
            <li>Compound-ish words and -ing/-tion endings often soak up all seven letters.</li>
            <li>Try planting the rare letter at the start, middle, and end of a candidate word.</li>
            <li>If S is present, a plural or third-person verb frequently completes a pangram.</li>
          </ul>

          <h2>Use the shuffle</h2>
          <p>
            Shuffling the outer letters re-frames the set and helps your brain assemble the long word. Pangrams tend to
            &quot;pop&quot; once the letters aren&apos;t in their usual position.
          </p>

          <h2>Practise on past puzzles</h2>
          <p>
            Want to train your eye? Open the <Link href="/yesterday">archive</Link>, look at the letters, and try to find
            the pangram before revealing the answers. Then jump into <Link href="/">today&apos;s puzzle</Link> and grab
            the bonus.
          </p>
        </>
      );
    }
  },
  {
    slug: 'best-words-for-spelling-bee',
    title: 'Best Words for Spelling Bee: High-Scoring Words to Know',
    description:
      'The best words for Spelling Bee are long words and pangrams. Learn the high-scoring word patterns, suffixes and letter combos that rack up the most points.',
    datePublished: '2026-06-21',
    dateModified: '2026-06-21',
    keywords: ['best words for spelling bee', 'high scoring spelling bee words', 'good spelling bee words', 'spelling bee word list'],
    related: ['spelling-bee-tips-and-tricks', 'how-to-find-pangrams', 'how-many-words-in-a-spelling-bee'],
    excerpt:
      'Because the letters change daily, the “best” words are really the best patterns. Here are the word shapes that score big.',
    faq: [
      {
        q: 'What are the best words to play in Spelling Bee?',
        a: 'The highest-scoring words are pangrams (all seven letters, +7 bonus) and long words, since each letter is worth a point. Words with common suffixes like -ing, -ness and -tion tend to be long and easy to find.'
      },
      {
        q: 'Is there a fixed list of Spelling Bee words?',
        a: 'No — the seven letters change every day, so the valid words change too. What stays constant is the patterns: long words, pangrams, and suffix/prefix families.'
      }
    ],
    Body: function Body() {
      return (
        <>
          <p>
            People search for a list of the &quot;best words for Spelling Bee&quot;, but because the seven letters change
            every day, no fixed list can apply. What <em>does</em> carry over is the <strong>patterns</strong> that score
            the most points. Learn these and you&apos;ll find the big words in any puzzle.
          </p>

          <h2>Why long words win</h2>
          <p>
            Four-letter words are worth just 1 point, while a longer word scores one point per letter — and a{' '}
            <Link href="/pangram">pangram</Link> adds a 7-point bonus. So a single eight-letter pangram can outscore a
            dozen four-letter words. Always reach for length.
          </p>

          <h2>High-value suffix families</h2>
          <p>These endings tend to produce long, easy-to-spot words:</p>
          <ul>
            <li><strong>-ing</strong>: running, cleaning, treating</li>
            <li><strong>-tion / -ation</strong>: creation, relation, dictation</li>
            <li><strong>-ness</strong>: kindness, lateness, illness</li>
            <li><strong>-able / -ible</strong>: readable, sensible</li>
            <li><strong>-ment</strong>: treatment, statement</li>
          </ul>

          <h2>Productive prefixes</h2>
          <ul>
            <li><strong>re-</strong>: retreat, relearn, restate</li>
            <li><strong>un-</strong>: unclean, unable</li>
            <li><strong>over- / out-</strong>: overeat, outline</li>
          </ul>

          <h2>Letter combos that unlock words</h2>
          <p>
            When these letters appear together, look for the words they imply: <strong>TH, CH, SH, ING, TION, GHT</strong>.
            If you have <strong>S</strong>, remember that most nouns and verbs gain a second valid word in plural or
            third-person form.
          </p>

          <h2>Build word ladders</h2>
          <p>
            Start small and extend: <em>eat → neat → treat → retreat → retreats</em>. Each step is a new word and the
            longest one scores the most. For more scoring strategy, see our{' '}
            <Link href="/blog/spelling-bee-tips-and-tricks">tips and tricks</Link>, then try{' '}
            <Link href="/">today&apos;s puzzle</Link>.
          </p>
        </>
      );
    }
  },
  {
    slug: 'what-is-the-centre-letter',
    title: 'What Is the Centre Letter in Spelling Bee?',
    description:
      'The centre letter (or center letter) in Spelling Bee is the yellow hexagon every word must use. Here’s what it means and how to use it to find more words.',
    datePublished: '2026-06-21',
    dateModified: '2026-06-21',
    keywords: ['what is the centre letter', 'center letter spelling bee', 'centre letter spelling bee', 'spelling bee center letter rule'],
    related: ['how-to-find-pangrams', 'spelling-bee-tips-and-tricks', 'spelling-bee-for-kids'],
    excerpt:
      'The yellow hexagon in the middle is the one rule that shapes every answer. Here’s how the centre letter works.',
    faq: [
      {
        q: 'What is the centre letter in Spelling Bee?',
        a: 'It is the highlighted letter in the middle of the honeycomb. Every valid word must contain the centre letter at least once.'
      },
      {
        q: 'Is it spelled centre or center?',
        a: 'Both — “centre” is British spelling and “center” is American. In Spelling Bee they mean the same middle, must-use letter.'
      }
    ],
    Body: function Body() {
      return (
        <>
          <p>
            The <strong>centre letter</strong> (American spelling: <strong>center letter</strong>) is the highlighted
            hexagon in the middle of the honeycomb. It&apos;s the heart of the game&apos;s one big rule: every word you
            play must include it.
          </p>

          <h2>The rule in one line</h2>
          <p>
            A valid word must be at least four letters long, use only the seven available letters, and{' '}
            <strong>always contain the centre letter</strong> — as many times as you like. A word made only from the
            outer six letters doesn&apos;t count.
          </p>

          <h2>Why it matters for scoring</h2>
          <p>
            Because the centre letter is mandatory, it shapes which words — and which{' '}
            <Link href="/pangram">pangram</Link> — are possible. If the centre letter is a tricky one like H or V, expect
            a smaller word list and plan around it.
          </p>

          <h2>How to use it to find words</h2>
          <ul>
            <li>Pair the centre letter with each outer letter in turn and sound out word starts.</li>
            <li>Remember it can appear in the middle or end of a word, not just the start.</li>
            <li>Words can use it more than once (e.g. a centre letter of E in &quot;referee&quot;).</li>
          </ul>

          <p>
            New to the game? Read <Link href="/how-to-play">how to play Spelling Bee</Link> for the full rules, or jump
            straight into <Link href="/">today&apos;s puzzle</Link>.
          </p>
        </>
      );
    }
  },
  {
    slug: 'spelling-bee-vs-wordle',
    title: 'Spelling Bee vs Wordle: What’s the Difference?',
    description:
      'Spelling Bee vs Wordle: how the two word games differ, which is harder, and how to choose. A quick comparison plus a free Spelling Bee to play right now.',
    datePublished: '2026-06-21',
    dateModified: '2026-06-21',
    keywords: ['spelling bee vs wordle', 'wordle vs spelling bee', 'word games like wordle', 'difference between spelling bee and wordle'],
    related: ['spelling-bee-tips-and-tricks', 'spelling-bee-for-kids', 'best-words-for-spelling-bee'],
    excerpt:
      'Both are daily word games, but they test completely different skills. Here’s how Spelling Bee and Wordle compare.',
    faq: [
      {
        q: 'What is the difference between Spelling Bee and Wordle?',
        a: 'Wordle is about guessing one hidden five-letter word in six tries using colour clues. Spelling Bee is about making as many words as possible from seven letters, with no guess limit. Wordle tests deduction; Spelling Bee tests vocabulary and word-finding.'
      },
      {
        q: 'Which is harder, Spelling Bee or Wordle?',
        a: 'They’re hard in different ways. Wordle has one answer and a strict six-guess limit; Spelling Bee is open-ended, and reaching Queen Bee can take a long time.'
      }
    ],
    Body: function Body() {
      return (
        <>
          <p>
            Spelling Bee and Wordle are the two most popular daily word games, but they play very differently. If you love
            one, here&apos;s what to expect from the other — and where they overlap.
          </p>

          <h2>The core difference</h2>
          <p>
            <strong>Wordle</strong> gives you six guesses to find a single hidden five-letter word, using colour clues to
            narrow it down. <strong>Spelling Bee</strong> gives you seven letters and asks you to make as many words as
            you can — no guess limit, no hidden answer. Wordle rewards deduction; Spelling Bee rewards vocabulary.
          </p>

          <h2>Quick comparison</h2>
          <ul>
            <li><strong>Goal:</strong> Wordle — guess one word; Spelling Bee — find many words.</li>
            <li><strong>Letters:</strong> Wordle — any letters; Spelling Bee — a fixed set of seven.</li>
            <li><strong>Attempts:</strong> Wordle — six; Spelling Bee — unlimited.</li>
            <li><strong>Skill:</strong> Wordle — logic; Spelling Bee — word knowledge.</li>
            <li><strong>Session length:</strong> Wordle — a few minutes; Spelling Bee — as long as you like.</li>
          </ul>

          <h2>Which should you play?</h2>
          <p>
            Want a quick daily hit of deduction? Wordle. Want an open-ended vocabulary workout you can keep coming back to
            through the day? Spelling Bee. Many people play both.
          </p>

          <h2>Try a free Spelling Bee</h2>
          <p>
            If you&apos;re coming from Wordle and want to try the honeycomb format, our{' '}
            <Link href="/">free Spelling Bee</Link> has a new puzzle every day — no subscription. New to it? Start with{' '}
            <Link href="/how-to-play">how to play</Link>.
          </p>
        </>
      );
    }
  },
  {
    slug: 'how-many-words-in-a-spelling-bee',
    title: 'How Many Words Are in a Spelling Bee?',
    description:
      'How many words are in a Spelling Bee puzzle? It varies by day — here’s the typical range, why it changes, and how many you need to reach Queen Bee.',
    datePublished: '2026-06-21',
    dateModified: '2026-06-21',
    keywords: ['how many words in a spelling bee', 'average words spelling bee', 'how many words for queen bee', 'spelling bee word count'],
    related: ['spelling-bee-tips-and-tricks', 'best-words-for-spelling-bee', 'how-to-find-pangrams'],
    excerpt:
      'It depends on the seven letters of the day — but here’s the typical range and how many words you need to reach Queen Bee.',
    faq: [
      {
        q: 'How many words are in a Spelling Bee puzzle?',
        a: 'It varies with the seven letters of the day. Some puzzles have only 30–40 words, while richer letter sets can have 150 or more.'
      },
      {
        q: 'How many words do you need for Queen Bee?',
        a: 'Queen Bee is based on the total points available, not a fixed word count. You reach it by collecting nearly all of the points, including every pangram.'
      }
    ],
    Body: function Body() {
      return (
        <>
          <p>
            There&apos;s no single answer to &quot;how many words are in a Spelling Bee?&quot; — it changes every day,
            because it depends entirely on the seven letters in the puzzle.
          </p>

          <h2>Why the word count changes</h2>
          <p>
            Some letter sets are far more productive than others. A puzzle built around common letters with an S can have
            150+ valid words, while a set with a tricky centre letter might have only 30–40. Both can be great puzzles —
            the ranks scale to each one.
          </p>

          <h2>It&apos;s points, not word count, that matter</h2>
          <p>
            Your rank — from Worker Bee up to <Link href="/">Queen Bee</Link> — is based on the share of the total{' '}
            <em>points</em> you earn, not how many words you find. Because longer words and{' '}
            <Link href="/pangram">pangrams</Link> are worth more, two players with the same number of words can have very
            different ranks.
          </p>

          <h2>How many for Queen Bee?</h2>
          <p>
            To hit Queen Bee you need to collect (almost) all the available points, which means finding the long words and
            every pangram — not necessarily every single short word. See our{' '}
            <Link href="/blog/spelling-bee-tips-and-tricks">tips and tricks</Link> for the fastest way there.
          </p>

          <h2>See real word counts</h2>
          <p>
            Curious how big each day&apos;s puzzle is? The <Link href="/yesterday">archive</Link> shows the word count and
            maximum score for every past puzzle.
          </p>
        </>
      );
    }
  },
  {
    slug: 'spelling-bee-for-kids',
    title: 'Spelling Bee for Kids: A Free, Family-Friendly Word Game',
    description:
      'Is Spelling Bee good for kids? Yes — it builds spelling and vocabulary. Here are tips for younger players and a free, no-subscription game to play together.',
    datePublished: '2026-06-21',
    dateModified: '2026-06-21',
    keywords: ['spelling bee for kids', 'spelling bee for children', 'spelling games for kids', 'word games for kids'],
    related: ['what-is-the-centre-letter', 'spelling-bee-tips-and-tricks', 'spelling-bee-vs-wordle'],
    excerpt:
      'A gentle, screen-friendly way to build spelling and vocabulary — with tips for playing alongside younger kids.',
    faq: [
      {
        q: 'Is Spelling Bee good for kids?',
        a: 'Yes. Making words from seven letters builds spelling, vocabulary and pattern recognition. Younger children can play with an adult and aim for shorter words first.'
      },
      {
        q: 'What age is Spelling Bee suitable for?',
        a: 'Confident readers (roughly age 7 and up) can play on their own, while younger kids enjoy it as a team game with a parent.'
      }
    ],
    Body: function Body() {
      return (
        <>
          <p>
            Spelling Bee is a surprisingly good word game for kids: it&apos;s quick to learn, builds real spelling and
            vocabulary skills, and our version is <Link href="/">free with no subscription</Link>, so families can play
            together without a paywall.
          </p>

          <h2>What kids get out of it</h2>
          <ul>
            <li>Spelling practice that feels like a game, not homework.</li>
            <li>Vocabulary growth from spotting new words.</li>
            <li>Pattern recognition — seeing how letters combine.</li>
          </ul>

          <h2>Tips for younger players</h2>
          <ul>
            <li>Start with four-letter words to build confidence before chasing longer ones.</li>
            <li>Play as a team — take turns suggesting words.</li>
            <li>Use the shuffle button when you&apos;re stuck; new arrangements spark ideas.</li>
            <li>Make finding the <Link href="/pangram">pangram</Link> a fun shared goal.</li>
          </ul>

          <h2>A quick note for parents</h2>
          <p>
            Daily Bee is a general word game with a common-word dictionary rather than a graded school product, so for the
            youngest players it works best as a co-op activity. The rules are simple — here&apos;s{' '}
            <Link href="/how-to-play">how to play</Link>, and the all-important{' '}
            <Link href="/blog/what-is-the-centre-letter">centre letter</Link> rule.
          </p>

          <p>
            Ready? Try <Link href="/">today&apos;s free puzzle</Link> together.
          </p>
        </>
      );
    }
  },
  {
    slug: 'spelling-bee-answers',
    title: 'Spelling Bee Answers: Find Today’s and Past Answers',
    description:
      'Looking for Spelling Bee answers? Here’s how to reveal the full word list and pangrams for today’s puzzle and every past day in the Daily Bee archive.',
    datePublished: '2026-06-21',
    dateModified: '2026-06-21',
    keywords: ['spelling bee answers', 'spelling bee answers today', 'spelling bee word list answers', 'spelling bee solver'],
    related: ['how-to-find-pangrams', 'spelling-bee-tips-and-tricks', 'how-many-words-in-a-spelling-bee'],
    excerpt:
      'Stuck on a word? Here’s how to see the full answer list and pangrams for any Daily Bee puzzle — today’s or past.',
    faq: [
      {
        q: 'Where can I find the Spelling Bee answers?',
        a: 'Every Daily Bee puzzle has its own page in the archive that lists all valid words and pangrams behind a spoiler. Open the archive and choose a date.'
      },
      {
        q: 'Do you post NYT Spelling Bee answers?',
        a: 'No. Daily Bee is an independent game with its own daily puzzles, so we publish our own answers — not the New York Times’.'
      }
    ],
    Body: function Body() {
      return (
        <>
          <p>
            Sometimes you just want to check the answers — to settle a word, learn a new one, or see the
            pangram you missed. Here&apos;s how to find the full answer list for any{' '}
            <Link href="/">Daily Bee</Link> puzzle.
          </p>

          <h2>Today&apos;s answers</h2>
          <p>
            Each day&apos;s puzzle gets its own page once it&apos;s published, listing every valid word and the
            pangram(s). The words sit behind a &quot;show answers&quot; spoiler so you won&apos;t see them by
            accident — open it only when you&apos;re ready.
          </p>

          <h2>Past answers and the archive</h2>
          <p>
            Browse the <Link href="/yesterday">archive</Link> to find yesterday&apos;s puzzle and every earlier
            day. Pick a date to open that puzzle&apos;s page, see its letters and stats, and reveal the answers.
          </p>

          <h2>Try before you reveal</h2>
          <p>
            You&apos;ll improve fastest by hunting words yourself first — especially the{' '}
            <Link href="/pangram">pangram</Link>. Our <Link href="/blog/spelling-bee-tips-and-tricks">tips and
            tricks</Link> and <Link href="/blog/how-to-find-pangrams">pangram guide</Link> will help you need the
            answer key less often.
          </p>

          <h2>A note on NYT answers</h2>
          <p>
            Daily Bee is independent and not affiliated with The New York Times, so we don&apos;t publish their
            answers — only our own free daily puzzles, which you can play and check any time.
          </p>
        </>
      );
    }
  },
  {
    slug: 'spelling-bee-ranks',
    title: 'Spelling Bee Ranks Explained: Worker Bee to Queen Bee',
    description:
      'What are the Spelling Bee ranks and how do you level up? Here’s how each rank works — from Worker Bee to Queen Bee — and how to reach the top.',
    datePublished: '2026-06-21',
    dateModified: '2026-06-21',
    keywords: ['spelling bee ranks', 'spelling bee levels', 'how to get queen bee', 'spelling bee genius'],
    related: ['spelling-bee-tips-and-tricks', 'how-many-words-in-a-spelling-bee', 'best-words-for-spelling-bee'],
    excerpt:
      'From Worker Bee to Queen Bee — here’s what each rank means and how the percentages work.',
    faq: [
      {
        q: 'What are the Spelling Bee ranks?',
        a: 'In Daily Bee the ranks run from Worker Bee up through Busy Bee, Honey Maker, Hive Scout, Royal Guard, Nectar Master, Hive Elder and finally Queen Bee.'
      },
      {
        q: 'How do you reach Queen Bee?',
        a: 'Ranks are based on the percentage of the puzzle’s total points you earn, so reaching Queen Bee means collecting nearly all the points, including the pangram(s).'
      }
    ],
    Body: function Body() {
      return (
        <>
          <p>
            As you find words in <Link href="/">Daily Bee</Link>, you climb a ladder of bee-themed ranks. The
            clever part: ranks are based on the <strong>percentage of the puzzle&apos;s total points</strong> you
            collect — not a fixed score — so every puzzle is fair, whether it&apos;s a small one or a big one.
          </p>

          <h2>The ranks, in order</h2>
          <ul>
            <li><strong>Worker Bee</strong> — the starting rank</li>
            <li><strong>Busy Bee</strong> — about 5% of the points</li>
            <li><strong>Honey Maker</strong> — about 10%</li>
            <li><strong>Hive Scout</strong> — about 20%</li>
            <li><strong>Royal Guard</strong> — about 30%</li>
            <li><strong>Nectar Master</strong> — about 45%</li>
            <li><strong>Hive Elder</strong> — about 70%</li>
            <li><strong>Queen Bee</strong> — 100% of the points</li>
          </ul>

          <h2>Why it&apos;s percentages, not word count</h2>
          <p>
            Because longer words and <Link href="/pangram">pangrams</Link> are worth more, your rank reflects
            points, not how many words you found. See{' '}
            <Link href="/blog/how-many-words-in-a-spelling-bee">how many words are in a puzzle</Link> for more on
            that.
          </p>

          <h2>How to reach Queen Bee</h2>
          <p>
            Sweep the short words, then deliberately hunt the long ones and every pangram — that&apos;s where the
            points hide. Our <Link href="/blog/spelling-bee-tips-and-tricks">tips and tricks</Link> walk through
            the fastest route to the top.
          </p>
        </>
      );
    }
  },
  {
    slug: 'best-free-word-games',
    title: 'Best Free Word Games to Play Online (No Subscription)',
    description:
      'The best free word games you can play online right now — from spelling bee and Wordle-style guessing to word search — with no subscription required.',
    datePublished: '2026-06-21',
    dateModified: '2026-06-21',
    keywords: ['free word games', 'word games online free', 'best free word games', 'word games to play online'],
    related: ['spelling-bee-vs-wordle', 'best-words-for-spelling-bee', 'spelling-bee-for-kids'],
    excerpt:
      'A roundup of genuinely free word games — including our daily Spelling Bee — across guessing, spelling and searching.',
    faq: [
      {
        q: 'What is the best free word game?',
        a: 'It depends what you enjoy: a spelling bee for open-ended word-finding, Wordle-style games for daily deduction, or word search for relaxed play. Daily Bee is a free, no-subscription spelling bee with a new puzzle every day.'
      },
      {
        q: 'Are these word games really free?',
        a: 'Yes — the games highlighted here can be played free in a browser. Daily Bee in particular has no paywall and no subscription.'
      }
    ],
    Body: function Body() {
      return (
        <>
          <p>
            There are more free word games online than ever — but the genuinely good, no-paywall ones are worth
            bookmarking. Here are the main types and what each is best for.
          </p>

          <h2>1. Spelling bee (honeycomb) games</h2>
          <p>
            Make as many words as you can from seven letters. Open-ended and moreish — great for chipping away at
            through the day. Our <Link href="/">free Spelling Bee</Link> gives you a new puzzle daily with no
            subscription; if you&apos;re new, start with <Link href="/how-to-play">how to play</Link>.
          </p>

          <h2>2. Wordle-style guessing games</h2>
          <p>
            Guess a hidden word in a set number of tries using colour clues. Quick, daily, and great for logic.
            See how it compares in <Link href="/blog/spelling-bee-vs-wordle">Spelling Bee vs Wordle</Link>.
          </p>

          <h2>3. Word search</h2>
          <p>
            Find hidden words in a grid of letters — relaxing and low-pressure, good for unwinding.
          </p>

          <h2>4. Anagrams and word scrambles</h2>
          <p>
            Rearrange jumbled letters into words. A nice middle ground between guessing and spelling.
          </p>

          <h2>Which should you play?</h2>
          <p>
            For an open-ended vocabulary workout you can return to all day, a spelling bee is hard to beat. Try{' '}
            <Link href="/">today&apos;s free puzzle</Link> — no sign-up needed.
          </p>
        </>
      );
    }
  },
  {
    slug: 'four-letter-words-spelling-bee',
    title: 'Four-Letter Words in Spelling Bee: Quick Points & Strategy',
    description:
      'Four-letter words are the easiest points in Spelling Bee. Here’s how they score, when to play them, and how to find them fast.',
    datePublished: '2026-06-21',
    dateModified: '2026-06-21',
    keywords: ['four letter words spelling bee', '4 letter words spelling bee', 'spelling bee short words'],
    related: ['best-words-for-spelling-bee', 'spelling-bee-tips-and-tricks', 'how-many-words-in-a-spelling-bee'],
    excerpt:
      'Four-letter words score just one point each — but they add up. Here’s how to use them without wasting time.',
    faq: [
      {
        q: 'How many points is a four-letter word worth in Spelling Bee?',
        a: 'One point. Words of five or more letters score one point per letter, and a pangram adds a 7-point bonus.'
      },
      {
        q: 'Do four-letter words count in Spelling Bee?',
        a: 'Yes — four letters is the minimum word length, and every word must include the centre letter.'
      }
    ],
    Body: function Body() {
      return (
        <>
          <p>
            Four-letter words are the foundation of every <Link href="/">Spelling Bee</Link> score. They&apos;re
            the easiest to find and they get you on the board fast — but knowing how they score helps you spend
            your time wisely.
          </p>

          <h2>How four-letter words score</h2>
          <p>
            A four-letter word is worth <strong>1 point</strong>. Every longer word scores one point per letter,
            so a seven-letter word is worth 7 — and a <Link href="/pangram">pangram</Link> adds another 7 on top.
            That&apos;s why short words are a warm-up, not the goal.
          </p>

          <h2>Use them to warm up</h2>
          <p>
            Sweeping the easy four-letter words early builds momentum and reveals letter patterns you can extend
            into longer words. Remember every word must include the{' '}
            <Link href="/blog/what-is-the-centre-letter">centre letter</Link>.
          </p>

          <h2>Then go long</h2>
          <p>
            Once the short words are in, switch to hunting length and the pangram — that&apos;s where{' '}
            <Link href="/blog/spelling-bee-ranks">ranks</Link> are won. See our{' '}
            <Link href="/blog/best-words-for-spelling-bee">best words guide</Link> for the high-scoring patterns.
          </p>
        </>
      );
    }
  }
];

export function getPost(slug: string): BlogPost | undefined {
  return posts.find((post) => post.slug === slug);
}

/**
 * Related posts for the article footer: curated `related` slugs first, then
 * other posts as a fallback, always excluding the current one.
 */
export function getRelatedPosts(slug: string, limit = 3): BlogPost[] {
  const current = getPost(slug);
  const curated = (current?.related ?? [])
    .map((s) => getPost(s))
    .filter((p): p is BlogPost => p !== undefined && p.slug !== slug);

  const fallback = posts.filter((p) => p.slug !== slug && !curated.some((c) => c.slug === p.slug));

  return [...curated, ...fallback].slice(0, limit);
}
