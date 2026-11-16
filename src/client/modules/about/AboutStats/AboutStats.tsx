'use client';

import { CSSProperties, JSX } from 'react';
import { useTranslations } from 'next-intl';
import './AboutStats.scss';

// Цифри «Хто ми?» — картки з тонкою рамкою й товщими кутиками (як «Етапи» головної)
export default function AboutStats(): JSX.Element {
	const t = useTranslations('AboutPage');

	const stats = [
		{ value: t('stats.years'), label: t('stats.yearsLabel') },
		{ value: t('stats.projects'), label: t('stats.projectsLabel') },
		{ value: t('stats.geography'), label: t('stats.geographyLabel') }
	];

	return (
		<ul className="about-stats">
			{stats.map((stat, index) => (
				<li
					key={stat.label}
					className="about-stats__card"
					data-reveal=""
					style={{ '--reveal-delay': `${0.08 * index}s` } as CSSProperties}
				>
					<span className="about-stats__value">{stat.value}</span>
					<span className="about-stats__label">{stat.label}</span>
				</li>
			))}
		</ul>
	);
}
