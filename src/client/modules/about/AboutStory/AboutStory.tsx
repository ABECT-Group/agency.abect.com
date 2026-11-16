'use client';

import { JSX } from 'react';
import { useTranslations } from 'next-intl';
import SectionHeading from '@/client/components/SectionHeading/SectionHeading';
import AboutStats from '../AboutStats/AboutStats';
import './AboutStory.scss';

// «Хто ми?» — Figma Desktop 8: два абзаци (другий зсунутий праворуч) і три картки з цифрами
export default function AboutStory(): JSX.Element {
	const t = useTranslations('AboutPage');

	return (
		<section className="about-story" aria-labelledby="about-story-title">
			<div className="container container--design">
				<SectionHeading id="about-story-title" title={t('story.title')} />
				<div className="about-story__content">
					<p className="about-story__lead" data-reveal="">
						{t('story.paragraph1')}
					</p>
					<p className="about-story__text" data-reveal="">
						{t('story.paragraph2')}
					</p>
				</div>
				<AboutStats />
			</div>
		</section>
	);
}
