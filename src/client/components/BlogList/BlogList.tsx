'use client';

import { JSX } from 'react';
import type { CardPost } from '@/client/lib/cards';
import BlogCard from '../BlogCard/BlogCard';
import './BlogList.scss';

interface BlogListProps {
	posts: CardPost[];
	locale: string;
	startRows?: number;
}

export default function BlogList({ posts, locale, startRows = 3 }: BlogListProps): JSX.Element | null {
	if (!posts?.length) return null;

	return (
		<div className={`blog-list blog-list__rows--${startRows}`} role="list" aria-label="Список статей блогу">
			{posts.map((post) => (
				<div key={post.id} role="listitem">
					<BlogCard post={post} locale={locale} />
				</div>
			))}
		</div>
	);
}
