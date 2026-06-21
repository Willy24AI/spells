import React from 'react';
import Link from 'next/link';

// Lightweight header for content/landing pages with a prominent Play CTA.
export function LandingHeader() {
  return (
    <header className="bg-yellow-400 shadow-md">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2 font-bold text-lg">
          <span className="text-2xl">🐝</span>
          <span>Daily Bee</span>
        </Link>
        <Link
          href="/"
          className="rounded-full bg-gray-900 text-white text-sm font-semibold px-4 py-2 hover:bg-gray-700 transition-colors"
        >
          Play free
        </Link>
      </div>
    </header>
  );
}

export function PlayCta({ children = 'Play the free Spelling Bee' }: { children?: React.ReactNode }) {
  return (
    <Link
      href="/"
      className="inline-block rounded-full bg-yellow-400 text-gray-900 font-semibold px-6 py-3 hover:bg-yellow-300 transition-colors"
    >
      {children}
    </Link>
  );
}
