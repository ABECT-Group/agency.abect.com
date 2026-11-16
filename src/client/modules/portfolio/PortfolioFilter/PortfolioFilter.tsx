'use client';

import { JSX } from 'react';
import { useTranslations } from 'next-intl';
import SideFilter from '@/client/components/SideFilter/SideFilter';

export type FilterType = 'all' | 'design' | 'website' | 'promotion';

interface FilterCounts {
	all: number;
	design: number;
	website: number;
	promotion: number;
}

interface PortfolioFilterProps {
	activeFilter: FilterType;
	onFilterChange: (filter: FilterType) => void;
	counts: FilterCounts;
}

const FILTERS: FilterType[] = ['all', 'design', 'website', 'promotion'];

// Фільтр портфоліо за типом послуги — скляна панель ліворуч (SideFilter; до 1024px — стрічка над списком).
// Показуються всі типи, зокрема з нулем (рішення розробника 2026-11-16).
export default function PortfolioFilter({ activeFilter, onFilterChange, counts }: PortfolioFilterProps): JSX.Element {
	const t = useTranslations('PortfolioPage.filter');

	return (
		<SideFilter
			title={t('title')}
			ariaLabel={t('ariaLabel')}
			items={FILTERS.map((value) => ({
				key: value,
				label: t(value),
				count: counts[value],
				active: activeFilter === value,
				onClick: () => onFilterChange(value)
			}))}
		/>
	);
}
