import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/seo/JsonLd';
import { SiteFooter } from '@/components/seo/SiteFooter';
import { LandingHeader, PlayCta } from '@/components/seo/LandingHeader';
import { getRecentPuzzleDates, formatPuzzleDate } from '@/lib/seo/puzzles';
import { absoluteUrl, SITE_NAME } from '@/lib/seo/site';

export const revalidate = 3600;

const TITLE = 'Spelling Bee Archive — Yesterday’s Puzzle & Past Answers';
const DESCRIPTION =
  'Browse the Spelling Bee archive: play yesterday’s puzzle and find answers and pangrams for every past daily puzzle. Free, no subscription.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/yesterday' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: absoluteUrl('/yesterday') }
};

export default async function ArchivePage() {
  const dates = await getRecentPuzzleDates(90);
  // The first entry is today; "yesterday" is the second if present.
  const [, yesterday] = dates;

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'Archive', item: absoluteUrl('/yesterday') }
    ]
  };

  return (
    <>
      <JsonLd data={breadcrumb} />
      <LandingHeader />

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Spelling Bee Archive</h1>
        <p className="mt-4 text-lg text-gray-700">
          Missed a day? Browse the {SITE_NAME} archive to replay past puzzles and check the answers and
          pangrams for any previous Spelling Bee — all free, with no subscription.
        </p>

        {yesterday && (
          <div className="mt-8 rounded-lg bg-yellow-50 border border-yellow-200 p-5">
            <h2 className="text-xl font-semibold text-gray-900">Yesterday&apos;s Spelling Bee</h2>
            <p className="mt-1 text-gray-700">{formatPuzzleDate(yesterday)}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href={`/puzzle/${yesterday}`}
                className="rounded-full bg-gray-900 text-white text-sm font-semibold px-4 py-2 hover:bg-gray-700 transition-colors"
              >
                View yesterday&apos;s answers
              </Link>
              <PlayCta>Play today&apos;s puzzle</PlayCta>
            </div>
          </div>
        )}

        <h2 className="mt-12 text-2xl font-semibold text-gray-900">Past puzzles</h2>
        {dates.length === 0 ? (
          <p className="mt-4 text-gray-600">The archive will fill up as new daily puzzles are published.</p>
        ) : (
          <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
            {dates.map((d) => (
              <li key={d}>
                <Link href={`/puzzle/${d}`} className="text-gray-700 hover:text-yellow-700 transition-colors">
                  {formatPuzzleDate(d)}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>

      <SiteFooter />
    </>
  );
}
