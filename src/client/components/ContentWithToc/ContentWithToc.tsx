'use client';

import { JSX, ReactNode } from 'react';
import Image from 'next/image';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import RichTextWithAnchors from '@/client/components/RichText/RichText';
import RichTextHeadings from '@/client/components/RichTextHeadings/RichTextHeadings';
import './ContentWithToc.scss';

interface ContentWithTocProps {
	/** Текст у форматі Lexical (стаття блогу, кейс портфоліо) */
	content: SerializedEditorState;
	/** Заголовок змісту («Зміст») */
	tocTitle: string;
	/** Мікророзмітка schema.org усередині <article> (headline, дати, автор) */
	meta?: ReactNode;
	/** Обкладинка — на початку картки тексту, шириною як текст (рішення розробника 2026-11-18) */
	cover?: { url: string; alt: string; width?: number | null; height?: number | null };
}

/**
 * Текст сторінки зі змістом — однаково для статті блогу й кейсу портфоліо (рішення розробника 2026-11-18):
 * блок шириною до 1240px, липкий зміст ліворуч + текст у картці (обкладинка — першою в картці); ≤ 1024px — зміст над текстом.
 * Стилі тексту (заголовки, абзаци, списки) — спільний RichText.
 */
export default function ContentWithToc({ content, tocTitle, meta, cover }: ContentWithTocProps): JSX.Element {
	return (
		<section className="content-toc" itemScope itemType="https://schema.org/Article">
			<div className="container container--design">
				<div className="content-toc__wrapper">
					<aside className="content-toc__sidebar" aria-label={tocTitle}>
						<RichTextHeadings content={content} title={tocTitle} />
					</aside>

					<article className="content-toc__article" itemProp="articleBody">
						{meta}
						{cover && (
							<figure className="content-toc__cover">
								<Image
									src={cover.url}
									alt={cover.alt}
									width={cover.width || 1600}
									height={cover.height || 1000}
									priority
									fetchPriority="high"
									sizes="(max-width: 1024px) 100vw, 900px"
									itemProp="image"
								/>
							</figure>
						)}
						<RichTextWithAnchors data={content} />
					</article>
				</div>
			</div>
		</section>
	);
}
