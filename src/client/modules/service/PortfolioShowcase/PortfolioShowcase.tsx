import { JSX } from 'react';
import { Link } from '@/client/i18n/navigation';
import { useTranslations } from 'next-intl';
import PortfolioList from '@/client/components/PortfolioList/PortfolioList';
import SectionHeading from '@/client/components/SectionHeading/SectionHeading';
import type { Portfolio } from '@/payload-types';
import './PortfolioShowcase.scss';

interface PortfolioShowcaseProps {
	projects: (string | number | Portfolio)[];
	locale: string;
}

// «Приклади робіт» на сторінці послуги — заголовок нового дизайну + список проєктів (PortfolioList)
export default function PortfolioShowcase({ projects, locale }: PortfolioShowcaseProps): JSX.Element {
	const t = useTranslations('ServiceDetail.portfolio');

	// Лише повноцінні об'єкти Portfolio (не ID)
	const validProjects = projects.filter((project): project is Portfolio => typeof project === 'object');

	if (validProjects.length === 0) return <></>;

	return (
		<section className="portfolio-showcase" aria-labelledby="portfolio-showcase-title">
			<div className="container container--design">
				<SectionHeading
					id="portfolio-showcase-title"
					size="md"
					title={t('title')}
					subtitle={t('subtitle')}
					aside={
						<Link href="/portfolio" className="pill-btn pill-btn--outline">
							{t('viewAll')}
						</Link>
					}
				/>

				<div className="portfolio-showcase__list">
					<PortfolioList projects={validProjects} locale={locale} startRows={3} />
				</div>
			</div>
		</section>
	);
}
