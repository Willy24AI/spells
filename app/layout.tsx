import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { SITE_URL, SITE_NAME, SITE_TAGLINE, SITE_DESCRIPTION } from '@/lib/seo/site';
import { SiteScripts } from '@/components/analytics/SiteScripts';
import { CookieConsent } from '@/components/analytics/CookieConsent';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    'spelling bee',
    'spelling bee game',
    'spelling bee online',
    'free spelling bee',
    'spelling bee unlimited',
    'word game',
    'honeycomb word game',
    'pangram game'
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    url: SITE_URL,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION
  },
  themeColor: '#FBBF24',
  robots: { index: true, follow: true }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  return (
    <html lang="en">
      <head>
        {/* AdSense verification + ads loader. Rendered as a raw <script> in the
            server HTML <head> so Google's (non-JS) crawler can find it.
            next/script's afterInteractive strategy only emits a preload <link>,
            which the verification crawler ignores. */}
        {adsenseClient && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
            crossOrigin="anonymous"
          />
        )}
      </head>
      <body className={inter.className}>
        {children}
        <CookieConsent />
        <SiteScripts />
      </body>
    </html>
  );
}
