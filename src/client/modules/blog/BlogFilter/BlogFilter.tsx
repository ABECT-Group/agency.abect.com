'use client';

import { JSX } from 'react';
import { useTranslations } from 'next-intl';
import type { Category } from '@/payload-types';
import SideFilter from '@/client/components/SideFilter/SideFilter';

interface BlogFilterProps {
	activeCategory?: string; // slug категорії або undefined для "all"
	categories: Category[];
	counts: Record<string, number>;
}

// Категорії блогу — скляна панель ліворуч, як у портфоліо (SideFilter; до 1024px — стрічка над списком).
// Фільтр через URL: /blog і /blog/<категорія>.
export default function BlogFilter({ activeCategory, categories, counts }: BlogFilterProps): JSX.Element {
	const t = useTranslations('BlogPage.filter');

	const items = [
		{ key: 'all', label: t('all'), href: '/blog', count: counts.all || 0, active: !activeCategory },
		...categories.map((category) => ({
			key: category.slug,
			label: category.name,
			href: `/blog/${category.slug}`,
			count: counts[category.slug] || 0,
			active: activeCategory === category.slug
		}))
	];

	return <SideFilter title={t('title')} ariaLabel={t('ariaLabel')} items={items} />;
}
