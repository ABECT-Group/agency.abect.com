import { setRequestLocale } from 'next-intl/server';
import Home from '@/client/modules/home/Home';
import { Metadata } from 'next';
import { Fragment } from 'react';
import { SITE_URL } from '@/client/config/site';

type Params = {
	params: Promise<{
		locale: string;
	}>;
};
// Нічого не пререндеримо на білді: у Docker-білді немає БД, і сторінки «застигали» б порожніми.
// Нічого не пререндеримо на білді: у Docker-білді немає БД, і сторінки «застигали» б порожніми.
// Кожна сторінка рендериться при першому запиті й кешується до revalidateTag('all') (ISS-022).
export function generateStaticParams() {
	return [];
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
	const { locale } = await params;
	const isUa = locale === 'ua';

	const title = isUa
		? 'Розробка сайтів. Запуск реклами | ABECT'
		: 'Website Development. Marketing Launch - ABECT';

	const description = isUa
		? 'ABECT професійна розробка сайтів для бізнесу. Ми створюємо адаптивні, швидкі та SEO-оптимізовані сайти для вашого успіху в інтернеті. З нами Ваш бізнес вийде на новий рівень!'
		: 'ABECT provides professional website development for businesses. We build fast, responsive, and SEO-optimized websites to help your brand grow online. Take your business to the next level with us!';

	const keywords = isUa
		? 'сайт, Next.js, розробка сайтів, створення сайтів, веб-дизайн, SEO оптимізація, бізнес сайт, корпоративний сайт, інтернет-магазин, landing page, WordPress, React'
		: 'website, Next.js, web development, website creation, web design, SEO optimization, business website, corporate website, online store, landing page, WordPress, React';

	const fullUrl = locale === "ua" ? `${SITE_URL}` : `${SITE_URL}/${locale}`;
	const ogImage = locale === 'ua' ? `${SITE_URL}/seo/og.jpg` : `${SITE_URL}/seo/en-og.jpg`;

	return {
		title,
		description,
		alternates: {
			canonical: fullUrl,
			languages: {
				'uk-UA': SITE_URL,
				'en-US': `${SITE_URL}/en`,
				'x-default': `${SITE_URL}/en`,
			},
		},
		authors: [{ name: 'Abect', url: SITE_URL }],
		robots: {
			index: true,
			follow: true,
		},
		keywords,
		openGraph: {
			title,
			description,
			url: fullUrl,
			siteName: 'Abect',
			images: [
				{
					url: ogImage,
					width: 1200,
					height: 630,
				},
			],
			locale: locale === 'ua' ? 'uk_UA' : 'en_US',
			type: 'website',
		},
		twitter: {
			card: 'summary_large_image',
			title,
			description,
			images: [ogImage],
		}
	};
}

export default async function HomePage({ params }: Params) {
	const { locale } = await params;
	const isUa = locale === 'ua';

	setRequestLocale(locale);

	const orgJsonLd = {
		'@context': 'https://schema.org',
		'@type': ['Organization', 'ProfessionalService'],
		name: 'ABECT',
		url: SITE_URL,
		logo: `${SITE_URL}/seo/og.jpg`,
		email: 'support@agency.abect.com',
		telephone: '+380980275819',
		priceRange: '₴₴',
		serviceType: 'Web Development',
		areaServed: ['UA', 'PL', 'DE', 'CZ'],
		contactPoint: {
			'@type': 'ContactPoint',
			telephone: '+380980275819',
			contactType: 'customer service',
			availableLanguage: ['Ukrainian', 'English'],
		},
		address: { '@type': 'PostalAddress', addressCountry: 'UA' },
		sameAs: ['https://t.me/abect_agency'],
	};

	const websiteJsonLd = {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: 'ABECT',
		url: SITE_URL,
		description: isUa
			? 'Професійна розробка сайтів для бізнесу'
			: 'Professional website development for business',
		inLanguage: isUa ? 'uk-UA' : 'en-US',
	};

	return (
		<Fragment>
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
			<Home locale={locale} />
		</Fragment>
	);
}