import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/seo/site';
import { getRecentPuzzleDates } from '@/lib/seo/puzzles';
import { posts } from '@/lib/blog/posts';

// Refresh the sitemap hourly so newly added pages/puzzles get picked up.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
    { path: '/', priority: 1.0, changeFrequency: 'daily' },
    { path: '/unlimited', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/nyt-spelling-bee-alternative', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/honeycomb-word-game', priority: 0.8, changeFrequency: 'weekly' },
    { path: '/yesterday', priority: 0.8, changeFrequency: 'daily' },
    { path: '/blog', priority: 0.7, changeFrequency: 'weekly' },
    { path: '/how-to-play', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/pangram', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/about', priority: 0.4, changeFrequency: 'yearly' },
    { path: '/contact', priority: 0.4, changeFrequency: 'yearly' },
    { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/terms', priority: 0.3, changeFrequency: 'yearly' }
  ];

  const entries: MetadataRoute.Sitemap = staticRoutes.map((r) => ({
    url: absoluteUrl(r.path),
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority
  }));

  // Blog posts
  for (const post of posts) {
    entries.push({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: new Date(`${post.dateModified}T00:00:00`),
      changeFrequency: 'monthly',
      priority: 0.6
    });
  }

  // Programmatic: one entry per past daily puzzle.
  try {
    const dates = await getRecentPuzzleDates(180);
    for (const date of dates) {
      entries.push({
        url: absoluteUrl(`/puzzle/${date}`),
        lastModified: new Date(`${date}T00:00:00`),
        changeFrequency: 'yearly',
        priority: 0.5
      });
    }
  } catch {
    // If the DB is unreachable at build time, still return the static routes.
  }

  return entries;
}
