import React, { JSX } from 'react';

import Hero, { type HeroPrice } from './Hero/Hero';
import Services from './Services/Services';
import Portfolio from './Portfolio/Portfolio';
import Advantages from './Advantages/Advantages';

interface HomeProps {
	locale: string;
	heroPrices?: HeroPrice[] | null;
}

function Home({ locale, heroPrices }: HomeProps): JSX.Element {
	return (
		<main>
			<Hero prices={heroPrices} />
			<Services locale={locale} />
			<Portfolio locale={locale}/>
			<Advantages />
		</main>
	);
}

export default Home