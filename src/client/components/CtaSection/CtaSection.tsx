'use client';

import { JSX } from 'react';
import { useTranslations } from 'next-intl';
import { Mail, Send } from 'lucide-react';
import ArrowButton from '@/client/components/ArrowButton/ArrowButton';
import './CtaSection.scss';

interface CtaSectionProps {
	/** Простір перекладів із ключами cta.title / cta.text / cta.button */
	namespace: 'AboutPage' | 'ArticleDetail' | 'ProjectDetail';
}

// Заклик до дії — скляний блок: заголовок, текст, пошта й Telegram, кнопка відкриває форму заявки.
// «Про нас», а також перед «Схожими статтями» й «Схожими проєктами».
export default function CtaSection({ namespace }: CtaSectionProps): JSX.Element {
	const t = useTranslations(namespace);
	const id = 'cta-section-title';
	return (
		<section className="cta-section" aria-labelledby={id}>
			<div className="container container--design">
				<div className="cta-section__box glass" data-reveal="">
					<h2 className="cta-section__title" id={id}>
						{t('cta.title')}
					</h2>
					<p className="cta-section__text">{t('cta.text')}</p>
					<div className="cta-section__contacts">
						<a href="mailto:agency@abect.com" className="cta-section__link">
							<Mail size={16} aria-hidden="true" />
							agency@abect.com
						</a>
						<a href="https://t.me/+380980275819" className="cta-section__link" target="_blank" rel="noopener noreferrer">
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
