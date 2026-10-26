import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://indiaorigin.in';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/account/', '/api/', '/messages/', '/rfq/'],
      },
      {
        userAgent: ['GPTBot', 'OAI-SearchBot', 'PerplexityBot', 'Google-Extended', 'ClaudeBot'],
        allow: '/',
        disallow: ['/account/', '/api/', '/messages/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}