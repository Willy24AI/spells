import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/seo/JsonLd';
import { SiteFooter } from '@/components/seo/SiteFooter';
import { LandingHeader, PlayCta } from '@/components/seo/LandingHeader';
import { getPuzzleByDate, formatPuzzleDate, isValidDateParam } from '@/lib/seo/puzzles';
import { absoluteUrl, SITE_NAME } from '@/lib/seo/site';

// Rebuild dated pages occasionally so newly generated days appear.
export const revalidate = 3600;

interface Params {
  params: { date: string };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  if (!isValidDateParam(params.date)) return { title: 'Puzzle not found' };
  const puzzle = await getPuzzleByDate(params.date);
  if (!puzzle) return { title: 'Puzzle not found' };

  const pretty = formatPuzzleDate(params.date);
  const letters = [puzzle.center_letter, ...puzzle.outer_letters].join('').toUpperCase();
  const title = `Spelling Bee Answers — ${pretty}`;
  const description = `All ${puzzle.word_count} answers and ${puzzle.pangrams.length} pangram${puzzle.pangrams.length === 1 ? '' : 's'} for the ${pretty} Spelling Bee (letters ${letters}). Free, no subscription.`;

  return {
    title,
    description,
    alternates: { canonical: `/puzzle/${params.date}` },
    openGraph: { title, description, url: absoluteUrl(`/puzzle/${params.date}`) }
  };
}

export default async function PuzzleDatePage({ params }: Params) {
  if (!isValidDateParam(params.date)) notFound();
  const puzzle = await getPuzzleByDate(params.date);
  if (!puzzle) notFound();

  const pretty = formatPuzzleDate(params.date);
  const center = puzzle.center_letter.toUpperCase();
  const outer = puzzle.outer_letters.map((l) => l.toUpperCase());
  const words = [...puzzle.valid_words].map((w) => w.toLowerCase()).sort();
  const pangrams = new Set(puzzle.pangrams.map((p) => p.toLowerCase()));

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'Archive', item: absoluteUrl('/yesterday') },
      { '@type': 'ListItem', position: 3, name: pretty, item: absoluteUrl(`/puzzle/${params.date}`) }
    ]
  };

  return (
    <>
      <JsonLd data={breadcrumb} />
      <LandingHeader />

      <main className="max-w-3xl mx-auto px-4 py-12">
        <p className="text-sm text-gray-500">Spelling Bee archive</p>
        <h1 className="mt-1 text-3xl sm:text-4xl font-bold text-gray-900">
          Spelling Bee — {pretty}
        </h1>

        <p className="mt-4 text-lg text-gray-700">
          The {SITE_NAME} puzzle for {pretty} used the centre letter <strong>{center}</strong> with{' '}
          {outer.join(', ')}. There were <strong>{puzzle.word_count}</strong> words to find and{' '}
          <strong>{puzzle.pangrams.length}</strong> pangram{puzzle.pangrams.length === 1 ? '' : 's'},
          for a maximum score of <strong>{puzzle.max_score}</strong>.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {[center, ...outer].map((l, i) => (
            <span
              key={`${l}-${i}`}
              className={`flex h-12 w-12 items-center justify-center rounded-md text-xl font-bold ${
                i === 0 ? 'bg-yellow-400 text-gray-900' : 'bg-gray-100 text-gray-800'
              }`}
            >
              {l}
            </span>
          ))}
        </div>

        <div className="mt-8">
          <PlayCta>Play today&apos;s puzzle</PlayCta>
        </div>

        {pangrams.size > 0 && (
          <>
            <h2 className="mt-12 text-2xl font-semibold text-gray-900">Pangrams</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {[...pangrams].sort().map((w) => (
                <li key={w} className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-gray-800">
                  {w}
                </li>
              ))}
            </ul>
          </>
        )}

        <details className="mt-10 rounded-lg border border-gray-200 p-4">
          <summary className="cursor-pointer font-semibold text-gray-900">
            Show all {words.length} answers (spoiler)
          </summary>
          <ul className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1 text-gray-700">
            {words.map((w) => (
              <li key={w} className={pangrams.has(w) ? 'font-semibold text-yellow-700' : ''}>
                {w}
              </li>
            ))}
          </ul>
        </details>
      </main>

      <SiteFooter />
    </>
  );
}
