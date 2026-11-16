'use client';

import { JSX } from 'react';
import Image from 'next/image';
import { Link } from '@/client/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Clock } from 'lucide-react';
import type { CardPost } from '@/client/lib/cards';
import './BlogCard.scss';

interface BlogCardProps {
	post: CardPost;
	locale: string;
}

export default function BlogCard({ post, locale }: BlogCardProps): JSX.Element {
	const t = useTranslations('Common.BlogCard');

	// Отримуємо URL зображення
	const cover = post.cover;
	const imageUrl = cover?.url || '/images/placeholder-blog.jpg';

	// Отримуємо категорію та автора
	const category = post.category;
	const author = post.author;

	// Формуємо URL статті: /blog/[category]/[slug]
	const categorySlug = category?.slug || 'uncategorized';
	const articleUrl = `/blog/${categorySlug}/${post.slug}`;

	// Форматуємо дату
	const formattedDate = new Date(post.date).toLocaleDateString(locale, {
		year: 'numeric',
		month: 'long'
	});

	// Конвертуємо секунди в хвилини
	const readTimeMinutes = Math.ceil(post.readTime / 60);

	return (
		<article
			className="blog-card"
			itemScope
			itemType="https://schema.org/BlogPosting"
		>
			<Link
				href={articleUrl}
				className="blog-card__link"
			>
				{/* Cover Image */}
				<div className="blog-card__image">
					<Image
						src={imageUrl}
						alt={post.title}
						width={600}
						height={400}
						sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
						className="blog-card__img"
						itemProp="image"
					/>
					<div className="blog-card__overlay">
						<span className="blog-card__cta">
							{t('readArticle')} →
						</span>
					</div>
				</div>

				{/* Content */}
				<div className="blog-card__content">
					{/* Meta */}
					<div className="blog-card__meta">
						{category && (
							<span className="blog-card__category" itemProp="keywords">
								{category.name}
							</span>
						)}
						{post.featured && (
							<span className="blog-card__featured" title={t('featured')}>
								★
							</span>
						)}
					</div>

					{/* Title */}
					<h3 className="blog-card__title" itemProp="headline">
						{post.title}
					</h3>

					{/* Description */}
					<p className="blog-card__description" itemProp="description">
						{post.description}
					</p>

					{/* Info bar */}
					<div className="blog-card__info">
						<div className="blog-card__author-date">
							{author && (
								<span className="blog-card__author" itemProp="author">
									{author.firstName} {author.lastName}
								</span>
							)}
							<span className="blog-card__date">
								<time dateTime={post.date} itemProp="datePublished">
									{formattedDate}
								</time>
							</span>
						</div>
						<span className="blog-card__read-time">
							<Clock size={14} />
							{readTimeMinutes} {t('min')}
						</span>
					</div>
				</div>

				{/* Schema.org meta */}
				<meta itemProp="publisher" content="ABECT" />
				<link itemProp="url" href={`/${locale}${articleUrl}`} />
			</Link>
		</article>
	);
}
