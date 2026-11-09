import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPortfolioBySlug, getRelatedProjects } from '@/client/lib/portfolio';
import Project from '@/client/modules/project/Project';
import type { Media } from '@/payload-types';
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
		slug: string;
	}>;
};

// SEO Metadata
export async function generateMetadata({ params }: Params): Promise<Metadata> {
	const { locale, slug } = await params;
	const project = await getPortfolioBySlug(slug, locale);

	if (!project) {
		return {
			title: 'Project Not Found',
			description: 'The requested project could not be found'
		};
	}

	const ogImage = project.seo.ogImage as Media | null;
	const imageUrl = ogImage?.url || (locale === 'ua' ? `${SITE_URL}/seo/portfolio-og.jpg` : `${SITE_URL}/seo/en-portfolio-og.jpg`);

	const fullUrl =
		locale === 'ua'
			? `${SITE_URL}/portfolio/${slug}`
			: `${SITE_URL}/${locale}/portfolio/${slug}`;

	return {
		title: project.seo.metaTitle,
		description: project.seo.metaDescription,
		keywords: project.seo.metaKeywords,
		alternates: {
			canonical: fullUrl,
			languages: {
				'uk-UA': `${SITE_URL}/portfolio/${slug}`,
				'en-US': `${SITE_URL}/en/portfolio/${slug}`,
				'x-default': `${SITE_URL}/en/portfolio/${slug}`
			}
		},
		robots: {
			index: true,
			follow: true,
			'max-image-preview': 'large',
			'max-snippet': -1,
			'max-video-preview': -1
		},
		openGraph: {
			title: project.seo.metaTitle,
			description: project.seo.metaDescription,
			url: fullUrl,
			siteName: 'ABECT',
			images: [
				{
					url: imageUrl,
					width: 1200,
					height: 630,
					alt: project.title
				}
			],
			locale: locale === 'ua' ? 'uk_UA' : 'en_US',
			type: 'article',
			publishedTime: project.projectDate,
			authors: ['ABECT']
		},
		twitter: {
			card: 'summary_large_image',
			title: project.seo.metaTitle,
			description: project.seo.metaDescription,
			images: [imageUrl]
		}
	};
}

// Server Component
export default async function ProjectPage({ params }: Params) {
	const { locale, slug } = await params;

	setRequestLocale(locale);

	// Отримуємо проект
	const project = await getPortfolioBySlug(slug, locale);

	if (!project) {
		notFound();
	}

	// Отримуємо схожі проекти
	const relatedProjects = await getRelatedProjects(project.id, project.service, locale, 3);

	return (
		<>
			{/* JSON-LD Schema.org */}
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify({
						'@context': 'https://schema.org',
						'@type': 'CreativeWork',
						headline: project.title,
						description: project.shortDescription,
						image: (project.seo.ogImage as Media | null)?.url || (locale === 'ua' ? `${SITE_URL}/seo/portfolio-og.jpg` : `${SITE_URL}/seo/en-portfolio-og.jpg`),
						author: {
							'@type': 'Organization',
							name: 'ABECT',
							url: SITE_URL
						},
						publisher: {
							'@type': 'Organization',
							name: 'ABECT',
							logo: {
								'@type': 'ImageObject',
								url: `${SITE_URL}/logo.png`
							}
						},
						datePublished: project.projectDate,
						dateModified: project.updatedAt,
						url: locale === 'ua'
							? `${SITE_URL}/portfolio/${slug}`
							: `${SITE_URL}/${locale}/portfolio/${slug}`
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
								name: locale === 'ua' ? 'Портфоліо' : 'Portfolio',
								item: locale === 'ua'
									? `${SITE_URL}/portfolio`
									: `${SITE_URL}/${locale}/portfolio`
							},
							{
								'@type': 'ListItem',
								position: 3,
								name: project.title,
								item: locale === 'ua'
									? `${SITE_URL}/portfolio/${slug}`
									: `${SITE_URL}/${locale}/portfolio/${slug}`
							}
						]
					})
				}}
			/>

			<Project project={project} relatedProjects={relatedProjects} locale={locale} />
		</>
	);
}
