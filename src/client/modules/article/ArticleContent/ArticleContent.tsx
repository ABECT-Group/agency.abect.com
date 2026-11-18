'use client';

import { JSX } from 'react';
import { useTranslations } from 'next-intl';
import type { Post } from '@/payload-types';
import type { CardAuthor } from '@/client/lib/cards';
import ContentWithToc from '@/client/components/ContentWithToc/ContentWithToc';

interface ArticleContentProps {
	/** Лише текст статті й поля для мікророзмітки — не весь документ (ISS-049) */
	post: Pick<Post, 'content' | 'title' | 'description' | 'date' | 'updatedAt'> & { author: CardAuthor | null };
	/** Обкладинка статті — першою в картці тексту */
	cover?: { url?: string | null; width?: number | null; height?: number | null } | null;
}

// Текст статті зі змістом — спільний блок із кейсом портфоліо (ContentWithToc)
export default function ArticleContent({ post, cover }: ArticleContentProps): JSX.Element {
	const t = useTranslations('ProjectDetail.sidebar');
	const author = post.author;
	const authorName = [author?.firstName, author?.lastName].filter(Boolean).join(' ') || 'ABECT Studio';

	return (
		<ContentWithToc
			content={post.content}
			tocTitle={t('tableOfContents')}
			cover={cover?.url ? { ...cover, url: cover.url, alt: post.title } : undefined}
			meta={
				<>
					<meta itemProp="headline" content={post.title} />
					<meta itemProp="description" content={post.description} />
					<meta itemProp="datePublished" content={post.date} />
					<meta itemProp="dateModified" content={post.updatedAt} />
					<span itemProp="author" itemScope itemType="https://schema.org/Person" style={{ display: 'none' }}>
						<meta itemProp="name" content={authorName} />
					</span>
				</>
			}
		/>
	);
}
