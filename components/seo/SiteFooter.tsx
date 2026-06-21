import React from 'react';
import Link from 'next/link';
import { SITE_NAME } from '@/lib/seo/site';

// Sitewide footer. Doubles as an internal-linking hub so search engines can
// discover and pass authority to every landing page.
const links: { href: string; label: string }[] = [
  { href: '/', label: 'Play Spelling Bee' },
  { href: '/unlimited', label: 'Spelling Bee Unlimited' },
  { href: '/nyt-spelling-bee-alternative', label: 'NYT Spelling Bee Alternative' },
  { href: '/honeycomb-word-game', label: 'Honeycomb Word Game' },
  { href: '/yesterday', label: 'Archive & Yesterday' },
  { href: '/blog', label: 'Blog' },
  { href: '/how-to-play', label: 'How to Play' },
  { href: '/pangram', label: 'What Is a Pangram?' }
];

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-3 justify-center text-sm text-gray-600">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-yellow-700 transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>
        <p className="mt-6 text-center text-xs text-gray-400">
          {SITE_NAME} is a free, independent word game and is not affiliated with The New York Times.
          <br />© {year} {SITE_NAME}. A new puzzle every day.
        </p>
      </div>
    </footer>
  );
}
