'use client';

import { CSSProperties, JSX } from 'react';
import type { CardPost } from '@/client/lib/cards';
import BlogCard from '../BlogCard/BlogCard';
// Сітка — та сама, що в портфоліо (PortfolioList)
import '../PortfolioList/PortfolioList.scss';

interface BlogListProps {
	posts: CardPost[];
	locale: string;
	/** Колонок на десктопі (2 або 3) */
	startRows?: number;
	/** Перший ряд — пріоритетне завантаження обкладинок */
	eagerFirstRow?: boolean;
}

// Сітка карток статей — як сітка проєктів: 3 (або 2) колонки → 2 → 1, поява при прокрутці каскадом
export default function BlogList({ posts, locale, startRows = 3, eagerFirstRow = false }: BlogListProps): JSX.Element | null {
	if (!posts?.length) return null;

	const columns = startRows === 2 ? 2 : 3;

	return (
		<ul className={`portfolio-list portfolio-list--${columns}`}>
			{posts.map((post, index) => (
				<li key={post.id} data-reveal="" style={{ '--reveal-delay': `${0.08 * (index % columns)}s` } as CSSProperties}>
					<BlogCard post={post} locale={locale} eager={eagerFirstRow && index < columns} />
				</li>
			))}
		</ul>
	);
}
