'use client';

import { JSX } from 'react';
import { useTranslations } from 'next-intl';
import RichText from '@/client/components/RichText/RichText';
import SectionHeading from '@/client/components/SectionHeading/SectionHeading';
import FaqList from '@/client/components/FaqList/FaqList';
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import './FAQSection.scss';

interface FAQItem {
	id?: string | null;
	question?: string | null;
	answer?: SerializedEditorState | null;
}

interface FAQSectionProps {
	faq: FAQItem[];
}

// Часті питання про послугу (з CMS) — той самий акордеон, що на головній (FaqList), відповіді — RichText
export default function FAQSection({ faq }: FAQSectionProps): JSX.Element {
	const t = useTranslations('ServiceDetail.faq');

	return (
		<section className="faq-section" aria-labelledby="service-faq-title">
			<div className="container container--design">
				<SectionHeading id="service-faq-title" size="md" title={t('title')} subtitle={t('subtitle')} />

				<FaqList
					className="faq-section__list"
					name="service-faq"
					items={faq.map((item, index) => ({
						id: item.id || String(index),
						question: item.question || '',
						answer: item.answer ? <RichText data={item.answer} /> : null
					}))}
				/>
			</div>
		</section>
	);
}
