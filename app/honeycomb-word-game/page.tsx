import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import { SiteFooter } from '@/components/seo/SiteFooter';
import { LandingHeader, PlayCta } from '@/components/seo/LandingHeader';
import { SITE_NAME, absoluteUrl } from '@/lib/seo/site';

const TITLE = 'Honeycomb Word Game — Free Hexagon Spelling Game';
const DESCRIPTION =
  'Play a free honeycomb word game: a seven-letter hexagon spelling game where you build words from a bee-style honeycomb. New puzzle daily, no subscription.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/honeycomb-word-game' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: absoluteUrl('/honeycomb-word-game') }
};

const faq = [
  {
    q: 'What is the honeycomb word game?',
    a: `It’s a word game where seven letters are arranged in a honeycomb of hexagons. You make words using those letters, always including the centre one. ${SITE_NAME} is a free version with a new puzzle every day.`
  },
  {
    q: 'Is it the same as the bee or hexagon word game?',
    a: 'Yes — “honeycomb word game”, “hexagon word game” and “bee word game” all describe the same seven-letter spelling puzzle. Reach the top rank to become the Queen Bee.'
  },
  {
    q: 'How many letters are in each puzzle?',
    a: 'Seven: one central letter that every word must use, plus six surrounding letters. There’s always at least one pangram that uses all seven.'
  }
];

export default function HoneycombWordGamePage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a }
    }))
  };
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'Honeycomb Word Game', item: absoluteUrl('/honeycomb-word-game') }
    ]
  };

  return (
    <>
      <JsonLd data={faqSchema} />
      <JsonLd data={breadcrumb} />
      <LandingHeader />

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
          Honeycomb Word Game — Free Hexagon Spelling Game
        </h1>
        <p className="mt-4 text-lg text-gray-700">
          {SITE_NAME} is a free honeycomb word game: seven letters laid out in a bee-style hexagon grid,
          and your job is to spell as many words as you can. Whether you call it a honeycomb word game, a
          hexagon word game or simply the bee, it&apos;s the same satisfying daily puzzle — and it&apos;s
          completely free, with no subscription.
        </p>

        <div className="mt-8">
          <PlayCta>Play the honeycomb game</PlayCta>
        </div>

        <h2 className="mt-12 text-2xl font-semibold text-gray-900">How the honeycomb works</h2>
        <ul className="mt-4 space-y-2 text-gray-700 list-disc list-inside">
          <li>Seven letters sit in a honeycomb: one in the centre, six around it.</li>
          <li>Every word must use the centre hexagon&apos;s letter.</li>
          <li>Words are four letters or longer, and letters can repeat.</li>
          <li>Find the pangram — a word using all seven letters — for bonus points.</li>
        </ul>

        <h2 className="mt-10 text-2xl font-semibold text-gray-900">From Worker Bee to Queen Bee</h2>
        <p className="mt-4 text-gray-700">
          As you find words you climb the hive&apos;s ranks, all the way to Queen Bee. A new honeycomb is
          published every day, so there&apos;s always a fresh hexagon puzzle waiting.
        </p>

        <h2 className="mt-10 text-2xl font-semibold text-gray-900">Frequently asked questions</h2>
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
