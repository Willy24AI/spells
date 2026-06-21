import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteFooter } from '@/components/seo/SiteFooter';
import { LandingHeader, PlayCta } from '@/components/seo/LandingHeader';
import { SITE_NAME, absoluteUrl } from '@/lib/seo/site';

export const metadata: Metadata = {
  title: 'About',
  description: `About ${SITE_NAME} — a free, independent Spelling Bee word game with a new puzzle every day and no subscription.`,
  alternates: { canonical: '/about' },
  openGraph: { title: `About ${SITE_NAME}`, url: absoluteUrl('/about') }
};

export default function AboutPage() {
  return (
    <>
      <LandingHeader />
      <main className="max-w-3xl mx-auto px-4 py-12">
        <article className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-a:text-yellow-700">
          <h1>About {SITE_NAME}</h1>
          <p>
            {SITE_NAME} is a free Spelling Bee word game you can play online every day. Each puzzle gives you
            seven letters arranged in a honeycomb; your goal is to make as many words as you can, find the
            pangram, and climb the ranks from Worker Bee to Queen Bee.
          </p>

          <h2>Our mission</h2>
          <p>
            We built {SITE_NAME} to be a genuinely free, no-nonsense word game: a fresh puzzle every day, no
            subscription, and no paywall. Just open the page and play.
          </p>

          <h2>How it works</h2>
          <p>
            A new seven-letter puzzle is generated daily from a curated list of common English words, so the
            answers feel fair rather than obscure. Want the rules? See{' '}
            <Link href="/how-to-play">how to play</Link>, learn what a{' '}
            <Link href="/pangram">pangram</Link> is, or browse past puzzles in the{' '}
            <Link href="/yesterday">archive</Link>.
          </p>

          <h2>Independent &amp; not affiliated with the NYT</h2>
          <p>
            {SITE_NAME} is an independent project and is not affiliated with, endorsed by, or connected to The
            New York Times. We use the term &quot;Spelling Bee&quot; only to describe the well-known word-game
            format.
          </p>

          <h2>How we keep it free</h2>
          <p>
            The game is supported by ads. You can read how we handle data and cookies in our{' '}
            <Link href="/privacy">Privacy Policy</Link>, and the rules of use in our{' '}
            <Link href="/terms">Terms of Service</Link>. Questions or feedback? Head to our{' '}
            <Link href="/contact">contact page</Link>.
          </p>

          <p>
            <PlayCta>Play today&apos;s puzzle</PlayCta>
          </p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
