import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import { SiteFooter } from '@/components/seo/SiteFooter';
import { LandingHeader, PlayCta } from '@/components/seo/LandingHeader';
import { absoluteUrl } from '@/lib/seo/site';

const TITLE = 'What Is a Pangram? Pangram Game & Examples';
const DESCRIPTION =
  'What is a pangram in a spelling bee? Learn the meaning, see examples, and play a free pangram game where every daily puzzle hides at least one pangram worth bonus points.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/pangram' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: absoluteUrl('/pangram') }
};

const faq = [
  {
    q: 'What is a pangram in Spelling Bee?',
    a: 'In a spelling bee, a pangram is a word that uses all seven of the puzzle’s letters at least once. Every daily puzzle contains at least one.'
  },
  {
    q: 'How many points is a pangram worth?',
    a: 'A pangram scores one point per letter like any word, plus a 7-point bonus — making it the most valuable find in the puzzle.'
  },
  {
    q: 'What is the difference between a pangram and a perfect pangram?',
    a: 'A pangram uses all seven letters at least once. A perfect pangram uses each of the seven letters exactly once with no repeats.'
  }
];

export default function PangramPage() {
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
      { '@type': 'ListItem', position: 2, name: 'Pangram', item: absoluteUrl('/pangram') }
    ]
  };

  return (
    <>
      <JsonLd data={faqSchema} />
      <JsonLd data={breadcrumb} />
      <LandingHeader />

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">What Is a Pangram?</h1>
        <p className="mt-4 text-lg text-gray-700">
          A <strong>pangram</strong> is a word that uses all seven letters of a spelling bee puzzle at
          least once. In our free pangram game, every daily puzzle hides at least one — and finding it
          is the fastest way to boost your score.
        </p>

        <h2 className="mt-10 text-2xl font-semibold text-gray-900">Pangram examples</h2>
        <p className="mt-4 text-gray-700">
          With the letters <em>A, C, I, N, O, T, V</em>, the word <strong>VACATION</strong> is a pangram
          because it contains all seven letters. A <em>perfect pangram</em> uses each letter exactly once,
          with no repeats — these are rare and especially satisfying to find.
        </p>

        <h2 className="mt-10 text-2xl font-semibold text-gray-900">Why pangrams matter</h2>
        <p className="mt-4 text-gray-700">
          Beyond the normal one-point-per-letter score, every pangram earns a <strong>+7 bonus</strong>.
          Spotting it early can be the difference between Hive Elder and Queen Bee.
        </p>

        <div className="mt-10">
          <PlayCta>Find today&apos;s pangram</PlayCta>
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
