'use client';

import { JSX } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ExternalLink, Calendar, Eye } from 'lucide-react';
import Breadcrumbs from '@/client/components/Breadcrumbs/Breadcrumbs';
import type { Portfolio, Media } from '@/payload-types';
import './ProjectHero.scss';

interface ProjectHeroProps {
	project: Portfolio;
	locale: string;
}

export default function ProjectHero({ project, locale }: ProjectHeroProps): JSX.Element {
	const t = useTranslations('ProjectDetail');

	// Отримуємо URL зображення
	const ogImage = project.seo.ogImage as Media | null;
	const imageUrl = ogImage?.url || '/images/placeholder-project.jpg';

	// Форматуємо дату
	const formattedDate = new Date(project.projectDate).toLocaleDateString(locale === 'ua' ? 'uk-UA' : 'en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});

	return (
		<section className="project-hero">
			<div className="container">
				<div className="project-hero__wrapper">
					<Breadcrumbs chapter='portfolio' slug={project.title} />

					{/* Hero Content */}
					<div className="project-hero__content">
						{/* Hero Image */}
						<div className="project-hero__image">
							<Image
								src={imageUrl}
								alt={project.title}
								width={1200}
								height={600}
								priority
								sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
								className="project-hero__image--img"
							/>
						</div>

						{/* Hero Info */}
						<div className="project-hero__info">
							{/* Badge */}
							<div className="project-hero__meta">
								<span className={`project-hero__badge project-hero__badge--${project.service}`}>
									{t(`badges.${project.service}`)}
								</span>
								{project.featured && (
									<span className="project-hero__featured" title={t('featured')}>
										★ {t('featured')}
									</span>
								)}
							</div>

							{/* Title */}
							<h1 className="project-hero__title">{project.title}</h1>

							{/* Short Description */}
							<p className="project-hero__description">{project.shortDescription}</p>

							{/* Meta Info Bar */}
							<div className="project-hero__details">
								<div className="project-hero__detail">
									<span className="project-hero__detail-label">{t('client')}:</span>
									<span className="project-hero__detail-value">{project.client}</span>
								</div>

								<div className="project-hero__detail">
									<Calendar size={16} />
									<span className="project-hero__detail-value">
										<time dateTime={project.projectDate}>{formattedDate}</time>
									</span>
								</div>

								{project.viewCount !== null && project.viewCount !== undefined && (
									<div className="project-hero__detail">
										<Eye size={16} />
										<span className="project-hero__detail-value">
											{project.viewCount} {t('views')}
										</span>
									</div>
								)}

								{project.projectUrl && (
									<div className="project-hero__detail">
										<a
											href={project.projectUrl}
											target="_blank"
											rel="noopener noreferrer"
											className="project-hero__link"
										>
											<ExternalLink size={16} />
											{t('visitWebsite')}
										</a>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
