'use client';

import { JSX } from 'react';
import { useTranslations } from 'next-intl';
import Breadcrumbs from '@/client/components/Breadcrumbs/Breadcrumbs';
import PageHero from '@/client/components/PageHero/PageHero';
import ArrowButton from '@/client/components/ArrowButton/ArrowButton';
import ScrollReveal from '@/client/components/ScrollReveal/ScrollReveal';
import Process from '@/client/modules/home/Process/Process';
import AboutStory from '../AboutStory/AboutStory';
import AboutTeam from '../AboutTeam/AboutTeam';
import AboutClients from '../AboutClients/AboutClients';
import CtaSection from '@/client/components/CtaSection/CtaSection';
import './AboutPage.scss';

interface AboutPageProps {
	locale: string;
}

const PRINCIPLES = ['principle1', 'principle2', 'principle3', 'principle4'] as const;

// «Про нас» — Figma «ABECT», Desktop 8 (227:549): шапка → «Хто ми?» з цифрами → команда на «рваному» фоні →
// «Як ми працюємо» (картки як «Етапи» головної) → з ким працюємо → заклик до дії
export default function AboutPage({ locale: _locale }: AboutPageProps): JSX.Element {
	const t = useTranslations('AboutPage');

	return (
		// <main> — головний вміст сторінки (landmark для скрінрідерів; flex-колонка, як body — розкладка та сама)
		<main className="page-main">
			<PageHero
				title={t('hero.title')}
				subtitle={t('hero.subtitle')}
				breadcrumbs={<Breadcrumbs chapter="about" />}
				actions={<ArrowButton size="lg">{t('hero.button')}</ArrowButton>}
			/>
			<div className="about-page" itemScope itemType="https://schema.org/AboutPage">
				<meta itemProp="name" content={t('hero.title')} />
				<meta itemProp="description" content={t('hero.subtitle')} />

				<AboutStory />
				<AboutTeam />
				<Process
					id="approach"
					title={t('approach.title')}
					steps={PRINCIPLES.map((key) => ({
						title: t(`approach.${key}.title`),
						text: t(`approach.${key}.description`)
					}))}
					cta={null}
				/>
				<AboutClients />
				<CtaSection namespace="AboutPage" />
			</div>
			<ScrollReveal />
		</main>
	);
}
