'use client';

import { JSX } from 'react';
import { useTranslations } from 'next-intl';
import type { ServiceType } from '@/payload-types';
import ChipBar from '@/client/components/ChipBar/ChipBar';

interface ServicesFilterProps {
	activeType?: string; // slug активної категорії (undefined = усі)
	serviceTypes: ServiceType[];
	counts: Record<string, number>;
}

// Категорії послуг — стрічка ChipBar; фільтр через URL (/services/<категорія>)
export default function ServicesFilter({ activeType, serviceTypes, counts }: ServicesFilterProps): JSX.Element {
	const t = useTranslations('ServicesPage.filter');

	return (
		<ChipBar
			ariaLabel={t('ariaLabel')}
			items={[
				{ key: 'all', label: t('all'), count: counts.all || 0, active: !activeType, href: '/services' },
				...serviceTypes.map((type) => ({
					key: type.slug,
					label: type.name,
					count: counts[type.slug] || 0,
					active: activeType === type.slug,
					href: `/services/${type.slug}`
				}))
			]}
		/>
	);
}
