import { JSX } from 'react';
import { useTranslations } from 'next-intl';
import SectionHeading from '@/client/components/SectionHeading/SectionHeading';
import FaqList from '@/client/components/FaqList/FaqList';
import '@/client/components/RichText/RichText.scss';
import './CalculatorGuide.scss';

type GuideSection = { title: string; text: string[]; list?: string[] };
type GuideFaq = { q: string; a: string };

/**
 * Третя секція сторінки /calculator — SEO-текст (≈ 5 000 символів): як працює калькулятор, з чого складається ціна,
 * Weblium чи код, що входить у вартість, чому ціна «від», що далі; + FAQ з розміткою FAQPage.
 * Формула в тексті відповідає calculatePrice (CalculatorContext): база (тип × платформа) + сторінки понад одну
 * + додаткові послуги, × коефіцієнт терміновості, не менше мінімального замовлення. Цифр у тексті немає —
 * ціни задаються в CMS і показує їх сам калькулятор. Стилі тексту — спільний .RichText (як у статтях).
 */
export default function CalculatorGuide(): JSX.Element {
	const t = useTranslations('CalculatorPage.guide');
	const sections = t.raw('sections') as GuideSection[];
	const faq = t.raw('faq') as GuideFaq[];

	const faqJsonLd = {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: faq.map((item) => ({
			'@type': 'Question',
			name: item.q,
			acceptedAnswer: { '@type': 'Answer', text: item.a }
		}))
	};

	return (
		<section className="calculator-guide" aria-labelledby="calculator-guide-title">
			<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
			<div className="container container--design">
				<div className="calculator-guide__inner">
					<SectionHeading id="calculator-guide-title" size="md" title={t('title')} />

					<div className="calculator-guide__text RichText">
						<p className="calculator-guide__intro">{t('intro')}</p>
						{sections.map((section) => (
							<div key={section.title} className="calculator-guide__block">
								<h3>{section.title}</h3>
								{section.text.map((paragraph) => (
									<p key={paragraph}>{paragraph}</p>
								))}
								{section.list && (
									<ul>
										{section.list.map((item) => (
											<li key={item}>{item}</li>
										))}
									</ul>
								)}
							</div>
						))}
					</div>

					<div className="calculator-guide__faq">
						<SectionHeading id="calculator-faq-title" size="md" title={t('faqTitle')} />
						<FaqList
							name="calculator-faq"
							items={faq.map((item, index) => ({
								id: `faq-${index}`,
								question: item.q,
								answer: <p>{item.a}</p>
							}))}
						/>
					</div>
				</div>
			</div>
		</section>
	);
}
