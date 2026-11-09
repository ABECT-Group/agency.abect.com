import { setRequestLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { getAllPortfolio } from '@/client/lib/portfolio';
import PortfolioPage from '@/client/modules/portfolio/PortfolioPage/PortfolioPage';
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
	const t = await getTranslations({ locale, namespace: 'PortfolioPage.seo' });

	const title = t('title');
	const description = t('description');
	const keywords = t('keywords');

	const fullUrl =
		locale === 'ua'
			? `${SITE_URL}/portfolio`
			: `${SITE_URL}/${locale}/portfolio`;

	return {
		title,
		description,
		keywords,
		alternates: {
			canonical: fullUrl,
			languages: {
				'uk-UA': `${SITE_URL}/portfolio`,
				'en-US': `${SITE_URL}/en/portfolio`,
				'x-default': `${SITE_URL}/en/portfolio`
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
					url: locale === 'ua' ? `${SITE_URL}/seo/portfolio-og.jpg` : `${SITE_URL}/seo/en-portfolio-og.jpg`,
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
			images: [locale === 'ua' ? `${SITE_URL}/seo/portfolio-og.jpg` : `${SITE_URL}/seo/en-portfolio-og.jpg`]
		}
	};
}

// Server Component
export default async function PortfolioServerPage({ params }: Params) {
	const { locale } = await params;

	setRequestLocale(locale);

	// Получаем все проекты через ISR
	const projects = await getAllPortfolio(locale);

	const pageUrl = locale === 'ua' ? `${SITE_URL}/portfolio` : `${SITE_URL}/en/portfolio`;
	const breadcrumbJsonLd = {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{ '@type': 'ListItem', position: 1, name: locale === 'ua' ? 'Головна' : 'Home', item: SITE_URL },
			{ '@type': 'ListItem', position: 2, name: locale === 'ua' ? 'Портфоліо' : 'Portfolio', item: pageUrl },
		],
	};

	return (
		<Fragment>
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
			<PortfolioPage locale={locale} initialProjects={projects} />
		</Fragment>
	);
}
