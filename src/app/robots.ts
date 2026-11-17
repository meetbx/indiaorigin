import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.theindiaorigin.com'; // Adjust to your exact canonical preference (with or without www)

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/account/',
          '/api/',
          '/messages/',
          '/rfq/',
          '/*?*', // Prevents Googlebot from wasting crawl budget on filter/sort permutations
        ],
      },
      {
        userAgent: ['GPTBot', 'OAI-SearchBot', 'PerplexityBot', 'Google-Extended', 'ClaudeBot'],
        allow: '/',
        disallow: [
  '/account/',
  '/api/',
  '/messages/',
  '/rfq/',
  '/*?*', // <-- Heads up on this rule
]
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}