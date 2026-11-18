'use client';

import { JSX } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/client/i18n/navigation';
import type { CardPost } from '@/client/lib/cards';
import BlogList from '@/client/components/BlogList/BlogList';
import SectionHeading from '@/client/components/SectionHeading/SectionHeading';
import '@/client/modules/project/RelatedProjects/RelatedProjects.scss';

interface RelatedArticlesProps {
	posts: CardPost[];
	locale: string;
}

// «Схожі статті» — як «Схожі проєкти»: заголовок нового дизайну з посиланням праворуч і картки
export default function RelatedArticles({ posts, locale }: RelatedArticlesProps): JSX.Element | null {
	const t = useTranslations('ArticleDetail.related');

	if (!posts || posts.length === 0) return null;

	return (
		<section className="related-projects" aria-labelledby="related-articles-title">
			<div className="container container--design">
				<SectionHeading
					id="related-articles-title"
					size="md"
					title={t('title')}
					subtitle={t('subtitle')}
					aside={
						<Link href="/blog" className="pill-btn pill-btn--outline">
							{t('viewAll')}
						</Link>
					}
				/>

				<div className="related-projects__list">
					<BlogList posts={posts} locale={locale} startRows={3} />
				</div>
			</div>
		</section>
	);
}
