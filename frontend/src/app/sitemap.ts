import { MetadataRoute } from 'next';
import { NEXT_PUBLIC_SITE_URL } from '@/config/env';

// Generate dynamic sitemap for search engines
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = NEXT_PUBLIC_SITE_URL;

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/portal`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    // Add more routes as your app grows
  ];
}
