import type { Post, Category } from '@/payload-types';
import { payloadFind } from './payload-fetch';

/**
 * Сортування: featured → date (новіші першими)
 */
function sortByFeaturedAndDate(a: Post, b: Post): number {
	if (a.featured && !b.featured) return -1;
	if (!a.featured && b.featured) return 1;
	return new Date(b.date).getTime() - new Date(a.date).getTime();
}

function findPublished(locale: string, where: Record<string, string | number> = {}): Promise<Post[]> {
	return payloadFind<Post>('posts', {
		'where[status][equals]': 'published',
		...where,
		locale,
		limit: 100,
		depth: 2,
	});
}

/**
 * Отримує всі опубліковані статті для сторінки /blog
 */
export async function getAllPosts(locale: string = 'uk'): Promise<Post[]> {
	const posts = await findPublished(locale);
	return posts.sort(sortByFeaturedAndDate);
}

/**
 * Отримує featured статті для головної сторінки (4 шт)
 */
export async function getFeaturedPosts(locale: string = 'uk'): Promise<Post[]> {
	const posts = await findPublished(locale);
	if (posts.length === 0) return [];

	const featuredPosts = posts.filter(p => p.featured === true).sort(sortByFeaturedAndDate);
	if (featuredPosts.length >= 4) return featuredPosts.slice(0, 4);

	// Якщо featured менше 4, беремо решту з не-featured
	const nonFeaturedPosts = posts.filter(p => !p.featured).sort(sortByFeaturedAndDate);
	return [...featuredPosts, ...nonFeaturedPosts].slice(0, 4);
}

/**
 * Отримує одну статтю по slug для сторінки /blog/[category]/[slug]
 */
export async function getPostBySlug(slug: string, locale: string = 'uk'): Promise<Post | null> {
	const posts = await payloadFind<Post>('posts', {
		'where[slug][equals]': slug,
		'where[status][equals]': 'published',
		locale,
		limit: 1,
		depth: 2,
	});
	return posts[0] ?? null;
}

/**
 * Отримує схожі статті для сторінки /blog/[category]/[slug]
 * Логіка: та сама категорія → featured → date
 */
export async function getRelatedPosts(
	currentPostId: string | number,
	categoryId: string | number,
	locale: string = 'uk',
	limit: number = 3
): Promise<Post[]> {
	let posts = (await findPublished(locale, { 'where[category][equals]': categoryId }))
		.filter(p => p.id != null && p.id !== currentPostId);

	// Якщо менше ніж потрібно — додаємо статті з інших категорій
	if (posts.length < limit) {
		const others = (await findPublished(locale, { 'where[category][not_equals]': categoryId }))
			.filter(p => p.id !== currentPostId);
		posts = [...posts, ...others];
	}

	return posts.sort(sortByFeaturedAndDate).slice(0, limit);
}

/**
 * Отримує всі категорії для фільтра
 */
export async function getAllCategories(locale: string = 'uk'): Promise<Category[]> {
	return payloadFind<Category>('categories', { locale, limit: 100 });
}

/**
 * Отримує категорію по slug
 */
export async function getCategoryBySlug(slug: string, locale: string = 'uk'): Promise<Category | null> {
	const categories = await payloadFind<Category>('categories', {
		'where[slug][equals]': slug,
		locale,
		limit: 1,
	});
	return categories[0] ?? null;
}

/**
 * Отримує статті по категорії (slug)
 */
export async function getPostsByCategory(categorySlug: string, locale: string = 'uk'): Promise<Post[]> {
	const category = await getCategoryBySlug(categorySlug, locale);
	if (!category) return [];

	const posts = await findPublished(locale, { 'where[category][equals]': category.id });
	return posts.sort(sortByFeaturedAndDate);
}
