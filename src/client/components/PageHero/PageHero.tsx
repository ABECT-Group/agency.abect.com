import type { JSX, ReactNode } from 'react';
import './PageHero.scss';

type PageHeroProps = {
	title: ReactNode;
	subtitle?: ReactNode;
	/** Хлібні крихти — над заголовком */
	breadcrumbs?: ReactNode;
	/** Кнопки під описом */
	actions?: ReactNode;
	/** Додаткові класи, наприклад модифікатор сторінки */
	className?: string;
};

/**
 * «Шапка» внутрішньої сторінки в стилі нового дизайну головної (Figma «ABECT», Desktop 6):
 * фон — смуги й синє світіння, як у hero; заголовок H1 — Unbounded капсом, ліворуч;
 * під блоком — синя смуга, як під hero головної. Серверний компонент.
 */
export default function PageHero({ title, subtitle, breadcrumbs, actions, className = '' }: PageHeroProps): JSX.Element {
	return (
		<section className={`page-hero ${className}`.trim()}>
			<div className="page-hero__bg" aria-hidden="true" />
			<div className="container container--design page-hero__inner">
				{breadcrumbs && <div className="page-hero__breadcrumbs">{breadcrumbs}</div>}
				<h1 className="page-hero__title">{title}</h1>
				{subtitle && <p className="page-hero__subtitle">{subtitle}</p>}
				{actions && <div className="page-hero__actions">{actions}</div>}
			</div>
		</section>
	);
}
