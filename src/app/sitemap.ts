import { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'

import { SITE_URL } from '@/client/config/site'
import { isProduction } from '@/utils/env'

// Генерується при кожному запиті (у Docker-білді немає БД, і статичний sitemap
// назавжди лишався б без динамічних сторінок — ISS-007). Payload-запити дешеві.
export const dynamic = 'force-dynamic'

const BASE_URL = SITE_URL

function url(path: string, locale: 'ua' | 'en'): string {
  const prefix = locale === 'en' ? '/en' : ''
  return `${BASE_URL}${prefix}${path}`
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Превʼю / тестове середовище не індексується — sitemap порожній
  if (!isProduction()) return []

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

  // Dynamic routes from Payload CMS (ISS-054):
  // - лише потрібні поля (select / populate), не повні документи з depth 2;
  // - EN-адреса — лише якщо документ має англійський переклад (без нього /en показує UA-текст = дубль);
  // - сторінки категорій блогу й типів послуг, у яких є опубліковані записи.
  try {
    const payload = await getPayload({ config })
    const published = { status: { equals: 'published' } } as const

    const [posts, postsEn, projects, projectsEn, services, servicesEn] = await Promise.all([
      payload.find({ collection: 'posts', where: published, limit: 1000, depth: 1, locale: 'uk' as never, select: { slug: true, category: true, updatedAt: true }, populate: { categories: { slug: true } } }),
      payload.find({ collection: 'posts', where: published, limit: 1000, depth: 0, locale: 'en' as never, fallbackLocale: false as never, select: { title: true } }),
      payload.find({ collection: 'portfolio', where: published, limit: 1000, depth: 0, locale: 'uk' as never, select: { slug: true, updatedAt: true } }),
      payload.find({ collection: 'portfolio', where: published, limit: 1000, depth: 0, locale: 'en' as never, fallbackLocale: false as never, select: { title: true } }),
      payload.find({ collection: 'services', where: published, limit: 1000, depth: 1, locale: 'uk' as never, select: { slug: true, serviceType: true, updatedAt: true }, populate: { 'service-types': { slug: true } } }),
      payload.find({ collection: 'services', where: published, limit: 1000, depth: 0, locale: 'en' as never, fallbackLocale: false as never, select: { title: true } }),
    ])

    const translated = (docs: { id: string | number; title?: unknown }[]) =>
      new Set(docs.filter((d) => typeof d.title === 'string' && d.title.trim()).map((d) => String(d.id)))
    const postsWithEn = translated(postsEn.docs)
    const projectsWithEn = translated(projectsEn.docs)
    const servicesWithEn = translated(servicesEn.docs)

    const slugOf = (rel: unknown) => (rel && typeof rel === 'object' ? (rel as { slug?: string }).slug : undefined)

    // UA-адреса + (якщо є переклад) EN-адреса з взаємними hreflang
    const entries = (
      path: string,
      opts: { hasEn: boolean; lastModified?: string; priority: number; changeFrequency: 'weekly' | 'monthly' }
    ): MetadataRoute.Sitemap => {
      const ua = `${BASE_URL}${path}`
      const en = `${BASE_URL}/en${path}`
      const languages: Record<string, string> = opts.hasEn
        ? { 'uk-UA': ua, 'en-US': en, 'x-default': en }
        : { 'uk-UA': ua, 'x-default': ua }
      const base = {
        lastModified: opts.lastModified ? new Date(opts.lastModified) : undefined,
        changeFrequency: opts.changeFrequency,
        priority: opts.priority,
        alternates: { languages },
      }
      return opts.hasEn ? [{ url: ua, ...base }, { url: en, ...base }] : [{ url: ua, ...base }]
    }

    const postUrls = posts.docs.flatMap((p) => {
      const category = slugOf(p.category)
      if (!p.slug || !category) return []
      return entries(`/blog/${category}/${p.slug}`, { hasEn: postsWithEn.has(String(p.id)), lastModified: p.updatedAt, priority: 0.6, changeFrequency: 'monthly' })
    })

    const portfolioUrls = projects.docs.flatMap((p) =>
      p.slug ? entries(`/portfolio/${p.slug}`, { hasEn: projectsWithEn.has(String(p.id)), lastModified: p.updatedAt, priority: 0.7, changeFrequency: 'monthly' }) : []
    )

    const serviceUrls = services.docs.flatMap((s) => {
      const type = slugOf(s.serviceType)
      if (!s.slug || !type) return []
      return entries(`/services/${type}/${s.slug}`, { hasEn: servicesWithEn.has(String(s.id)), lastModified: s.updatedAt, priority: 0.7, changeFrequency: 'monthly' })
    })

    // Категорії блогу й типи послуг — лише з опублікованими записами (дата — найсвіжіший запис)
    const listingUrls = (prefix: string, docs: { rel: unknown; updatedAt?: string }[], priority: number) => {
      const latest = new Map<string, string>()
      for (const doc of docs) {
        const slug = slugOf(doc.rel)
        if (!slug) continue
        const prev = latest.get(slug)
        if (doc.updatedAt && (!prev || doc.updatedAt > prev)) latest.set(slug, doc.updatedAt)
        else if (!prev) latest.set(slug, doc.updatedAt ?? '')
      }
      return [...latest].flatMap(([slug, updatedAt]) =>
        entries(`${prefix}/${slug}`, { hasEn: true, lastModified: updatedAt || undefined, priority, changeFrequency: 'weekly' })
      )
    }
    const categoryUrls = listingUrls('/blog', posts.docs.map((p) => ({ rel: p.category, updatedAt: p.updatedAt })), 0.6)
    const serviceTypeUrls = listingUrls('/services', services.docs.map((s) => ({ rel: s.serviceType, updatedAt: s.updatedAt })), 0.7)

    return [...staticRoutes, ...serviceTypeUrls, ...serviceUrls, ...categoryUrls, ...postUrls, ...portfolioUrls]
  } catch (err) {
    console.error('[sitemap] Payload CMS unavailable — returning static routes only:', err)
    return staticRoutes
  }
}
