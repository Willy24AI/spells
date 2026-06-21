import type { Metadata } from 'next';
import GameClient from '@/components/game/GameClient';
import { JsonLd } from '@/components/seo/JsonLd';
import { SiteFooter } from '@/components/seo/SiteFooter';
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION } from '@/lib/seo/site';

export const metadata: Metadata = {
  title: { absolute: 'Free Spelling Bee Game — Play Online, No Subscription' },
  description: SITE_DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Free Spelling Bee Game — Play Online',
    description: SITE_DESCRIPTION,
    url: SITE_URL
  }
};

const faq = [
  {
    q: 'Is this Spelling Bee game free?',
    a: 'Yes. Daily Bee is completely free to play online with no subscription and no paywall. A fresh seven-letter puzzle is published every day.'
  },
  {
    q: 'How do you play Spelling Bee?',
    a: 'Make as many words as you can (four letters or longer) using the seven letters in the honeycomb. Every word must include the centre letter, and letters can be reused. Each puzzle has at least one pangram that uses all seven letters.'
  },
  {
    q: 'How is the score calculated?',
    a: 'Four-letter words score 1 point. Longer words score one point per letter, and a pangram earns a 7-point bonus. Your rank rises from Worker Bee all the way to Queen Bee based on the share of the puzzle you solve.'
  },
  {
    q: 'Do I need an account?',
    a: 'No account is needed to play. Signing in simply lets you save your scores and track your stats over time.'
  }
];

export default function HomePage() {
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };

  const gameSchema = {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: `${SITE_NAME} — Spelling Bee`,
    url: SITE_URL,
    applicationCategory: 'GameApplication',
    genre: 'Word puzzle',
    operatingSystem: 'Web browser',
    description: SITE_DESCRIPTION,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
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
      <JsonLd data={websiteSchema} />
      <JsonLd data={gameSchema} />
      <JsonLd data={faqSchema} />

      {/* Interactive game (client island) */}
      <GameClient />

      {/* Server-rendered, crawlable content */}
      <main className="bg-white">
        <section className="max-w-3xl mx-auto px-4 py-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Free Spelling Bee Game — Play Online Every Day
          </h1>
          <p className="mt-4 text-lg text-gray-700">
            Daily Bee is a free Spelling Bee word game you can play online in your browser —
            no subscription and no paywall. Every day brings a brand-new seven-letter honeycomb
            puzzle: make as many words as you can, find the pangram, and climb from Worker Bee to Queen Bee.
          </p>

          <h2 className="mt-10 text-2xl font-semibold text-gray-900">How the daily puzzle works</h2>
          <ul className="mt-4 space-y-2 text-gray-700 list-disc list-inside">
            <li>Build words of four or more letters from the seven shown.</li>
            <li>Every word must use the centre letter; letters can be repeated.</li>
            <li>Each puzzle contains at least one pangram that uses all seven letters for a bonus.</li>
            <li>A new puzzle is released daily, and yesterday&apos;s puzzle is always one tap away.</li>
          </ul>

          <h2 className="mt-10 text-2xl font-semibold text-gray-900">Why players choose Daily Bee</h2>
          <p className="mt-4 text-gray-700">
            Looking for a <strong>free Spelling Bee</strong> you can play without a New York Times
            subscription? Daily Bee gives you the same addictive honeycomb word game, online and free,
            with a fresh puzzle every single day and ranks to chase.
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
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
