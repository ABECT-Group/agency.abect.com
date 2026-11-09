'use client';

import { JSX } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/client/i18n/navigation';
import type { ServiceType } from '@/payload-types';
import './ServicesFilter.scss';

interface ServicesFilterProps {
	activeType?: string; // slug of active type (undefined = all)
	serviceTypes: ServiceType[];
	counts: Record<string, number>;
}

export default function ServicesFilter({
	activeType,
	serviceTypes,
	counts
}: ServicesFilterProps): JSX.Element {
	const t = useTranslations('ServicesPage.filter');
	const router = useRouter();

	return (
		<aside className="services-filter" aria-label={t('ariaLabel')}>
			<h2 className="services-filter__title">{t('title')}</h2>

			{/* Desktop & Tablet - Список */}
			<ul className="services-filter__list" role="list">
				{/* "All" filter */}
				<li role="listitem">
					<Link
						href="/services"
						className={`services-filter__item ${
							!activeType ? 'services-filter__item--active' : ''
						}`}
						aria-current={!activeType ? 'page' : undefined}
						aria-label={`${t('all')} (${counts.all || 0})`}
					>
						<span className="services-filter__label">{t('all')}</span>
						<span className="services-filter__count">{counts.all || 0}</span>
					</Link>
				</li>

				{/* Service types */}
				{serviceTypes.map((type) => (
					<li key={type.slug} role="listitem">
						<Link
							href={`/services/${type.slug}`}
							className={`services-filter__item ${
								activeType === type.slug ? 'services-filter__item--active' : ''
							}`}
							aria-current={activeType === type.slug ? 'page' : undefined}
							aria-label={`${type.name} (${counts[type.slug] || 0})`}
						>
							<span className="services-filter__label">{type.name}</span>
							<span className="services-filter__count">{counts[type.slug] || 0}</span>
						</Link>
					</li>
				))}
			</ul>

			{/* Mobile - Select (for JS navigation) */}
			<div className="services-filter__select-wrapper">
				<select
					className="services-filter__select"
					value={activeType || 'all'}
					onChange={(e) => {
						const value = e.target.value;
						// router з next-intl зберігає поточну мову (раніше EN-користувача кидало на UA)
						router.push(value === 'all' ? '/services' : `/services/${value}`);
					}}
					aria-label={t('selectAriaLabel')}
				>
					<option value="all">
						{t('all')} ({counts.all || 0})
					</option>
					{serviceTypes.map((type) => (
						<option key={type.slug} value={type.slug}>
							{type.name} ({counts[type.slug] || 0})
						</option>
					))}
				</select>
			</div>
		</aside>
	);
}
