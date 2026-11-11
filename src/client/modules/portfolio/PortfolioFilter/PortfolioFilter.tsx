'use client';

import { JSX } from 'react';
import { useTranslations } from 'next-intl';
import ChipBar from '@/client/components/ChipBar/ChipBar';

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

// Фільтр портфоліо за типом послуги — стрічка ChipBar (фільтр на клієнті); порожні типи не показуються
export default function PortfolioFilter({ activeFilter, onFilterChange, counts }: PortfolioFilterProps): JSX.Element {
	const t = useTranslations('PortfolioPage.filter');

	return (
		<ChipBar
			ariaLabel={t('ariaLabel')}
			items={FILTERS.filter((value) => value === 'all' || counts[value] > 0).map((value) => ({
				key: value,
				label: t(value),
				count: counts[value],
				active: activeFilter === value,
				onClick: () => onFilterChange(value)
			}))}
		/>
	);
}
