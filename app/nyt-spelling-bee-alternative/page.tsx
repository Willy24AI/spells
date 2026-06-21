import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import { SiteFooter } from '@/components/seo/SiteFooter';
import { LandingHeader, PlayCta } from '@/components/seo/LandingHeader';
import { SITE_NAME, absoluteUrl } from '@/lib/seo/site';

const TITLE = 'Free NYT Spelling Bee Alternative — Games Like Spelling Bee';
const DESCRIPTION =
  'A free alternative to the NYT Spelling Bee. Play the same honeycomb word game online with no subscription — one of the best games like Spelling Bee, with a new puzzle every day.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/nyt-spelling-bee-alternative' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: absoluteUrl('/nyt-spelling-bee-alternative') }
};

const faq = [
  {
    q: 'Is this the same as the NYT Spelling Bee?',
    a: `${SITE_NAME} is an independent game inspired by the classic honeycomb format. It isn’t affiliated with The New York Times, but it plays the same way — seven letters, a centre letter, four-letter minimum, and pangrams.`
  },
  {
    q: 'What makes it a good alternative?',
    a: 'It’s completely free with no subscription, there’s a new puzzle every day, and you can play instantly in any browser with no app to download.'
  },
  {
    q: 'Are there other games like Spelling Bee here?',
    a: 'Daily Bee focuses on doing the honeycomb word game really well — a fresh daily puzzle, fair scoring, and ranks from Worker Bee to Queen Bee.'
  }
];

export default function AlternativePage() {
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
      { '@type': 'ListItem', position: 2, name: 'NYT Spelling Bee Alternative', item: absoluteUrl('/nyt-spelling-bee-alternative') }
    ]
  };

  return (
    <>
      <JsonLd data={faqSchema} />
      <JsonLd data={breadcrumb} />
      <LandingHeader />

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
          A Free NYT Spelling Bee Alternative
        </h1>
        <p className="mt-4 text-lg text-gray-700">
          Love the New York Times Spelling Bee but not the subscription? {SITE_NAME} is a free
          alternative that plays exactly the way you expect — seven letters in a honeycomb, a required
          centre letter, four-letter-minimum words, and a pangram to hunt for in every puzzle. It&apos;s
          one of the simplest ways to enjoy a game like Spelling Bee online, free, every day.
        </p>

        <div className="mt-8">
          <PlayCta>Play the free alternative</PlayCta>
        </div>

        <h2 className="mt-12 text-2xl font-semibold text-gray-900">How it compares</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 font-semibold">Feature</th>
                <th className="p-3 font-semibold">{SITE_NAME}</th>
                <th className="p-3 font-semibold">NYT Spelling Bee</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-200">
                <td className="p-3">Price</td>
                <td className="p-3">Free, no paywall</td>
                <td className="p-3">Subscription for full game</td>
              </tr>
              <tr className="border-t border-gray-200">
                <td className="p-3">New puzzle</td>
                <td className="p-3">Every day</td>
                <td className="p-3">Every day</td>
              </tr>
              <tr className="border-t border-gray-200">
                <td className="p-3">Account required</td>
                <td className="p-3">No</td>
                <td className="p-3">Yes for full access</td>
              </tr>
              <tr className="border-t border-gray-200">
                <td className="p-3">Ranks</td>
                <td className="p-3">Worker Bee → Queen Bee</td>
                <td className="p-3">Beginner → Queen Bee</td>
              </tr>
            </tbody>
          </table>
        </div>

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
