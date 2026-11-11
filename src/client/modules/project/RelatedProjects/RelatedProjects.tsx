'use client';

import { JSX } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/client/i18n/navigation';
import type { Portfolio } from '@/payload-types';
import PortfolioList from '@/client/components/PortfolioList/PortfolioList';
import SectionHeading from '@/client/components/SectionHeading/SectionHeading';
import './RelatedProjects.scss';

interface RelatedProjectsProps {
	projects: Portfolio[];
	locale: string;
}

// «Схожі проєкти» — заголовок нового дизайну з посиланням праворуч і картки проєктів
export default function RelatedProjects({ projects, locale }: RelatedProjectsProps): JSX.Element | null {
	const t = useTranslations('ProjectDetail.related');

	if (!projects || projects.length === 0) return null;

	return (
		<section className="related-projects" aria-labelledby="related-projects-title">
			<div className="container container--design">
				<SectionHeading
					id="related-projects-title"
					size="md"
					title={t('title')}
					subtitle={t('subtitle')}
					aside={
						<Link href="/portfolio" className="pill-btn pill-btn--outline">
							{t('viewAll')}
						</Link>
					}
				/>

				<div className="related-projects__list">
					<PortfolioList projects={projects} locale={locale} startRows={3} />
				</div>
			</div>
		</section>
	);
}
