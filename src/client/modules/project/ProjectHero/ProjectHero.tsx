'use client';

import { JSX } from 'react';
import { useTranslations } from 'next-intl';
import Breadcrumbs from '@/client/components/Breadcrumbs/Breadcrumbs';
import PageHero from '@/client/components/PageHero/PageHero';
import ArrowButton from '@/client/components/ArrowButton/ArrowButton';
import type { CardPortfolio } from '@/client/lib/cards';

interface ProjectHeroProps {
	project: CardPortfolio;
	locale: string;
}

// Шапка проєкту — PageHero (назва, опис, теги, «Відвідати сайт»); обкладинка — у блоці тексту (ProjectContent)
export default function ProjectHero({ project, locale }: ProjectHeroProps): JSX.Element {
	const t = useTranslations('ProjectDetail');

	const formattedDate = new Date(project.projectDate).toLocaleDateString(locale === 'en' ? 'en-US' : 'uk-UA', {
		year: 'numeric',
		month: 'long'
	});

	const tags = [t(`badges.${project.service}`), `${t('client')}: ${project.client}`, formattedDate];

	return (
		<PageHero
			className="project-hero"
			title={project.title}
			subtitle={project.shortDescription}
			breadcrumbs={<Breadcrumbs chapter="portfolio" slug={project.title} />}
			actions={
				<>
					{project.projectUrl && (
						<ArrowButton href={project.projectUrl} external size="lg">
							{t('visitWebsite')}
						</ArrowButton>
					)}
					<ul className="page-hero__tags">
						{tags.map((tag) => (
							<li key={tag} className="page-hero__tag glass">
								{tag}
							</li>
						))}
					</ul>
				</>
			}
		/>
	);
}
