'use client';

import { CSSProperties, JSX } from 'react';
import type { Portfolio } from '@/payload-types';
import PortfolioCard from '../PortfolioCard/PortfolioCard';
import './PortfolioList.scss';

interface PortfolioListProps {
	projects: Portfolio[];
	locale: string;
	/** Колонок на десктопі (2 або 3) */
	startRows?: number;
	/** Перший ряд — пріоритетне завантаження обкладинок (коли список одразу на першому екрані) */
	eagerFirstRow?: boolean;
}

// Сітка карток проєктів: 3 (або 2) колонки → 2 → 1; поява при прокрутці каскадом у межах ряду
export default function PortfolioList({ projects, locale, startRows = 3, eagerFirstRow = false }: PortfolioListProps): JSX.Element | null {
	if (!projects?.length) return null;

	const columns = startRows === 2 ? 2 : 3;

	return (
		<ul className={`portfolio-list portfolio-list--${columns}`}>
			{projects.map((project, index) => (
				<li key={project.id} data-reveal="" style={{ '--reveal-delay': `${0.08 * (index % columns)}s` } as CSSProperties}>
					<PortfolioCard project={project} locale={locale} eager={eagerFirstRow && index < columns} />
				</li>
			))}
		</ul>
	);
}
