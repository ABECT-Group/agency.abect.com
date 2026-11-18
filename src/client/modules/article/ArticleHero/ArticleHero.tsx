'use client';

import { JSX } from 'react';
import { useTranslations } from 'next-intl';
import Breadcrumbs from '@/client/components/Breadcrumbs/Breadcrumbs';
import PageHero from '@/client/components/PageHero/PageHero';
import type { CardPost } from '@/client/lib/cards';

interface ArticleHeroProps {
	post: CardPost;
	locale: string;
}

// Шапка статті — як у кейсу портфоліо (ProjectHero): PageHero (крихти, назва, опис, теги); обкладинка — у блоці тексту
export default function ArticleHero({ post, locale }: ArticleHeroProps): JSX.Element {
	const t = useTranslations('ArticleDetail');

	const category = post.category;

	const formattedDate = new Date(post.date).toLocaleDateString(locale === 'en' ? 'en-US' : 'uk-UA', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
	const readTimeMinutes = Math.ceil(post.readTime / 60);

	const tags = [category?.name, formattedDate, `${readTimeMinutes} ${t('minRead')}`].filter(
		(tag): tag is string => Boolean(tag)
	);

	return (
		<PageHero
			className="article-hero"
			title={post.title}
			subtitle={post.description}
			breadcrumbs={
				<Breadcrumbs chapter="blog" categorySlug={category?.slug} categoryName={category?.name} slug={post.title} />
			}
			actions={
				<ul className="page-hero__tags">
					{tags.map((tag) => (
						<li key={tag} className="page-hero__tag glass">
							{tag === formattedDate ? <time dateTime={post.date}>{tag}</time> : tag}
						</li>
					))}
				</ul>
			}
		/>
	);
}
