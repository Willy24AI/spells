import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteFooter } from '@/components/seo/SiteFooter';
import { LandingHeader } from '@/components/seo/LandingHeader';
import { SITE_NAME, absoluteUrl } from '@/lib/seo/site';

const LAST_UPDATED = 'June 21, 2026';
const CONTACT_EMAIL = 'privacy@spellbee.pro';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `How ${SITE_NAME} handles data, cookies, analytics and advertising. Our privacy policy explains what we collect and your choices.`,
  alternates: { canonical: '/privacy' }
};

export default function PrivacyPage() {
  return (
    <>
      <LandingHeader />
      <main className="max-w-3xl mx-auto px-4 py-12">
        <article className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-a:text-yellow-700">
          <h1>Privacy Policy</h1>
          <p className="text-sm text-gray-500">Last updated: {LAST_UPDATED}</p>

          <p>
            This Privacy Policy explains how {SITE_NAME} (&quot;we&quot;, &quot;us&quot;), available at
            spellbee.pro, collects, uses and protects information when you use our free Spelling Bee word
            game. {SITE_NAME} is an independent game and is not affiliated with The New York Times.
          </p>

          <h2>Information we collect</h2>
          <ul>
            <li>
              <strong>Game data stored on your device.</strong> Your settings, current progress and cookie
              choice are stored locally in your browser (localStorage). This stays on your device.
            </li>
            <li>
              <strong>Account information (optional).</strong> If you choose to sign in, our authentication
              provider stores your email address and a user ID so we can save your scores and stats.
            </li>
            <li>
              <strong>Gameplay stats.</strong> If you are signed in, we store your daily score and words
              found, linked to your account, to power rankings and statistics.
            </li>
            <li>
              <strong>Usage and device data.</strong> Through analytics and advertising providers we may
              receive standard technical data such as approximate location, device/browser type, pages
              visited and interactions. This is subject to your cookie choice (see below).
            </li>
          </ul>

          <h2>Cookies and similar technologies</h2>
          <p>
            We use a cookie/consent banner to ask permission before enabling non-essential cookies. By
            default, analytics and advertising storage are <strong>denied</strong> until you accept (Google
            Consent Mode). You can change your choice at any time by clearing your browser storage for this
            site.
          </p>
          <ul>
            <li><strong>Essential:</strong> remembering your settings and your cookie choice.</li>
            <li><strong>Analytics:</strong> Google Analytics, to understand how the game is used.</li>
            <li><strong>Advertising:</strong> Google AdSense, to display and measure ads.</li>
          </ul>

          <h2>Third-party services we use</h2>
          <ul>
            <li>
              <strong>Google Analytics</strong> (Google LLC) — measures site usage. See{' '}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google&apos;s Privacy Policy</a>.
            </li>
            <li>
              <strong>Google AdSense</strong> (Google LLC) — serves ads. Google and its partners may use
              cookies to serve ads based on prior visits. You can control ad personalization in your{' '}
              <a href="https://myadcenter.google.com/" target="_blank" rel="noopener noreferrer">Google Ad Center</a>{' '}
              and learn more on Google&apos;s{' '}
              <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">partner sites</a> page.
            </li>
            <li>
              <strong>Supabase</strong> — hosts our database and authentication. If you create an account,
              your email and gameplay stats are stored on Supabase infrastructure on our behalf.
            </li>
            <li>
              <strong>Vercel</strong> — hosts and serves the website.
            </li>
          </ul>

          <h2>How we use information</h2>
          <ul>
            <li>To run the game and save your progress and stats.</li>
            <li>To understand and improve how the game is used.</li>
            <li>To display ads that help keep the game free.</li>
            <li>To keep the service secure and prevent abuse.</li>
          </ul>

          <h2>Legal bases</h2>
          <p>
            Where the GDPR/UK GDPR applies, we rely on your <strong>consent</strong> for analytics and
            advertising cookies, on <strong>legitimate interests</strong> for keeping the service secure, and
            on performing our service to you for account-related processing.
          </p>

          <h2>Data retention</h2>
          <p>
            Account and gameplay data is kept while your account is active. Analytics and advertising data is
            retained according to the providers&apos; policies. You can request deletion of your account data
            (see Your rights).
          </p>

          <h2>Your rights</h2>
          <p>
            Depending on your location you may have the right to access, correct, delete or export your
            personal data, and to withdraw consent. To make a request, contact us at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>

          <h2>Children</h2>
          <p>
            {SITE_NAME} is a general-audience game and is not directed to children under 13 (or the relevant
            age in your country). We do not knowingly collect personal information from children. If you
            believe a child has provided us personal data, contact us and we will remove it.
          </p>

          <h2>Changes to this policy</h2>
          <p>
            We may update this policy from time to time. We will revise the &quot;Last updated&quot; date above
            when we do.
          </p>

          <h2>Contact</h2>
          <p>
            Questions about this policy? Email{' '}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. See also our{' '}
            <Link href="/terms">Terms of Service</Link>.
          </p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
