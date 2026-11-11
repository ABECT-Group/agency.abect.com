'use client';

import { JSX, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/client/i18n/navigation';
import type { Post, Category } from '@/payload-types';
import BlogFilter from '../BlogFilter/BlogFilter';
import BlogList from '@/client/components/BlogList/BlogList';
import Breadcrumbs from '@/client/components/Breadcrumbs/Breadcrumbs';
import PageHero from '@/client/components/PageHero/PageHero';
import './BlogPage.scss';

interface BlogPageProps {
	locale: string;
	posts: Post[];           // Статті для відображення (всі або категорії)
	allPosts?: Post[];       // Всі статті для підрахунку (опціонально)
	categories: Category[];
	currentCategory?: Category; // Поточна категорія (undefined = всі)
}

export default function BlogPage({
	locale,
	posts,
	allPosts,
	categories,
	currentCategory
}: BlogPageProps): JSX.Element {
	const t = useTranslations('BlogPage');

	// Використовуємо allPosts для підрахунку, якщо передано
	const postsForCounting = allPosts || posts;

	// Підрахунок для кожної категорії
	const filterCounts = useMemo(() => {
		const counts: Record<string, number> = { all: 0 };

		// Ініціалізуємо лічильники для всіх категорій
		categories.forEach(cat => {
			counts[cat.slug] = 0;
		});

		// Підраховуємо статті по категоріях
		postsForCounting.forEach(post => {
			counts.all++;
			const catSlug = typeof post.category === 'object' ? post.category.slug : null;
			if (catSlug && counts[catSlug] !== undefined) {
				counts[catSlug]++;
			}
		});

		return counts;
	}, [postsForCounting, categories]);

	// Заголовок та опис
	const pageTitle = currentCategory ? currentCategory.name : t('title');
	const pageSubtitle = currentCategory ? currentCategory.description : t('subtitle');

	return (
		<>
			<PageHero
				title={pageTitle}
				subtitle={pageSubtitle}
				breadcrumbs={<Breadcrumbs chapter="blog" slug={currentCategory ? currentCategory.name : undefined} />}
			/>
			<section
				className="blog-page"
				itemScope
				itemType="https://schema.org/Blog"
			>
				{/* Шапка — назва й опис сторінки для schema.org (видимі — у PageHero) */}
				<meta itemProp="name" content={pageTitle} />
				<meta itemProp="description" content={pageSubtitle} />
				<div className="container container--design">

					{/* Main Layout: Filter (1fr) + Content (3fr) */}
					<div className="blog-page__layout">
						{/* Sidebar with filter */}
						<BlogFilter
							activeCategory={currentCategory?.slug}
							categories={categories}
							counts={filterCounts}
						/>

						{/* Content */}
						<div className="blog-page__content">
							{/* If there are posts */}
							{posts.length > 0 ? (
								<>
									<BlogList posts={posts} locale={locale} startRows={2} />

									{/* Stats Footer */}
									<footer className="blog-page__stats">
										<p>
											{t('showingResults', { count: posts.length })}
										</p>
										{currentCategory && (
											<Link
												href="/blog"
												className="blog-page__reset-btn"
											>
												{t('viewAllButton')}
											</Link>
										)}
									</footer>
								</>
							) : (
								/* Empty State */
								<div className="blog-page__empty">
									<h3>{t('noResults')}</h3>
									<p>{t('noResultsDescription')}</p>
									<Link href="/blog" className="cta">
										{t('viewAllButton')}
									</Link>
								</div>
							)}
						</div>
					</div>

					{/* Schema.org meta */}
					<meta itemProp="numberOfItems" content={String(posts.length)} />
				</div>
			</section>
		</>
	);
}
