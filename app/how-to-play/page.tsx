import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import { SiteFooter } from '@/components/seo/SiteFooter';
import { LandingHeader, PlayCta } from '@/components/seo/LandingHeader';
import { absoluteUrl } from '@/lib/seo/site';

const TITLE = 'How to Play Spelling Bee — Rules, Scoring & Tips';
const DESCRIPTION =
  'Learn how to play Spelling Bee: the rules, how scoring works, what a pangram is, and tips to reach Queen Bee. A simple guide to the honeycomb word game.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/how-to-play' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: absoluteUrl('/how-to-play') }
};

const faq = [
  {
    q: 'What are the rules of Spelling Bee?',
    a: 'Make words of four or more letters using only the seven letters shown. Every word must contain the centre letter, and you can reuse letters as often as you like.'
  },
  {
    q: 'How does scoring work?',
    a: 'Four-letter words are worth 1 point. Longer words score one point per letter. A pangram — a word that uses all seven letters — earns an extra 7 points.'
  },
  {
    q: 'What is a pangram?',
    a: 'A pangram is a word that uses every one of the seven available letters at least once. Each puzzle has at least one, and finding it gives a big score boost.'
  },
  {
    q: 'How do I reach Queen Bee?',
    a: 'Ranks are based on the share of the total available points you earn, from Worker Bee up to Queen Bee. Find the long words and the pangram to climb fastest.'
  }
];

export default function HowToPlayPage() {
  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to play Spelling Bee',
    description: DESCRIPTION,
    step: [
      { '@type': 'HowToStep', name: 'Use the seven letters', text: 'Form words from the seven letters in the honeycomb. Letters may be reused.' },
      { '@type': 'HowToStep', name: 'Include the centre letter', text: 'Every valid word must contain the centre letter.' },
      { '@type': 'HowToStep', name: 'Make four-letter-plus words', text: 'Words must be at least four letters long.' },
      { '@type': 'HowToStep', name: 'Find the pangram', text: 'Spot the word that uses all seven letters for a 7-point bonus.' }
    ]
  };
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a }
    }))
  };

  return (
    <>
      <JsonLd data={howToSchema} />
      <JsonLd data={faqSchema} />
      <LandingHeader />

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">How to Play Spelling Bee</h1>
        <p className="mt-4 text-lg text-gray-700">
          Spelling Bee is a honeycomb word game with seven letters. The goal is simple: make as many
          words as you can. Here are the full rules, the scoring, and a few tips to reach Queen Bee.
        </p>

        <h2 className="mt-10 text-2xl font-semibold text-gray-900">The rules</h2>
        <ol className="mt-4 space-y-2 text-gray-700 list-decimal list-inside">
          <li>Words must be at least four letters long.</li>
          <li>Every word must include the centre letter.</li>
          <li>You may reuse letters as many times as you like.</li>
          <li>Only the seven shown letters are allowed.</li>
          <li>Each puzzle has at least one pangram using all seven letters.</li>
        </ol>

        <h2 className="mt-10 text-2xl font-semibold text-gray-900">Scoring</h2>
        <ul className="mt-4 space-y-2 text-gray-700 list-disc list-inside">
          <li>Four-letter word: 1 point.</li>
          <li>Longer word: one point per letter (a 6-letter word scores 6).</li>
          <li>Pangram: +7 bonus points on top.</li>
        </ul>

        <h2 className="mt-10 text-2xl font-semibold text-gray-900">Tips to reach Queen Bee</h2>
        <ul className="mt-4 space-y-2 text-gray-700 list-disc list-inside">
          <li>Hunt for the pangram early — it&apos;s the biggest single score.</li>
          <li>Try common suffixes like -ing, -ed, -er and -tion.</li>
          <li>Shuffle the outer letters to see new combinations.</li>
          <li>Look for longer words; they&apos;re worth far more than four-letter ones.</li>
        </ul>

        <div className="mt-10">
          <PlayCta>Try today&apos;s puzzle</PlayCta>
        </div>

        <h2 className="mt-12 text-2xl font-semibold text-gray-900">Frequently asked questions</h2>
        <div className="mt-4 space-y-6">
          {faq.map((f) => (
            <div key={f.q}>
              <h3 className="font-semibold text-gray-900">{f.q}</h3>
              <p className="mt-1 text-gray-700">{f.a}</p>
            </div>
          ))}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
