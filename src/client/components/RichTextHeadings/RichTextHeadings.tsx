'use client';
import { JSX } from 'react';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import { tocHeadings } from '@/utils/richTextHeadings';
import './RichTextHeadings.scss';

interface RichTextHeadingsProps {
	content: SerializedEditorState | null | undefined;
	title?: string;
}

// Зміст тексту з CMS: пункти — h2 (або h3, якщо h2 немає); id збігаються з RichText (utils/richTextHeadings)
export default function RichTextHeadings({ content, title = 'Table of Contents' }: RichTextHeadingsProps): JSX.Element | null {
	const headings = tocHeadings(content);

	if (headings.length === 0) return null;

	return (
		<nav
			aria-label={title}
			itemScope
			itemType="https://schema.org/SiteNavigationElement"
			className="RichTextHeadings"
		>
			<div className="RichTextHeadings__title">{title}</div>
			<ol itemProp="about" className="RichTextHeadings__list">
				{headings.map((h, idx) => (
					<li
						key={h.id}
						itemProp="itemListElement"
						itemScope
						itemType="https://schema.org/ListItem"
						className="RichTextHeadings__item"
					>
						<a href={`#${h.id}`} itemProp="url">
							<span itemProp="name">{h.text}</span>
						</a>
						<meta itemProp="position" content={String(idx + 1)} />
					</li>
				))}
			</ol>
		</nav>
	);
}
