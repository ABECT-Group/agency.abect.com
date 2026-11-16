'use client';

import { JSX } from 'react';
import { useTranslations } from 'next-intl';
import { Mail, Send } from 'lucide-react';
import ArrowButton from '@/client/components/ArrowButton/ArrowButton';
import './AboutCTA.scss';

// Заклик до дії внизу «Про нас» (у макеті немає; текст — без змін). Кнопка відкриває форму заявки —
// раніше вона нічого не робила.
export default function AboutCTA(): JSX.Element {
	const t = useTranslations('AboutPage');

	return (
		<section className="about-cta" aria-labelledby="about-cta-title">
			<div className="container container--design">
				<div className="about-cta__box glass" data-reveal="">
					<h2 className="about-cta__title" id="about-cta-title">
						{t('cta.title')}
					</h2>
					<p className="about-cta__text">{t('cta.text')}</p>
					<div className="about-cta__contacts">
						<a href="mailto:support@agency.abect.com" className="about-cta__link">
							<Mail size={16} aria-hidden="true" />
							support@agency.abect.com
						</a>
						<a href="https://t.me/+380980275819" className="about-cta__link" target="_blank" rel="noopener noreferrer">
							<Send size={16} aria-hidden="true" />
							Telegram
						</a>
					</div>
					<ArrowButton size="lg">{t('cta.button')}</ArrowButton>
				</div>
			</div>
		</section>
	);
}
