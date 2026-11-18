'use client';

import { JSX } from 'react';
import Image from 'next/image';
import { Link } from '@/client/i18n/navigation';
import { useTranslations } from 'next-intl';
import type { CardPost } from '@/client/lib/cards';
// Картка статті — та сама, що картка проєкту (рішення розробника 2026-11-18): стилі PortfolioCard
import '../PortfolioCard/PortfolioCard.scss';
import './BlogCard.scss';

interface BlogCardProps {
	post: CardPost;
	locale: string;
	/** Обкладинка видима одразу (перший ряд) — завантажувати пріоритетно (LCP) */
	eager?: boolean;
}

// Картка статті у стилі картки проєкту: обкладинка, категорія, назва, опис, дата й час читання
export default function BlogCard({ post, locale, eager = false }: BlogCardProps): JSX.Element {
	const t = useTranslations('Common.BlogCard');

	const imageUrl = post.cover?.url || '/images/placeholder-blog.jpg';
	const category = post.category;
	const articleUrl = `/blog/${category?.slug || 'uncategorized'}/${post.slug}`;

	// Локаль маршруту `ua` — не код мови: для дати потрібна `uk-UA` (ISS-059)
	const formattedDate = new Date(post.date).toLocaleDateString(locale === 'en' ? 'en-US' : 'uk-UA', {
		year: 'numeric',
		month: 'long'
	});
	const readTimeMinutes = Math.ceil(post.readTime / 60);

	return (
		<article className="portfolio-card blog-card" itemScope itemType="https://schema.org/BlogPosting">
			<Link href={articleUrl} className="portfolio-card__link">
				<span className="portfolio-card__image">
					<Image
						src={imageUrl}
						alt={post.title}
						fill
						sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 420px"
						itemProp="image"
						priority={eager}
					/>
				</span>

				<span className="portfolio-card__body">
					<span className="portfolio-card__meta">
						{category && (
							<span className="portfolio-card__badge" itemProp="articleSection">
								{category.name}
							</span>
						)}
						{post.featured && (
							<span className="portfolio-card__featured" title={t('featured')}>
								★
							</span>
						)}
					</span>

					<h3 className="portfolio-card__title" itemProp="headline">
						{post.title}
					</h3>

					<span className="portfolio-card__description" itemProp="description">
						{post.description}
					</span>

					<span className="portfolio-card__info">
						<time dateTime={post.date} itemProp="datePublished">
							{formattedDate}
						</time>
						<span>
							{readTimeMinutes} {t('min')}
						</span>
					</span>
				</span>

				<meta itemProp="publisher" content="ABECT" />
			</Link>
		</article>
	);
}
