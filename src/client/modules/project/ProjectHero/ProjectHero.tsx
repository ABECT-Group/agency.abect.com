'use client';

import { JSX } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import Breadcrumbs from '@/client/components/Breadcrumbs/Breadcrumbs';
import PageHero from '@/client/components/PageHero/PageHero';
import ArrowButton from '@/client/components/ArrowButton/ArrowButton';
import type { Portfolio, Media } from '@/payload-types';
import './ProjectHero.scss';

interface ProjectHeroProps {
	project: Portfolio;
	locale: string;
}

// Шапка проєкту — PageHero (назва, опис, теги, «Відвідати сайт») + велика обкладинка під нею
export default function ProjectHero({ project, locale }: ProjectHeroProps): JSX.Element {
	const t = useTranslations('ProjectDetail');

	const ogImage = project.seo.ogImage as Media | null;
	const imageUrl = ogImage?.url || '/images/placeholder-project.jpg';

	const formattedDate = new Date(project.projectDate).toLocaleDateString(locale === 'en' ? 'en-US' : 'uk-UA', {
		year: 'numeric',
		month: 'long'
	});

	const tags = [t(`badges.${project.service}`), `${t('client')}: ${project.client}`, formattedDate];

	return (
		<>
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

			<section className="project-cover">
				<div className="container container--design">
					<figure className="project-cover__frame" data-reveal="">
						<Image
							src={imageUrl}
							alt={project.title}
							width={ogImage?.width || 1600}
							height={ogImage?.height || 1000}
							priority
							sizes="(max-width: 1440px) 100vw, 1440px"
						/>
					</figure>
				</div>
			</section>
		</>
	);
}
