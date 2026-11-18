'use client';

import { JSX } from 'react';
import { useTranslations } from 'next-intl';
import type { Portfolio } from '@/payload-types';
import ContentWithToc from '@/client/components/ContentWithToc/ContentWithToc';

interface ProjectContentProps {
	/** Лише текст кейсу й поля для мікророзмітки — не весь документ (ISS-049) */
	project: Pick<Portfolio, 'content' | 'title' | 'shortDescription' | 'projectDate'>;
	/** Обкладинка кейсу — першою в картці тексту */
	cover?: { url?: string | null; width?: number | null; height?: number | null } | null;
	author?: string;
}

// Текст кейсу зі змістом — спільний блок зі статтею блогу (ContentWithToc)
export default function ProjectContent({ project, cover, author = 'ABECT Studio' }: ProjectContentProps): JSX.Element {
	const t = useTranslations('ProjectDetail.sidebar');

	return (
		<ContentWithToc
			content={project.content}
			tocTitle={t('tableOfContents')}
			cover={cover?.url ? { ...cover, url: cover.url, alt: project.title } : undefined}
			meta={
				<>
					<meta itemProp="headline" content={project.title} />
					<meta itemProp="description" content={project.shortDescription} />
					<meta itemProp="datePublished" content={project.projectDate} />
					<meta itemProp="dateModified" content={project.projectDate} />
					{author && (
						<span itemProp="author" itemScope itemType="https://schema.org/Organization" style={{ display: 'none' }}>
							<meta itemProp="name" content={author} />
						</span>
					)}
				</>
			}
		/>
	);
}
