import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import { SiteFooter } from '@/components/seo/SiteFooter';
import { LandingHeader, PlayCta } from '@/components/seo/LandingHeader';
import { SITE_NAME, absoluteUrl } from '@/lib/seo/site';

const TITLE = 'Spelling Bee Unlimited — Play Free Every Day';
const DESCRIPTION =
  'Spelling Bee Unlimited: play a free spelling bee online every day with no subscription and no paywall. Fresh seven-letter puzzle daily, plus yesterday’s puzzle whenever you want.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/unlimited' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: absoluteUrl('/unlimited') }
};

const faq = [
  {
    q: 'Is Spelling Bee really free here?',
    a: `Yes. ${SITE_NAME} is free to play with no subscription and no paywall. Unlike the New York Times Spelling Bee, you don’t need to pay to keep playing.`
  },
  {
    q: 'How often do new puzzles appear?',
    a: 'A brand-new puzzle is published every day, and yesterday’s puzzle is always available too, so you never run out of a fresh challenge.'
  },
  {
    q: 'Do I need to download anything?',
    a: 'No. It runs in your browser on phone, tablet or desktop — nothing to install.'
  }
];

export default function UnlimitedPage() {
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
      { '@type': 'ListItem', position: 2, name: 'Spelling Bee Unlimited', item: absoluteUrl('/unlimited') }
    ]
  };

  return (
    <>
      <JsonLd data={faqSchema} />
      <JsonLd data={breadcrumb} />
      <LandingHeader />

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
          Spelling Bee Unlimited — Free, Every Day
        </h1>
        <p className="mt-4 text-lg text-gray-700">
          Craving more Spelling Bee without hitting a paywall? {SITE_NAME} lets you play a
          free spelling bee online every day — no subscription, no limits on your play, and no
          New York Times account required. Open it on any device and start making words instantly.
        </p>

        <div className="mt-8">
          <PlayCta>Play Spelling Bee free</PlayCta>
        </div>

        <h2 className="mt-12 text-2xl font-semibold text-gray-900">No subscription, no paywall</h2>
        <p className="mt-4 text-gray-700">
          The New York Times Spelling Bee limits free players and locks the full game behind a
          subscription. {SITE_NAME} is different: the complete game is free, forever. Find every
          word, chase the pangram, and reach Queen Bee without paying a cent.
        </p>

        <h2 className="mt-10 text-2xl font-semibold text-gray-900">A fresh puzzle every day</h2>
        <p className="mt-4 text-gray-700">
          A new seven-letter honeycomb is generated daily, and yesterday&apos;s puzzle is always one
          tap away — so there&apos;s always something new to solve.
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
