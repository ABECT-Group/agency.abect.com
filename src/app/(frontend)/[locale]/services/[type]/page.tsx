import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { getAllServices, getAllServiceTypes, getServiceTypeBySlug, getServicesByType } from '@/client/lib/services';
import ServicesPage from '@/client/modules/services/ServicesPage/ServicesPage';
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
		type: string;
	}>;
};

// SEO Metadata
export async function generateMetadata({ params }: Params): Promise<Metadata> {
	const { locale, type: typeSlug } = await params;
	const serviceType = await getServiceTypeBySlug(typeSlug, locale);

	if (!serviceType) {
		return {
			title: 'Type Not Found',
			description: 'The requested service type could not be found'
		};
	}

	const title = serviceType.seo?.metaTitle || serviceType.name;
	const description = serviceType.seo?.metaDescription || serviceType.description;
	const keywords = serviceType.seo?.metaKeywords || serviceType.name;

	const imageUrl = locale === 'ua' ? `${SITE_URL}/seo/og.jpg` : `${SITE_URL}/seo/en-og.jpg`;

	const fullUrl =
		locale === 'ua'
			? `${SITE_URL}/services/${typeSlug}`
			: `${SITE_URL}/${locale}/services/${typeSlug}`;

	return {
		title,
		description,
		keywords,
		alternates: {
			canonical: fullUrl,
			languages: {
				'uk-UA': `${SITE_URL}/services/${typeSlug}`,
				'en-US': `${SITE_URL}/en/services/${typeSlug}`,
				'x-default': `${SITE_URL}/en/services/${typeSlug}`
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
					alt: serviceType.name
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
export default async function ServiceTypePage({ params }: Params) {
	const { locale, type: typeSlug } = await params;

	setRequestLocale(locale);

	// Get the service type
	const serviceType = await getServiceTypeBySlug(typeSlug, locale);

	if (!serviceType) {
		notFound();
	}

	// Get services of this type, all services (for counting), and all types for filter
	const [services, allServices, serviceTypes] = await Promise.all([
		getServicesByType(typeSlug, locale),
		getAllServices(locale),
		getAllServiceTypes(locale)
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
						name: serviceType.name,
						description: serviceType.description,
						url: locale === 'ua'
							? `${SITE_URL}/services/${typeSlug}`
							: `${SITE_URL}/${locale}/services/${typeSlug}`,
						isPartOf: {
							'@type': 'WebSite',
							name: 'ABECT',
							url: locale === 'ua'
								? `${SITE_URL}/services`
								: `${SITE_URL}/${locale}/services`
						},
						numberOfItems: services.length
					})
				}}
			/>

			<ServicesPage
				locale={locale}
				services={services}
				allServices={allServices}
				serviceTypes={serviceTypes}
				currentType={serviceType}
			/>
		</>
	);
}
