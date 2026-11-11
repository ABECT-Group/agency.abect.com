'use client';

import { JSX } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import RichText from '@/client/components/RichText/RichText';
import SectionHeading from '@/client/components/SectionHeading/SectionHeading';
import type { Media, Service } from '@/payload-types';
import './ServiceContent.scss';

interface ServiceContentProps {
	service: Service;
}

// «Про послугу»: детальний опис із CMS у картці; головне зображення послуги (якщо є) — поруч
export default function ServiceContent({ service }: ServiceContentProps): JSX.Element {
	const t = useTranslations('ServiceDetail.content');
	const heroImage = service.heroImage as Media | null;

	return (
		<section className="service-content" aria-labelledby="service-content-title">
			<div className="container container--design">
				<SectionHeading id="service-content-title" size="md" title={t('aboutTitle')} />

				<div className={`service-content__body${heroImage?.url ? ' service-content__body--with-image' : ''}`}>
					<div className="service-content__text" data-reveal="">
						<RichText data={service.detailedDescription} />
					</div>

					{heroImage?.url && (
						<figure className="service-content__image" data-reveal="">
							<Image
								src={heroImage.url}
								alt={heroImage.alt || service.title}
								width={heroImage.width || 800}
								height={heroImage.height || 600}
								sizes="(max-width: 1024px) 100vw, 40vw"
							/>
						</figure>
					)}
				</div>
			</div>
		</section>
	);
}
