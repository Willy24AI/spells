import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/seo/JsonLd';
import { SiteFooter } from '@/components/seo/SiteFooter';
import { LandingHeader, PlayCta } from '@/components/seo/LandingHeader';
import { posts, getPost } from '@/lib/blog/posts';
import { SITE_NAME, absoluteUrl } from '@/lib/seo/site';

interface Params {
  params: { slug: string };
}

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }: Params): Metadata {
  const post = getPost(params.slug);
  if (!post) return { title: 'Article not found' };
  return {
    title: post.title,
    description: post.description,
    keywords: post.keywords,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      url: absoluteUrl(`/blog/${post.slug}`),
      publishedTime: post.datePublished,
      modifiedTime: post.dateModified
    }
  };
}

export default function BlogPostPage({ params }: Params) {
  const post = getPost(params.slug);
  if (!post) notFound();

  const Body = post.Body;

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.datePublished,
    dateModified: post.dateModified,
    author: { '@type': 'Organization', name: SITE_NAME },
    publisher: { '@type': 'Organization', name: SITE_NAME },
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`)
  };

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: absoluteUrl('/blog') },
      { '@type': 'ListItem', position: 3, name: post.title, item: absoluteUrl(`/blog/${post.slug}`) }
    ]
  };

  const faqSchema = post.faq && post.faq.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: post.faq.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a }
        }))
      }
    : null;

  return (
    <>
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumb} />
      {faqSchema && <JsonLd data={faqSchema} />}
      <LandingHeader />

      <main className="max-w-3xl mx-auto px-4 py-12">
        <article>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{post.title}</h1>
          <p className="mt-2 text-sm text-gray-500">
            Updated{' '}
            {new Date(`${post.dateModified}T00:00:00`).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>

          <div className="mt-6">
            <Body />
          </div>

          {post.faq && post.faq.length > 0 && (
            <section className="mt-12">
              <h2 className="text-2xl font-semibold text-gray-900">Frequently asked questions</h2>
              <div className="mt-4 space-y-6">
                {post.faq.map((f) => (
                  <div key={f.q}>
                    <h3 className="font-semibold text-gray-900">{f.q}</h3>
                    <p className="mt-1 text-gray-700">{f.a}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="mt-12">
            <PlayCta>Play the free Spelling Bee</PlayCta>
          </div>
        </article>
      </main>

      <SiteFooter />
    </>
  );
}
