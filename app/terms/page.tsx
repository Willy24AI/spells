import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteFooter } from '@/components/seo/SiteFooter';
import { LandingHeader } from '@/components/seo/LandingHeader';
import { SITE_NAME } from '@/lib/seo/site';

const LAST_UPDATED = 'June 21, 2026';
const CONTACT_EMAIL = 'support@spellbee.pro';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: `The terms for using ${SITE_NAME}, a free online Spelling Bee word game.`,
  alternates: { canonical: '/terms' }
};

export default function TermsPage() {
  return (
    <>
      <LandingHeader />
      <main className="max-w-3xl mx-auto px-4 py-12">
        <article className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-a:text-yellow-700">
          <h1>Terms of Service</h1>
          <p className="text-sm text-gray-500">Last updated: {LAST_UPDATED}</p>

          <p>
            These Terms of Service (&quot;Terms&quot;) govern your use of {SITE_NAME} at spellbee.pro (the
            &quot;Service&quot;). By using the Service you agree to these Terms. If you do not agree, please do
            not use the Service.
          </p>

          <h2>The service</h2>
          <p>
            {SITE_NAME} is a free online word game that publishes a daily seven-letter puzzle. {SITE_NAME} is
            an independent product and is <strong>not affiliated with, endorsed by, or connected to The New
            York Times</strong> or its Spelling Bee. &quot;Spelling Bee&quot; is used descriptively to refer to
            the general word-game format.
          </p>

          <h2>Accounts</h2>
          <p>
            You can play without an account. If you create one, you are responsible for the activity under it
            and for keeping your login secure. You must provide accurate information and may not impersonate
            others.
          </p>

          <h2>Acceptable use</h2>
          <ul>
            <li>Don&apos;t misuse, disrupt, or attempt to gain unauthorised access to the Service.</li>
            <li>Don&apos;t scrape, copy, or redistribute the puzzles or content at scale without permission.</li>
            <li>Don&apos;t use the Service for any unlawful purpose.</li>
          </ul>

          <h2>Intellectual property</h2>
          <p>
            The Service, including its design, branding and original content, belongs to {SITE_NAME} and is
            protected by applicable laws. Individual dictionary words are not owned by anyone; our compilation,
            puzzles and presentation are.
          </p>

          <h2>Advertising and third parties</h2>
          <p>
            The Service may display ads and use third-party providers (such as Google AdSense, Google
            Analytics, Supabase and Vercel). Your use of those services and any data they collect is also
            governed by our <Link href="/privacy">Privacy Policy</Link> and the providers&apos; own terms.
          </p>

          <h2>Disclaimer</h2>
          <p>
            The Service is provided &quot;as is&quot; and &quot;as available&quot;, without warranties of any
            kind, whether express or implied. We do not warrant that the Service will be uninterrupted,
            error-free, or that puzzles or word lists will be complete or accurate.
          </p>

          <h2>Limitation of liability</h2>
          <p>
            To the maximum extent permitted by law, {SITE_NAME} will not be liable for any indirect,
            incidental, or consequential damages arising from your use of the Service.
          </p>

          <h2>Changes</h2>
          <p>
            We may update these Terms from time to time. Continued use of the Service after changes means you
            accept the updated Terms. We will revise the &quot;Last updated&quot; date when we do.
          </p>

          <h2>Contact</h2>
          <p>
            Questions about these Terms? Email{' '}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
