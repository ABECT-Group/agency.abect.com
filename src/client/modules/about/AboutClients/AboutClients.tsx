'use client';

import { JSX } from 'react';
import { useTranslations } from 'next-intl';
import SectionHeading from '@/client/components/SectionHeading/SectionHeading';
import './AboutClients.scss';

// «З ким ми працюємо» — у макеті Desktop 8 цієї секції немає; оформлена в стилі сторінки, текст — без змін
export default function AboutClients(): JSX.Element {
	const t = useTranslations('AboutPage');

	return (
		<section className="about-clients" aria-labelledby="about-clients-title">
			<div className="container container--design">
				<SectionHeading id="about-clients-title" size="md" title={t('clients.title')} />
				<p className="about-clients__text glass" data-reveal="">
					{t('clients.description')}
				</p>
			</div>
		</section>
	);
}
