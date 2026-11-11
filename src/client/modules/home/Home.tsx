import React, { JSX } from 'react';

import Hero, { type HeroPrice } from './Hero/Hero';
import Services from './Services/Services';
import Portfolio from './Portfolio/Portfolio';
import Process from './Process/Process';
import Faq from './Faq/Faq';
import ScrollReveal from '@/client/components/ScrollReveal/ScrollReveal';
import './Home.scss';

interface HomeProps {
	locale: string;
	heroPrices?: HeroPrice[] | null;
}

function Home({ locale, heroPrices }: HomeProps): JSX.Element {
	return (
		// Новий дизайн (Figma «ABECT», Desktop 6): суцільний чорний фон
		<main className="home">
			<Hero prices={heroPrices} />
			<div className="home__band" aria-hidden="true" />
			<Services locale={locale} />
			<Portfolio locale={locale}/>
			<Process />
			<Faq />
			<ScrollReveal />
		</main>
	);
}

export default Home