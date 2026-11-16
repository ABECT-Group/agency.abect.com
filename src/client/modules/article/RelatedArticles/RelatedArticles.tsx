'use client';

import { JSX } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/client/i18n/navigation';
import type { CardPost } from '@/client/lib/cards';
import BlogList from '@/client/components/BlogList/BlogList';
import './RelatedArticles.scss';

interface RelatedArticlesProps {
	posts: CardPost[];
	locale: string;
}

export default function RelatedArticles({ posts, locale }: RelatedArticlesProps): JSX.Element | null {
	const t = useTranslations('ArticleDetail.related');

	if (!posts || posts.length === 0) {
		return null;
	}

	return (
		<section className="related-articles">
			{/* Контейнер — як у решти секцій: без нього сітка карток тягнулась від краю до краю екрана */}
			<div className="container container--design">
				<header className="related-articles__header">
					<h2 className="related-articles__title">{t('title')}</h2>
					<p className="related-articles__subtitle">{t('subtitle')}</p>
				</header>

				<BlogList posts={posts} locale={locale} startRows={3} />

				<footer className="related-articles__footer">
					<Link href="/blog" className="cta cta-secondary">
						{t('viewAll')}
					</Link>
				</footer>
			</div>
		</section>
	);
}
