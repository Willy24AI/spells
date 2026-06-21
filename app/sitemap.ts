import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/seo/site';

// Refresh the sitemap hourly so newly added pages/puzzles get picked up.
export const revalidate = 3600;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
    { path: '/', priority: 1.0, changeFrequency: 'daily' },
    { path: '/unlimited', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/nyt-spelling-bee-alternative', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/how-to-play', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/pangram', priority: 0.6, changeFrequency: 'monthly' }
  ];

  return routes.map((r) => ({
    url: absoluteUrl(r.path),
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority
  }));
}
