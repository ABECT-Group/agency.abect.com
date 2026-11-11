import { JSX } from 'react';
import { getTranslations } from 'next-intl/server';
import { getFeaturedPortfolio } from '@/client/lib/portfolio';
import SectionHeading from '@/client/components/SectionHeading/SectionHeading';
import ArrowButton from '@/client/components/ArrowButton/ArrowButton';
import PortfolioSlider, { type PortfolioSlide } from './PortfolioSlider';
import './Portfolio.scss';

interface PortfolioProps {
	locale: string;
}

// «Наші роботи» — Figma «ABECT», Desktop 6 (166:226 …). Проєкти — featured з CMS, слайдер.
export default async function Portfolio({ locale }: PortfolioProps): Promise<JSX.Element | null> {
	const t = await getTranslations('HomePage.Portfolio');
	const projects = await getFeaturedPortfolio(locale);

	if (projects.length === 0) return null;

	// У клієнтський слайдер — лише потрібні поля
	const slides: PortfolioSlide[] = projects.map((project) => ({
		id: String(project.id),
		slug: project.slug,
		title: project.title,
		image:
			typeof project.seo.ogImage === 'object' && project.seo.ogImage?.url
				? project.seo.ogImage.url
				: '/images/placeholder-project.jpg'
	}));

	return (
		<section className="portfolio" id="portfolio" aria-labelledby="portfolio-title">
			<div className="portfolio__bg" aria-hidden="true" />
			<div className="container container--design">
				<SectionHeading
					id="portfolio-title"
					title={t('title')}
					subtitle={t('subtitle')}
					aside={<ArrowButton>{t('orderButton')}</ArrowButton>}
				/>

				<PortfolioSlider slides={slides} />
			</div>
		</section>
	);
}
