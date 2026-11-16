'use client';

import type { JSX } from 'react';
import { Link } from '@/client/i18n/navigation';
import ChipBar, { type ChipBarItem } from '../ChipBar/ChipBar';
import './SideFilter.scss';

type SideFilterProps = {
	title: string;
	ariaLabel: string;
	items: ChipBarItem[];
	className?: string;
};

/**
 * Фільтр-колонка ліворуч від списку (портфоліо, блог): липка скляна панель із заголовком і пунктами
 * з лічильниками; активний пункт — «пігулка» як у навігації хедера. До 1024px замість панелі —
 * горизонтальна стрічка ChipBar над списком. Пункти — посилання (href) або кнопки (onClick).
 */
export default function SideFilter({ title, ariaLabel, items, className = '' }: SideFilterProps): JSX.Element {
	return (
		<div className={`side-filter ${className}`.trim()}>
			<nav className="side-filter__panel glass" aria-label={ariaLabel}>
				<h2 className="side-filter__title">{title}</h2>
				<ul className="side-filter__list">
					{items.map((item) => {
						const classes = `side-filter__item${item.active ? ' side-filter__item--active' : ''}`;
						const content = (
							<>
								<span className="side-filter__label">{item.label}</span>
								{item.count !== undefined && <span className="side-filter__count">{item.count}</span>}
							</>
						);

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

			<ChipBar className="side-filter__chips" ariaLabel={ariaLabel} items={items} />
		</div>
	);
}
