'use client';

import { JSX } from 'react';
import { useTranslations } from 'next-intl';
import Breadcrumbs from '@/client/components/Breadcrumbs/Breadcrumbs';
import PageHero from '@/client/components/PageHero/PageHero';
import ArrowButton from '@/client/components/ArrowButton/ArrowButton';
import AboutStory from '../AboutStory/AboutStory';
import AboutStats from '../AboutStats/AboutStats';
import AboutTeam from '../AboutTeam/AboutTeam';
import AboutApproach from '../AboutApproach/AboutApproach';
import AboutClients from '../AboutClients/AboutClients';
import AboutCTA from '../AboutCTA/AboutCTA';
import './AboutPage.scss';

interface AboutPageProps {
	locale: string;
}

export default function AboutPage({ locale: _locale }: AboutPageProps): JSX.Element {
	const t = useTranslations('AboutPage');

	return (
		<>
			{/* Шапка — PageHero; кнопка відкриває форму заявки (раніше кнопка в AboutHero нічого не робила) */}
			<PageHero
				title={t('hero.title')}
				subtitle={t('hero.subtitle')}
				breadcrumbs={<Breadcrumbs chapter="about" />}
				actions={<ArrowButton size="lg">{t('hero.button')}</ArrowButton>}
			/>
			<section className="about-page" itemScope itemType="https://schema.org/AboutPage">
				<meta itemProp="name" content={t('hero.title')} />
				<meta itemProp="description" content={t('hero.subtitle')} />
				<div className="container container--design">
					<AboutStory />
					<AboutStats />
					<AboutTeam />
					<AboutApproach />
					<AboutClients />
					<AboutCTA />
				</div>
			</section>
		</>
	);
}
