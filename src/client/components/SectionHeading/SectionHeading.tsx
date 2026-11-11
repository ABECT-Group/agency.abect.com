import type { CSSProperties, JSX, ReactNode } from 'react';
import './SectionHeading.scss';

type SectionHeadingProps = {
	id?: string;
	title: ReactNode;
	subtitle?: ReactNode;
	/** Праворуч від заголовка (перемикач, кнопка); на мобільному — під описом */
	aside?: ReactNode;
	/** lg — 40px (послуги, роботи), md — 36px (етапи, FAQ) */
	size?: 'lg' | 'md';
	className?: string;
};

// Заголовок секції нового дизайну: H2 (Unbounded, капс) + опис, опційно — елемент праворуч.
// data-reveal — поява при прокрутці (ScrollReveal): заголовок → опис → елемент праворуч.
export default function SectionHeading({
	id,
	title,
	subtitle,
	aside,
	size = 'lg',
	className = ''
}: SectionHeadingProps): JSX.Element {
	return (
		<header className={`section-heading section-heading--${size} ${className}`.trim()}>
			<h2 id={id} className="section-heading__title" data-reveal="">
				{title}
			</h2>
			{aside && (
				<div className="section-heading__aside" data-reveal="" style={{ '--reveal-delay': '0.12s', '--reveal-blur': '0px' } as CSSProperties}>
					{aside}
				</div>
			)}
			{subtitle && (
				<p className="section-heading__subtitle" data-reveal="" style={{ '--reveal-delay': '0.06s' } as CSSProperties}>
					{subtitle}
				</p>
			)}
		</header>
	);
}
