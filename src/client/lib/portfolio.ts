import type { Portfolio } from '@/payload-types';
import { payloadFind } from './payload-fetch';

/**
 * Утиліта для сортування проєктів за order → createdAt
 * Логіка: менше order = вище; якщо order однаковий або null → новіші першими
 */
function sortByOrderAndDate(a: Portfolio, b: Portfolio): number {
  if (a.order != null && b.order != null && a.order !== b.order) return a.order - b.order;
  if (a.order != null) return -1;
  if (b.order != null) return 1;
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

/** featured → order → createdAt */
function sortByFeaturedOrderAndDate(a: Portfolio, b: Portfolio): number {
  if (a.featured && !b.featured) return -1;
  if (!a.featured && b.featured) return 1;
  return sortByOrderAndDate(a, b);
}

function findPublished(locale: string, where: Record<string, string | number> = {}): Promise<Portfolio[]> {
  return payloadFind<Portfolio>('portfolio', {
    'where[status][equals]': 'published',
    ...where,
    locale,
    limit: 100,
  });
}

/**
 * 4 проєкти для головної: спершу featured, далі решта.
 */
export async function getFeaturedPortfolio(locale: string = 'uk'): Promise<Portfolio[]> {
  const projects = await findPublished(locale);
  if (projects.length === 0) return [];

  const featuredProjects = projects.filter(p => p.featured === true).sort(sortByOrderAndDate);
  if (featuredProjects.length >= 4) return featuredProjects.slice(0, 4);

  const nonFeaturedProjects = projects.filter(p => !p.featured).sort(sortByOrderAndDate);
  return [...featuredProjects, ...nonFeaturedProjects].slice(0, 4);
}

/**
 * Отримує всі опубліковані проєкти для сторінки /portfolio
 */
export async function getAllPortfolio(locale: string = 'uk'): Promise<Portfolio[]> {
  const projects = await findPublished(locale);
  return projects.sort(sortByFeaturedOrderAndDate);
}

/**
 * Отримує один проєкт по slug для сторінки /portfolio/[slug]
 */
export async function getPortfolioBySlug(slug: string, locale: string = 'uk'): Promise<Portfolio | null> {
  const projects = await payloadFind<Portfolio>('portfolio', {
    'where[slug][equals]': slug,
    'where[status][equals]': 'published',
    locale,
    limit: 1,
  });
  return projects[0] ?? null;
}

/**
 * Отримує схожі проєкти для сторінки /portfolio/[slug]
 * Логіка: той самий service → featured → order → createdAt
 */
export async function getRelatedProjects(
  currentProjectId: string | number,
  service: Portfolio['service'],
  locale: string = 'uk',
  limit: number = 3
): Promise<Portfolio[]> {
  const serviceValue = String(service ?? '');
  let projects = (await findPublished(locale, { 'where[service][equals]': serviceValue }))
    .filter(p => p.id != null && p.id !== currentProjectId);

  // Якщо менше ніж потрібно — додаємо проєкти інших напрямів
  if (projects.length < limit) {
    const others = (await findPublished(locale, { 'where[service][not_equals]': serviceValue }))
      .filter(p => p.id !== currentProjectId);
    projects = [...projects, ...others];
  }

  return projects.sort(sortByFeaturedOrderAndDate).slice(0, limit);
}
