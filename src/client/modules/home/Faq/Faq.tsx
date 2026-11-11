import { JSX } from 'react';
import { useTranslations } from 'next-intl';
import SectionHeading from '@/client/components/SectionHeading/SectionHeading';
import FloatingDecor from '@/client/components/FloatingDecor/FloatingDecor';
import FaqList from '@/client/components/FaqList/FaqList';
import './Faq.scss';

const QUESTIONS = ['start', 'price', 'codeVsBuilder', 'mobile', 'prepare', 'afterLaunch'] as const;

// «Часті запитання» — Figma «ABECT», Desktop 6 (166:312, 184:341 … 184:335).
// Акордеон — спільний FaqList (матове скло, <details name>), перше питання відкрите, як у макеті.
export default function Faq(): JSX.Element {
	const t = useTranslations('HomePage.Faq');

	// Розмітка FAQPage для пошуковиків — ті самі тексти, що на сторінці
	const faqJsonLd = {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: QUESTIONS.map((key) => ({
			'@type': 'Question',
			name: t(`items.${key}.question`),
			acceptedAnswer: { '@type': 'Answer', text: t(`items.${key}.answer`) }
		}))
	};

	return (
		<section className="faq" id="faq" aria-labelledby="faq-title">
			<div className="faq__bg" aria-hidden="true" />
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

			<div className="container container--design">
				<SectionHeading id="faq-title" size="md" title={t('title')} subtitle={t('subtitle')} />

				<FaqList
					className="faq__list"
					name="faq"
					items={QUESTIONS.map((key) => ({
						id: key,
						question: t(`items.${key}.question`),
						answer: <p>{t(`items.${key}.answer`)}</p>
					}))}
				/>

				<FloatingDecor
					className="faq__decor"
					src="/images/decor/spiral.png"
					width={286}
					height={312}
					revealDelay={0.2}
				/>
			</div>
		</section>
	);
}
