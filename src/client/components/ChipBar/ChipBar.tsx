'use client';

import type { JSX } from 'react';
import { Link } from '@/client/i18n/navigation';
import './ChipBar.scss';

export type ChipBarItem = {
	key: string;
	label: string;
	count?: number;
	active: boolean;
	/** Посилання (фільтр через URL) — або onClick (фільтр на клієнті) */
	href?: string;
	onClick?: () => void;
};

type ChipBarProps = {
	items: ChipBarItem[];
	ariaLabel: string;
	className?: string;
};

/**
 * Стрічка фільтрів нового дизайну — скло, «пігулки» з лічильниками (як навігація хедера);
 * на телефоні гортається вбік. Використовується у фільтрах послуг, портфоліо й блогу.
 */
export default function ChipBar({ items, ariaLabel, className = '' }: ChipBarProps): JSX.Element {
	return (
		<nav className={`chip-bar ${className}`.trim()} aria-label={ariaLabel}>
			<ul className="chip-bar__list glass">
				{items.map((item) => {
					const content = (
						<>
							{item.label}
							{item.count !== undefined && <span className="chip-bar__count">{item.count}</span>}
						</>
					);
					const classes = `chip-bar__item${item.active ? ' chip-bar__item--active' : ''}`;

					return (
						<li key={item.key}>
							{item.href ? (
								<Link href={item.href} className={classes} aria-current={item.active ? 'page' : undefined}>
									{content}
								</Link>
							) : (
								<button type="button" className={classes} aria-pressed={item.active} onClick={item.onClick}>
									{content}
								</button>
							)}
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
