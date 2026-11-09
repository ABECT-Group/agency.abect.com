'use client';

import { JSX } from 'react';
import Breadcrumbs from '@/client/components/Breadcrumbs/Breadcrumbs';
import AboutHero from '../AboutHero/AboutHero';
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
	return (
		<section
			className="about-page"
			itemScope
			itemType="https://schema.org/AboutPage"
		>
			<div className="container">
				<AboutHero />
				<Breadcrumbs chapter="about" />
				<AboutStory />
				<AboutStats />
				<AboutTeam />
				<AboutApproach />
				<AboutClients />
				<AboutCTA />
			</div>
		</section>
	);
}
