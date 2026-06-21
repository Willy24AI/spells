import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteFooter } from '@/components/seo/SiteFooter';
import { LandingHeader } from '@/components/seo/LandingHeader';
import { SITE_NAME, absoluteUrl } from '@/lib/seo/site';

const SUPPORT_EMAIL = 'support@spellbee.pro';
const PRIVACY_EMAIL = 'privacy@spellbee.pro';

export const metadata: Metadata = {
  title: 'Contact',
  description: `Get in touch with the ${SITE_NAME} team — feedback, bug reports, and privacy or business enquiries.`,
  alternates: { canonical: '/contact' },
  openGraph: { title: `Contact ${SITE_NAME}`, url: absoluteUrl('/contact') }
};

export default function ContactPage() {
  return (
    <>
      <LandingHeader />
      <main className="max-w-3xl mx-auto px-4 py-12">
        <article className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-a:text-yellow-700">
          <h1>Contact {SITE_NAME}</h1>
          <p>
            We&apos;d love to hear from you — whether it&apos;s feedback on a puzzle, a bug report, or a
            business enquiry. The best way to reach us is by email.
          </p>

          <h2>General &amp; feedback</h2>
          <p>
            For anything about the game, bugs, or suggestions:{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
          </p>

          <h2>Privacy requests</h2>
          <p>
            For privacy questions or data requests (access, deletion):{' '}
            <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>. See our{' '}
            <Link href="/privacy">Privacy Policy</Link> for details.
          </p>

          <h2>Response time</h2>
          <p>
            We&apos;re a small team and read every message. We aim to reply within a few business days.
          </p>

          <p>
            In the meantime, you can <Link href="/">play today&apos;s puzzle</Link>, learn{' '}
            <Link href="/how-to-play">how to play</Link>, or read more <Link href="/about">about us</Link>.
          </p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
