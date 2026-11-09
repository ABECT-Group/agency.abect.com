import { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'

import { SITE_URL } from '@/client/config/site'

// Генерується при кожному запиті (у Docker-білді немає БД, і статичний sitemap
// назавжди лишався б без динамічних сторінок — ISS-007). Payload-запити дешеві.
export const dynamic = 'force-dynamic'

const BASE_URL = SITE_URL

function url(path: string, locale: 'ua' | 'en'): string {
  const prefix = locale === 'en' ? '/en' : ''
  return `${BASE_URL}${prefix}${path}`
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locales = ['ua', 'en'] as const

  // Static routes — no lastModified (Google ignores unreliable always-changing timestamps)
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}`,
      changeFrequency: 'weekly',
      priority: 1.0,
      alternates: { languages: { 'uk-UA': `${BASE_URL}`, 'en-US': `${BASE_URL}/en`, 'x-default': `${BASE_URL}/en` } },
    },
    {
      url: `${BASE_URL}/en`,
      changeFrequency: 'weekly',
      priority: 1.0,
      alternates: { languages: { 'uk-UA': `${BASE_URL}`, 'en-US': `${BASE_URL}/en`, 'x-default': `${BASE_URL}/en` } },
    },
    ...['services', 'about', 'portfolio', 'blog', 'contacts'].flatMap(route =>
      locales.map(locale => ({
        url: url(`/${route}`, locale),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
        alternates: {
          languages: {
            'uk-UA': `${BASE_URL}/${route}`,
            'en-US': `${BASE_URL}/en/${route}`,
            'x-default': `${BASE_URL}/en/${route}`,
          },
        },
      }))
    ),
    // Calculator — lead generation tool
    ...locales.map(locale => ({
      url: url('/calculator', locale),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
      alternates: {
        languages: {
          'uk-UA': `${BASE_URL}/calculator`,
          'en-US': `${BASE_URL}/en/calculator`,
          'x-default': `${BASE_URL}/en/calculator`,
        },
      },
    })),
    // Legal pages
    ...locales.map(locale => ({
      url: url('/privacy-policy', locale),
      changeFrequency: 'yearly' as const,
      priority: 0.2,
    })),
  ]

  // Dynamic routes from Payload CMS
  try {
    const payload = await getPayload({ config })

    const [postsUa, postsEn, portfolioUa, portfolioEn, servicesUa, servicesEn] = await Promise.all([
      payload.find({ collection: 'posts', where: { status: { equals: 'published' } }, limit: 500, locale: 'uk' as never }),
      payload.find({ collection: 'posts', where: { status: { equals: 'published' } }, limit: 500, locale: 'en' as never }),
      payload.find({ collection: 'portfolio', where: { status: { equals: 'published' } }, limit: 500, locale: 'uk' as never }),
      payload.find({ collection: 'portfolio', where: { status: { equals: 'published' } }, limit: 500, locale: 'en' as never }),
      payload.find({ collection: 'services', where: { status: { equals: 'published' } }, limit: 500, locale: 'uk' as never }),
      payload.find({ collection: 'services', where: { status: { equals: 'published' } }, limit: 500, locale: 'en' as never }),
    ])

    const postUrls: MetadataRoute.Sitemap = [
      ...postsUa.docs.filter(p => p.slug && p.category).map(p => {
        const catSlug = typeof p.category === 'object' ? p.category?.slug : p.category
        return {
          url: url(`/blog/${catSlug}/${p.slug}`, 'ua'),
          lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
          changeFrequency: 'monthly' as const,
          priority: 0.6,
          alternates: {
            languages: {
              'uk-UA': `${BASE_URL}/blog/${catSlug}/${p.slug}`,
              'en-US': `${BASE_URL}/en/blog/${catSlug}/${p.slug}`,
              'x-default': `${BASE_URL}/en/blog/${catSlug}/${p.slug}`,
            },
          },
        }
      }),
      ...postsEn.docs.filter(p => p.slug && p.category).map(p => {
        const catSlug = typeof p.category === 'object' ? p.category?.slug : p.category
        return {
          url: url(`/blog/${catSlug}/${p.slug}`, 'en'),
          lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
          changeFrequency: 'monthly' as const,
          priority: 0.6,
          alternates: {
            languages: {
              'uk-UA': `${BASE_URL}/blog/${catSlug}/${p.slug}`,
              'en-US': `${BASE_URL}/en/blog/${catSlug}/${p.slug}`,
              'x-default': `${BASE_URL}/en/blog/${catSlug}/${p.slug}`,
            },
          },
        }
      }),
    ]

    const portfolioUrls: MetadataRoute.Sitemap = [
      ...portfolioUa.docs.filter(p => p.slug).map(p => ({
        url: url(`/portfolio/${p.slug}`, 'ua'),
        lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
        alternates: {
          languages: {
            'uk-UA': `${BASE_URL}/portfolio/${p.slug}`,
            'en-US': `${BASE_URL}/en/portfolio/${p.slug}`,
            'x-default': `${BASE_URL}/en/portfolio/${p.slug}`,
          },
        },
      })),
      ...portfolioEn.docs.filter(p => p.slug).map(p => ({
        url: url(`/portfolio/${p.slug}`, 'en'),
        lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
        alternates: {
          languages: {
            'uk-UA': `${BASE_URL}/portfolio/${p.slug}`,
            'en-US': `${BASE_URL}/en/portfolio/${p.slug}`,
            'x-default': `${BASE_URL}/en/portfolio/${p.slug}`,
          },
        },
      })),
    ]

    const serviceUrls: MetadataRoute.Sitemap = [
      ...servicesUa.docs.filter(s => s.slug && s.serviceType).map(s => {
        const typeSlug = typeof s.serviceType === 'object' ? s.serviceType?.slug : s.serviceType
        return {
          url: url(`/services/${typeSlug}/${s.slug}`, 'ua'),
          lastModified: s.updatedAt ? new Date(s.updatedAt) : undefined,
          changeFrequency: 'monthly' as const,
          priority: 0.7,
          alternates: {
            languages: {
              'uk-UA': `${BASE_URL}/services/${typeSlug}/${s.slug}`,
              'en-US': `${BASE_URL}/en/services/${typeSlug}/${s.slug}`,
              'x-default': `${BASE_URL}/en/services/${typeSlug}/${s.slug}`,
            },
          },
        }
      }),
      ...servicesEn.docs.filter(s => s.slug && s.serviceType).map(s => {
        const typeSlug = typeof s.serviceType === 'object' ? s.serviceType?.slug : s.serviceType
        return {
          url: url(`/services/${typeSlug}/${s.slug}`, 'en'),
          lastModified: s.updatedAt ? new Date(s.updatedAt) : undefined,
          changeFrequency: 'monthly' as const,
          priority: 0.7,
          alternates: {
            languages: {
              'uk-UA': `${BASE_URL}/services/${typeSlug}/${s.slug}`,
              'en-US': `${BASE_URL}/en/services/${typeSlug}/${s.slug}`,
              'x-default': `${BASE_URL}/en/services/${typeSlug}/${s.slug}`,
            },
          },
        }
      }),
    ]

    return [...staticRoutes, ...postUrls, ...portfolioUrls, ...serviceUrls]
  } catch (err) {
    console.error('[sitemap] Payload CMS unavailable — returning static routes only:', err)
    return staticRoutes
  }
}
