import { JSX } from 'react';
import type { Post } from '@/payload-types';
import ArticleHero from './ArticleHero/ArticleHero';
import ArticleContent from './ArticleContent/ArticleContent';
import RelatedArticles from './RelatedArticles/RelatedArticles';
import CtaSection from '@/client/components/CtaSection/CtaSection';
import ScrollReveal from '@/client/components/ScrollReveal/ScrollReveal';
import { toCardPost } from '@/client/lib/cards';

interface ArticleProps {
	post: Post;
	relatedPosts: Post[];
	locale: string;
}

export default function Article({ post, relatedPosts, locale }: ArticleProps): JSX.Element {
	const card = toCardPost(post);
	return (
		<main>
			{/* У клієнтські компоненти — лише потрібні поля, не весь документ (ISS-049) */}
			<ArticleHero post={card} locale={locale} />
			<ArticleContent
				post={{ content: post.content, title: post.title, description: post.description, date: post.date, updatedAt: post.updatedAt, author: card.author }}
				cover={card.cover}
			/>
			<CtaSection namespace="ArticleDetail" />
			<RelatedArticles posts={relatedPosts.map(toCardPost)} locale={locale} />
			<ScrollReveal />
		</main>
	);
}
