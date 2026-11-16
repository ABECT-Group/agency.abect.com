'use client';

import { JSX } from 'react';
import { useTranslations } from 'next-intl';
import type { Post, User } from '@/payload-types';
import RichTextWithAnchors from '@/client/components/RichText/RichText';
import RichTextHeadings from '@/client/components/RichTextHeadings/RichTextHeadings';
import './ArticleContent.scss';

interface ArticleContentProps {
	post: Post;
}

export default function ArticleContent({ post }: ArticleContentProps): JSX.Element {
	const t = useTranslations('ProjectDetail.sidebar');
	const author = typeof post.author === 'object' ? (post.author as User | null) : null;
	const authorName = [author?.firstName, author?.lastName].filter(Boolean).join(' ') || 'ABECT Studio';

	return (
		<section
			className='article-content'
			itemScope
			itemType="https://schema.org/Article"
		>
			<div className="container">
				<div className="article-content__wrapper">
					<aside
						className="article-content__sidebar"
						role="complementary"
						aria-label="Table of contents"
					>
						<RichTextHeadings content={post.content} title={t('tableOfContents')} />
					</aside>

					<article
						className="article-content__article"
						itemProp="articleBody"
					>
						<meta itemProp="headline" content={post.title} />
						<meta itemProp="description" content={post.description} />
						<meta itemProp="datePublished" content={post.date} />
						<meta itemProp="dateModified" content={post.updatedAt} />
						<span itemProp="author" itemScope itemType="https://schema.org/Person" style={{ display: 'none' }}>
							<meta itemProp="name" content={authorName} />
						</span>

						<RichTextWithAnchors data={post.content} />
					</article>
				</div>
			</div>
		</section>
	);
}
