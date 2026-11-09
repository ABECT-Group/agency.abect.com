import type { Service, ServiceType } from '@/payload-types';
import { payloadFind } from './payload-fetch';

/**
 * Утиліта для сортування сервісів за order → createdAt
 * Логіка: менше order = вище; якщо order однаковий або null → новіші першими
 */
function sortByOrderAndDate(a: Service, b: Service): number {
  if (a.order != null && b.order != null && a.order !== b.order) return a.order - b.order;
  if (a.order != null) return -1;
  if (b.order != null) return 1;
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

/** featured → order → createdAt */
function sortByFeaturedOrderAndDate(a: Service, b: Service): number {
  if (a.featured && !b.featured) return -1;
  if (!a.featured && b.featured) return 1;
  return sortByOrderAndDate(a, b);
}

function findPublished(locale: string, where: Record<string, string | number> = {}): Promise<Service[]> {
  return payloadFind<Service>('services', {
    'where[status][equals]': 'published',
    ...where,
    locale,
    limit: 100,
    depth: 2,
  });
}

/**
 * Отримує featured сервіси для головної сторінки
 * Повертає до 4 сервісів (featured + найкращі не-featured якщо потрібно)
 */
export async function getFeaturedServices(locale: string = 'uk'): Promise<Service[]> {
  const services = await findPublished(locale);
  if (services.length === 0) return [];

  const featuredServices = services.filter(s => s.featured === true).sort(sortByOrderAndDate);
  if (featuredServices.length >= 4) return featuredServices.slice(0, 4);

  const nonFeaturedServices = services.filter(s => !s.featured).sort(sortByOrderAndDate);
  return [...featuredServices, ...nonFeaturedServices].slice(0, 4);
}

/**
 * Отримує всі опубліковані сервіси для сторінки /services
 */
export async function getAllServices(locale: string = 'uk'): Promise<Service[]> {
  const services = await findPublished(locale);
  return services.sort(sortByFeaturedOrderAndDate);
}

/**
 * Отримує один сервіс по slug для сторінки /services/[type]/[slug]
 */
export async function getServiceBySlug(slug: string, locale: string = 'uk'): Promise<Service | null> {
  const services = await payloadFind<Service>('services', {
    'where[slug][equals]': slug,
    'where[status][equals]': 'published',
    locale,
    limit: 1,
    depth: 2,
  });
  return services[0] ?? null;
}

/**
 * Отримує схожі сервіси для сторінки /services/[type]/[slug]
 * Логіка: той самий serviceType → featured → order → createdAt
 */
export async function getRelatedServices(
  currentServiceId: string | number,
  serviceTypeId: string | number,
  locale: string = 'uk',
  limit: number = 3
): Promise<Service[]> {
  let services = (await findPublished(locale, { 'where[serviceType][equals]': serviceTypeId }))
    .filter(s => s.id != null && s.id !== currentServiceId);

  // Якщо менше ніж потрібно — додаємо сервіси інших типів
  if (services.length < limit) {
    const others = (await findPublished(locale, { 'where[serviceType][not_equals]': serviceTypeId }))
      .filter(s => s.id !== currentServiceId);
    services = [...services, ...others];
  }

  return services.sort(sortByFeaturedOrderAndDate).slice(0, limit);
}

/**
 * Отримує всі типи послуг для фільтра
 */
export async function getAllServiceTypes(locale: string = 'uk'): Promise<ServiceType[]> {
  return payloadFind<ServiceType>('service-types', { locale, limit: 100, sort: 'order' });
}

/**
 * Отримує тип послуги по slug
 */
export async function getServiceTypeBySlug(slug: string, locale: string = 'uk'): Promise<ServiceType | null> {
  const types = await payloadFind<ServiceType>('service-types', {
    'where[slug][equals]': slug,
    locale,
    limit: 1,
  });
  return types[0] ?? null;
}

/**
 * Отримує сервіси по типу (slug)
 */
export async function getServicesByType(typeSlug: string, locale: string = 'uk'): Promise<Service[]> {
  const serviceType = await getServiceTypeBySlug(typeSlug, locale);
  if (!serviceType) return [];

  const services = await findPublished(locale, { 'where[serviceType][equals]': serviceType.id });
  return services.sort(sortByFeaturedOrderAndDate);
}
