'use client';

import { JSX } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Calendar, Clock, Eye, User } from 'lucide-react';
import Breadcrumbs from '@/client/components/Breadcrumbs/Breadcrumbs';
import type { Post, Media, User as UserType, Category } from '@/payload-types';
import './ArticleHero.scss';

interface ArticleHeroProps {
	post: Post;
	locale: string;
}

export default function ArticleHero({ post, locale }: ArticleHeroProps): JSX.Element {
	const t = useTranslations('ArticleDetail');

	// Отримуємо URL зображення
	const cover = post.cover as Media | null;
	const imageUrl = cover?.url || '/images/placeholder-blog.jpg';

	// Отримуємо автора
	// Автор може прийти лише як id (без доступу до users) або без імені — тоді «ABECT», а не «undefined undefined»
	const author = typeof post.author === 'object' ? (post.author as UserType | null) : null;
	const authorName = [author?.firstName, author?.lastName].filter(Boolean).join(' ') || 'ABECT';

	// Отримуємо категорію
	const category = post.category as Category | null;

	// Форматуємо дату
	const formattedDate = new Date(post.date).toLocaleDateString(
		locale === 'ua' ? 'uk-UA' : 'en-US',
		{ year: 'numeric', month: 'long', day: 'numeric' }
	);

	// Конвертуємо секунди в хвилини
	const readTimeMinutes = Math.ceil(post.readTime / 60);

	return (
		<section className="article-hero">
			<div className="container">
				<div className="article-hero__wrapper">
					<Breadcrumbs
						chapter='blog'
						categorySlug={category?.slug}
						categoryName={category?.name}
						slug={post.title}
					/>

					{/* Hero Content */}
					<div className="article-hero__content">
						{/* Cover Image */}
						<div className="article-hero__image">
							<Image
								src={imageUrl}
								alt={post.title}
								width={1200}
								height={600}
								priority
								sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
								className="article-hero__image--img"
							/>
						</div>

						{/* Hero Info */}
						<div className="article-hero__info">
							{/* Meta badges */}
							<div className="article-hero__meta">
								{category && (
									<span className="article-hero__category">
										{category.name}
									</span>
								)}
								{post.featured && (
									<span className="article-hero__featured" title={t('featured')}>
										★ {t('featured')}
									</span>
								)}
							</div>

							{/* Title */}
							<h1 className="article-hero__title">{post.title}</h1>

							{/* Description */}
							<p className="article-hero__description">{post.description}</p>

							{/* Tags */}
							{post.tags && post.tags.length > 0 && (
								<div className="article-hero__tags">
									{post.tags.map((tagObj, index) => (
										<span key={index} className="article-hero__tag">
											#{tagObj.tag}
										</span>
									))}
								</div>
							)}

							{/* Details bar */}
							<div className="article-hero__details">
								<div className="article-hero__detail">
									<User size={16} />
									<span className="article-hero__detail-value">{authorName}</span>
								</div>

								<div className="article-hero__detail">
									<Calendar size={16} />
									<span className="article-hero__detail-value">
										<time dateTime={post.date}>{formattedDate}</time>
									</span>
								</div>

								<div className="article-hero__detail">
									<Clock size={16} />
									<span className="article-hero__detail-value">
										{readTimeMinutes} {t('minRead')}
									</span>
								</div>

								{post.viewCount !== null && post.viewCount !== undefined && (
									<div className="article-hero__detail">
										<Eye size={16} />
										<span className="article-hero__detail-value">
											{post.viewCount} {t('views')}
										</span>
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
