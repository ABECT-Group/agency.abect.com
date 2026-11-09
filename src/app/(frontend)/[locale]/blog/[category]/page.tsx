import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getAllPosts, getAllCategories, getCategoryBySlug, getPostsByCategory } from '@/client/lib/blog';
import BlogPage from '@/client/modules/blog/BlogPage/BlogPage';
import type { Metadata } from 'next';
import { SITE_URL } from '@/client/config/site';

export const dynamicParams = true;

// Нічого не пререндеримо на білді: у Docker-білді немає БД, і сторінки «застигали» б порожніми.
// Кожна сторінка рендериться при першому запиті й кешується до revalidateTag('all') (ISS-022).
export function generateStaticParams() {
	return [];
}

type Params = {
	params: Promise<{
		locale: string;
		category: string;
	}>;
};

// SEO Metadata
export async function generateMetadata({ params }: Params): Promise<Metadata> {
	const { locale, category: categorySlug } = await params;
	const category = await getCategoryBySlug(categorySlug, locale);

	if (!category) {
		return {
			title: 'Category Not Found',
			description: 'The requested category could not be found'
		};
	}

	const title = category.seo?.metaTitle || category.name;
	const description = category.seo?.metaDescription || category.description;
	const keywords = category.seo?.metaKeywords || category.name;

	const imageUrl = locale === 'ua' ? `${SITE_URL}/seo/og.jpg` : `${SITE_URL}/seo/en-og.jpg`;

	const fullUrl =
		locale === 'ua'
			? `${SITE_URL}/blog/${categorySlug}`
			: `${SITE_URL}/${locale}/blog/${categorySlug}`;

	return {
		title,
		description,
		keywords,
		alternates: {
			canonical: fullUrl,
			languages: {
				'uk-UA': `${SITE_URL}/blog/${categorySlug}`,
				'en-US': `${SITE_URL}/en/blog/${categorySlug}`,
				'x-default': `${SITE_URL}/en/blog/${categorySlug}`
			}
		},
		robots: {
			index: true,
			follow: true,
			'max-image-preview': 'large',
			'max-snippet': -1
		},
		openGraph: {
			title,
			description,
			url: fullUrl,
			siteName: 'ABECT',
			images: [
				{
					url: imageUrl,
					width: 1200,
					height: 630,
					alt: category.name
				}
			],
			locale: locale === 'ua' ? 'uk_UA' : 'en_US',
			type: 'website'
		},
		twitter: {
			card: 'summary_large_image',
			title,
			description,
			images: [imageUrl]
		}
	};
}

// Server Component
export default async function CategoryPage({ params }: Params) {
	const { locale, category: categorySlug } = await params;

	setRequestLocale(locale);

	// Отримуємо категорію
	const category = await getCategoryBySlug(categorySlug, locale);

	if (!category) {
		notFound();
	}

	// Отримуємо статті категорії, всі статті (для підрахунку) та всі категорії для фільтра
	const [posts, allPosts, categories] = await Promise.all([
		getPostsByCategory(categorySlug, locale),
		getAllPosts(locale),
		getAllCategories(locale)
	]);

	return (
		<>
			{/* JSON-LD Schema.org CollectionPage */}
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify({
						'@context': 'https://schema.org',
						'@type': 'CollectionPage',
						name: category.name,
						description: category.description,
						url: locale === 'ua'
							? `${SITE_URL}/blog/${categorySlug}`
							: `${SITE_URL}/${locale}/blog/${categorySlug}`,
						isPartOf: {
							'@type': 'Blog',
							name: 'ABECT Blog',
							url: locale === 'ua'
								? `${SITE_URL}/blog`
								: `${SITE_URL}/${locale}/blog`
						},
						numberOfItems: posts.length
					})
				}}
			/>

			<BlogPage
				locale={locale}
				posts={posts}
				allPosts={allPosts}
				categories={categories}
				currentCategory={category}
			/>
		</>
	);
}
