import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPostBySlug, getRelatedPosts } from '@/client/lib/blog';
import Article from '@/client/modules/article/Article';
import type { Media, User, Category } from '@/payload-types';
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
		slug: string;
	}>;
};

// SEO Metadata
export async function generateMetadata({ params }: Params): Promise<Metadata> {
	const { locale, slug } = await params;
	const post = await getPostBySlug(slug, locale);

	if (!post) {
		return {
			title: 'Article Not Found',
			description: 'The requested article could not be found'
		};
	}

	const cover = post.cover as Media | null;
	const imageUrl = cover?.url || (locale === 'ua' ? `${SITE_URL}/seo/blog-og.jpg` : `${SITE_URL}/seo/en-blog-og.jpg`);

	const category = post.category as Category | null;
	const categorySlug = category?.slug || 'uncategorized';

	const fullUrl =
		locale === 'ua'
			? `${SITE_URL}/blog/${categorySlug}/${slug}`
			: `${SITE_URL}/${locale}/blog/${categorySlug}/${slug}`;

	const author = post.author as User | null;
	const authorName = author ? `${author.firstName} ${author.lastName}` : 'ABECT';

	return {
		title: post.seo.metaTitle,
		description: post.seo.metaDescription,
		keywords: post.seo.metaKeywords,
		alternates: {
			canonical: fullUrl,
			languages: {
				'uk-UA': `${SITE_URL}/blog/${categorySlug}/${slug}`,
				'en-US': `${SITE_URL}/en/blog/${categorySlug}/${slug}`,
				'x-default': `${SITE_URL}/en/blog/${categorySlug}/${slug}`
			}
		},
		authors: [{ name: authorName, url: SITE_URL }],
		robots: {
			index: true,
			follow: true,
			'max-image-preview': 'large',
			'max-snippet': -1,
			'max-video-preview': -1
		},
		openGraph: {
			title: post.seo.metaTitle,
			description: post.seo.metaDescription,
			url: fullUrl,
			siteName: 'ABECT',
			images: [
				{
					url: imageUrl,
					width: 1200,
					height: 630,
					alt: post.title
				}
			],
			locale: locale === 'ua' ? 'uk_UA' : 'en_US',
			type: 'article',
			publishedTime: post.date,
			authors: [authorName]
		},
		twitter: {
			card: 'summary_large_image',
			title: post.seo.metaTitle,
			description: post.seo.metaDescription,
			images: [imageUrl]
		}
	};
}

// Server Component
export default async function ArticlePage({ params }: Params) {
	const { locale, category: categorySlug, slug } = await params;

	setRequestLocale(locale);

	// Отримуємо статтю
	const post = await getPostBySlug(slug, locale);

	if (!post) {
		notFound();
	}

	// Перевіряємо чи категорія в URL відповідає категорії статті
	const postCategory = post.category as Category | null;
	const postCategorySlug = postCategory?.slug || 'uncategorized';

	// Якщо категорія не співпадає - 404
	if (categorySlug !== postCategorySlug) {
		notFound();
	}

	// Отримуємо category ID для related posts
	const categoryId = typeof post.category === 'object'
		? post.category.id
		: post.category;

	// Отримуємо схожі статті
	const relatedPosts = await getRelatedPosts(post.id, categoryId, locale, 3);

	// Отримуємо дані для Schema.org
	const cover = post.cover as Media | null;
	const author = post.author as User | null;
	const category = post.category as Category | null;
	const authorName = author ? `${author.firstName} ${author.lastName}` : 'ABECT';

	return (
		<>
			{/* JSON-LD Schema.org BlogPosting */}
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify({
						'@context': 'https://schema.org',
						'@type': 'BlogPosting',
						headline: post.title,
						description: post.description,
						image: cover?.url || (locale === 'ua' ? `${SITE_URL}/seo/blog-og.jpg` : `${SITE_URL}/seo/en-blog-og.jpg`),
						author: {
							'@type': 'Person',
							name: authorName
						},
						publisher: {
							'@type': 'Organization',
							name: 'ABECT',
							logo: {
								'@type': 'ImageObject',
								url: `${SITE_URL}/logo.png`
							}
						},
						datePublished: post.date,
						dateModified: post.updatedAt,
						url: locale === 'ua'
							? `${SITE_URL}/blog/${categorySlug}/${slug}`
							: `${SITE_URL}/${locale}/blog/${categorySlug}/${slug}`,
						articleSection: category?.name,
						keywords: category?.name,
						wordCount: post.readTime * 200,
						timeRequired: `PT${Math.ceil(post.readTime / 60)}M`
					})
				}}
			/>

			{/* Breadcrumbs JSON-LD */}
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify({
						'@context': 'https://schema.org',
						'@type': 'BreadcrumbList',
						itemListElement: [
							{
								'@type': 'ListItem',
								position: 1,
								name: locale === 'ua' ? 'Головна' : 'Home',
								item: SITE_URL
							},
							{
								'@type': 'ListItem',
								position: 2,
								name: locale === 'ua' ? 'Блог' : 'Blog',
								item: locale === 'ua'
									? `${SITE_URL}/blog`
									: `${SITE_URL}/${locale}/blog`
							},
							{
								'@type': 'ListItem',
								position: 3,
								name: category?.name || 'Category',
								item: locale === 'ua'
									? `${SITE_URL}/blog/${categorySlug}`
									: `${SITE_URL}/${locale}/blog/${categorySlug}`
							},
							{
								'@type': 'ListItem',
								position: 4,
								name: post.title,
								item: locale === 'ua'
									? `${SITE_URL}/blog/${categorySlug}/${slug}`
									: `${SITE_URL}/${locale}/blog/${categorySlug}/${slug}`
							}
						]
					})
				}}
			/>

			<Article post={post} relatedPosts={relatedPosts} locale={locale} />
		</>
	);
}
