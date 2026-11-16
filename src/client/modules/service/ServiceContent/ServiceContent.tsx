'use client';

import { JSX } from 'react';
import { useTranslations } from 'next-intl';
import RichText from '@/client/components/RichText/RichText';
import RichTextHeadings from '@/client/components/RichTextHeadings/RichTextHeadings';
import SectionHeading from '@/client/components/SectionHeading/SectionHeading';
import type { Service } from '@/payload-types';
import './ServiceContent.scss';

interface ServiceContentProps {
	/** Лише текст «Про послугу» — не весь документ (ISS-049) */
	service: Pick<Service, 'detailedDescription'>;
}

// «Про послугу»: липкий зміст ліворуч (як у кейсах) + детальний опис із CMS у картці.
// Головне зображення послуги тут не показується (рішення розробника 2026-11-16).
export default function ServiceContent({ service }: ServiceContentProps): JSX.Element {
	const t = useTranslations('ServiceDetail.content');

	return (
		<section className="service-content" aria-labelledby="service-content-title">
			<div className="container container--design">
				<SectionHeading id="service-content-title" size="md" title={t('aboutTitle')} />

				<div className="service-content__body">
					<aside className="service-content__sidebar" aria-label={t('tableOfContents')}>
						<RichTextHeadings content={service.detailedDescription} title={t('tableOfContents')} />
					</aside>

					<div className="service-content__text" data-reveal="">
						<RichText data={service.detailedDescription} />
					</div>
				</div>
			</div>
		</section>
	);
}
