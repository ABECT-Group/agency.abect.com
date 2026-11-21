'use client';

import { JSX, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/client/i18n/navigation';
import type { Category } from '@/payload-types';
import type { CardPost } from '@/client/lib/cards';
import BlogFilter from '../BlogFilter/BlogFilter';
import BlogList from '@/client/components/BlogList/BlogList';
import Breadcrumbs from '@/client/components/Breadcrumbs/Breadcrumbs';
import PageHero from '@/client/components/PageHero/PageHero';
import './BlogPage.scss';

interface BlogPageProps {
	locale: string;
	posts: CardPost[];           // Статті для відображення (всі або категорії)
	allPosts?: CardPost[];       // Всі статті для підрахунку (опціонально)
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
			const catSlug = post.category?.slug ?? null;
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
		// <main> — головний вміст сторінки (landmark для скрінрідерів; flex-колонка, як body — розкладка та сама)
		<main className="page-main">
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

					{/* Фільтр ліворуч (SideFilter) + список статей */}
					<div className="list-layout">
						{/* Sidebar with filter */}
						<BlogFilter
							activeCategory={currentCategory?.slug}
							categories={categories}
							counts={filterCounts}
						/>

						{/* Content */}
						<div className="list-layout__content">
							{/* If there are posts */}
							{posts.length > 0 ? (
								<>
									<BlogList posts={posts} locale={locale} startRows={2} />

									{/* Stats Footer */}
									<footer className="list-stats">
										<p>{t('showingResults', { count: posts.length })}</p>
										{currentCategory && (
											<Link href="/blog" className="pill-btn pill-btn--outline">
												{t('viewAllButton')}
											</Link>
										)}
									</footer>
								</>
							) : (
								/* Empty State */
								<div className="list-empty glass">
									<h2>{t('noResults')}</h2>
									<p>{t('noResultsDescription')}</p>
									<Link href="/blog" className="pill-btn pill-btn--gradient">
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
		</main>
	);
}
