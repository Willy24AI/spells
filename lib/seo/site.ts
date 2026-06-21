// Central SEO/site configuration.
// Set NEXT_PUBLIC_SITE_URL in your environment (and on Vercel) to your real
// domain, e.g. https://dailybee.com. Everything (canonical URLs, sitemap,
// robots, OpenGraph) reads from here.

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com'
).replace(/\/$/, '');

export const SITE_NAME = 'Daily Bee';

export const SITE_TAGLINE = 'Free Spelling Bee — Play Online, No Subscription';

export const SITE_DESCRIPTION =
  'Play a free Spelling Bee word game online — a new seven-letter honeycomb puzzle every day. No subscription, no paywall. Make as many words as you can and climb from Worker Bee to Queen Bee.';

/** Absolute URL helper for canonicals, sitemap and OG tags. */
export function absoluteUrl(path = ''): string {
  if (!path) return SITE_URL;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
