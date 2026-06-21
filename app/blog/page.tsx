import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/seo/JsonLd';
import { SiteFooter } from '@/components/seo/SiteFooter';
import { LandingHeader } from '@/components/seo/LandingHeader';
import { posts } from '@/lib/blog/posts';
import { SITE_NAME, absoluteUrl } from '@/lib/seo/site';

const TITLE = 'Spelling Bee Blog — Tips, Tricks & Guides';
const DESCRIPTION =
  'Guides for the Spelling Bee word game: tips and tricks to reach Queen Bee, how to find pangrams, and more.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/blog' },
  openGraph: { title: TITLE, description: DESCRIPTION, url: absoluteUrl('/blog') }
};

export default function BlogIndexPage() {
  const blogSchema = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `${SITE_NAME} Blog`,
    url: absoluteUrl('/blog'),
    blogPost: posts.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      url: absoluteUrl(`/blog/${post.slug}`),
      datePublished: post.datePublished,
      dateModified: post.dateModified
    }))
  };

  return (
    <>
      <JsonLd data={blogSchema} />
      <LandingHeader />

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Spelling Bee Blog</h1>
        <p className="mt-4 text-lg text-gray-700">
          Tips, tricks and guides to help you find more words, spot the pangram, and reach Queen Bee.
        </p>

        <div className="mt-10 space-y-8">
          {posts.map((post) => (
            <article key={post.slug} className="border-b border-gray-100 pb-8">
              <h2 className="text-2xl font-semibold text-gray-900">
                <Link href={`/blog/${post.slug}`} className="hover:text-yellow-700 transition-colors">
                  {post.title}
                </Link>
              </h2>
              <p className="mt-2 text-gray-700">{post.excerpt}</p>
              <Link
                href={`/blog/${post.slug}`}
                className="mt-3 inline-block text-sm font-semibold text-yellow-700 hover:underline"
              >
                Read the guide →
              </Link>
            </article>
          ))}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
