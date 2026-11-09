import { MetadataRoute } from 'next'
import { SITE_URL } from '@/client/config/site'
import { isProduction } from '@/utils/env'

// Рахується на кожен запит: залежить від APP_ENV середовища, а не від того, де йшов білд.
export const dynamic = 'force-dynamic'

export default function robots(): MetadataRoute.Robots {
  // Превʼю / тестове середовище — повністю закрите від індексації
  if (!isProduction()) {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
    }
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/'],
      },
      // Explicit allow for AI crawlers — enables brand visibility in AI answers
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'ChatGPT-User', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'Google-Extended', allow: '/' },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
