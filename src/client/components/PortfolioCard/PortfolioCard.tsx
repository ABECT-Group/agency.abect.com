'use client';

import { JSX } from 'react';
import Image from 'next/image';
import { Link } from '@/client/i18n/navigation';
import { useTranslations } from 'next-intl';
import type { Portfolio } from '@/payload-types';
import './PortfolioCard.scss';

interface PortfolioCardProps {
	project: Portfolio;
	locale: string;
	/** Обкладинка видима одразу (перший ряд на сторінці портфоліо) — завантажувати пріоритетно (LCP) */
	eager?: boolean;
}

// Картка проєкту — стиль «Наших робіт» головної (обкладинка + підпис), плюс тег послуги, опис, клієнт і дата
export default function PortfolioCard({ project, locale, eager = false }: PortfolioCardProps): JSX.Element {
	const t = useTranslations('Common.PortfolioCard');

	const imageUrl =
		typeof project.seo.ogImage === 'object' && project.seo.ogImage !== null
			? project.seo.ogImage.url || '/images/placeholder-project.jpg'
			: '/images/placeholder-project.jpg';

	const formattedDate = new Date(project.projectDate).toLocaleDateString(locale === 'en' ? 'en-US' : 'uk-UA', {
		year: 'numeric',
		month: 'long'
	});

	return (
		<article className="portfolio-card" itemScope itemType="https://schema.org/CreativeWork">
			<Link
				href={`/portfolio/${project.slug}`}
				className="portfolio-card__link"
				aria-label={`${t('viewCase')}: ${project.title}`}
			>
				<span className="portfolio-card__image">
					<Image
						src={imageUrl}
						alt={project.title}
						fill
						sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 420px"
						itemProp="image"
						priority={eager}
					/>
				</span>

				<span className="portfolio-card__body">
					<span className="portfolio-card__meta">
						<span className="portfolio-card__badge" itemProp="keywords">
							{t(`badges.${project.service}`)}
						</span>
						{project.featured && (
							<span className="portfolio-card__featured" title={t('featured')}>
								★
							</span>
						)}
					</span>

					<h3 className="portfolio-card__title" itemProp="name">
						{project.title}
					</h3>

					<span className="portfolio-card__description" itemProp="description">
						{project.shortDescription}
					</span>

					<span className="portfolio-card__info">
						<span>{project.client}</span>
						<time dateTime={project.projectDate} itemProp="datePublished">
							{formattedDate}
						</time>
					</span>
				</span>

				<meta itemProp="author" content="ABECT" />
			</Link>
		</article>
	);
}
