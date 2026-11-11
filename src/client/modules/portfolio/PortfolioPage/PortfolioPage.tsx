'use client';

import { JSX, useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type { Portfolio } from '@/payload-types';
import PortfolioFilter, { FilterType } from '../PortfolioFilter/PortfolioFilter';
import PortfolioList from '@/client/components/PortfolioList/PortfolioList';
import Breadcrumbs from '@/client/components/Breadcrumbs/Breadcrumbs';
import PageHero from '@/client/components/PageHero/PageHero';
import ScrollReveal from '@/client/components/ScrollReveal/ScrollReveal';
import './PortfolioPage.scss';

interface PortfolioPageProps {
	locale: string;
	initialProjects: Portfolio[];
}

// «Портфоліо»: PageHero → фільтр за типом (ChipBar, на клієнті) → сітка карток проєктів
export default function PortfolioPage({ locale, initialProjects }: PortfolioPageProps): JSX.Element {
	const t = useTranslations('PortfolioPage');
	const [activeFilter, setActiveFilter] = useState<FilterType>('all');

	const filteredProjects = useMemo(
		() => (activeFilter === 'all' ? initialProjects : initialProjects.filter((project) => project.service === activeFilter)),
		[activeFilter, initialProjects]
	);

	const filterCounts = useMemo(
		() => ({
			all: initialProjects.length,
			design: initialProjects.filter((p) => p.service === 'design').length,
			website: initialProjects.filter((p) => p.service === 'website').length,
			promotion: initialProjects.filter((p) => p.service === 'promotion').length
		}),
		[initialProjects]
	);

	return (
		<>
			<PageHero title={t('title')} subtitle={t('subtitle')} breadcrumbs={<Breadcrumbs chapter="portfolio" />} />
			<section className="portfolio-page" itemScope itemType="https://schema.org/CollectionPage">
				{/* Назва й опис сторінки для schema.org (видимі — у PageHero) */}
				<meta itemProp="name" content={t('title')} />
				<meta itemProp="description" content={t('subtitle')} />
				<meta itemProp="numberOfItems" content={String(filteredProjects.length)} />

				<div className="container container--design">
					<div className="list-toolbar">
						<PortfolioFilter activeFilter={activeFilter} onFilterChange={setActiveFilter} counts={filterCounts} />
					</div>

					{filteredProjects.length > 0 ? (
						<>
							<PortfolioList projects={filteredProjects} locale={locale} startRows={3} eagerFirstRow />

							<footer className="list-stats">
								<p>{t('showingResults', { count: filteredProjects.length })}</p>
								{activeFilter !== 'all' && (
									<button type="button" className="pill-btn pill-btn--outline" onClick={() => setActiveFilter('all')}>
										{t('viewAllButton')}
									</button>
								)}
							</footer>
						</>
					) : (
						<div className="list-empty glass">
							<h2>{t('noResults')}</h2>
							<p>{t('noResultsDescription')}</p>
							<button type="button" className="pill-btn pill-btn--gradient" onClick={() => setActiveFilter('all')}>
								{t('viewAllButton')}
							</button>
						</div>
					)}
				</div>
			</section>
			<ScrollReveal />
		</>
	);
}
