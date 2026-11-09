import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { getAllPosts, getAllCategories } from '@/client/lib/blog';
import BlogPage from '@/client/modules/blog/BlogPage/BlogPage';
import { Fragment } from 'react';
import type { Metadata } from 'next';
import { SITE_URL } from '@/client/config/site';

type Params = {
	params: Promise<{
		locale: string;
	}>;
};

// Нічого не пререндеримо на білді: у Docker-білді немає БД, і сторінки «застигали» б порожніми.
// Кожна сторінка рендериться при першому запиті й кешується до revalidateTag('all') (ISS-022).
export function generateStaticParams() {
	return [];
}

// SEO Metadata
export async function generateMetadata({ params }: Params): Promise<Metadata> {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: 'BlogPage.seo' });

	const title = t('title');
	const description = t('description');
	const keywords = t('keywords');

	const fullUrl =
		locale === 'ua'
			? `${SITE_URL}/blog`
			: `${SITE_URL}/${locale}/blog`;

	return {
		title,
		description,
		keywords,
		alternates: {
			canonical: fullUrl,
			languages: {
				'uk-UA': `${SITE_URL}/blog`,
				'en-US': `${SITE_URL}/en/blog`,
				'x-default': `${SITE_URL}/en/blog`
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
					url: locale === 'ua' ? `${SITE_URL}/seo/blog-og.jpg` : `${SITE_URL}/seo/en-blog-og.jpg`,
					width: 1200,
					height: 630,
					alt: title
				}
			],
			locale: locale === 'ua' ? 'uk_UA' : 'en_US',
			type: 'website'
		},
		twitter: {
			card: 'summary_large_image',
			title,
			description,
			images: [locale === 'ua' ? `${SITE_URL}/seo/blog-og.jpg` : `${SITE_URL}/seo/en-blog-og.jpg`]
		}
	};
}

// Server Component
export default async function BlogServerPage({ params }: Params) {
	const { locale } = await params;

	setRequestLocale(locale);

	// Отримуємо всі статті та категорії паралельно
	const [posts, categories] = await Promise.all([
		getAllPosts(locale),
		getAllCategories(locale)
	]);

	const pageUrl = locale === 'ua' ? `${SITE_URL}/blog` : `${SITE_URL}/en/blog`;
	const breadcrumbJsonLd = {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{ '@type': 'ListItem', position: 1, name: locale === 'ua' ? 'Головна' : 'Home', item: SITE_URL },
			{ '@type': 'ListItem', position: 2, name: locale === 'ua' ? 'Блог' : 'Blog', item: pageUrl },
		],
	};

	return (
		<Fragment>
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
			<BlogPage
				locale={locale}
				posts={posts}
				categories={categories}
			/>
		</Fragment>
	);
}
