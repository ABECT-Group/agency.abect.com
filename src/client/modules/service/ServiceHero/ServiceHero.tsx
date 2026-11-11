'use client';

import { JSX } from 'react';
import { useTranslations } from 'next-intl';
import Breadcrumbs from '@/client/components/Breadcrumbs/Breadcrumbs';
import PageHero from '@/client/components/PageHero/PageHero';
import ArrowButton from '@/client/components/ArrowButton/ArrowButton';
import type { Service, ServiceType } from '@/payload-types';

interface ServiceHeroProps {
	service: Service;
	locale: string;
	serviceType?: ServiceType;
}

// Шапка сторінки послуги — PageHero: крихти, назва, короткий опис, теги (категорія, термін) і кнопка заявки.
// Ціни й склад послуги — нижче, у ServicePricing (картки PlanCard).
export default function ServiceHero({ service, serviceType }: ServiceHeroProps): JSX.Element {
	const t = useTranslations('ServiceDetail');

	const type = serviceType || (service.serviceType as ServiceType | null);
	const tags = [type?.name, service.customTimeline && `${t('timeline')}: ${service.customTimeline}`].filter(
		(tag): tag is string => Boolean(tag)
	);

	return (
		<PageHero
			className="service-hero"
			title={service.title}
			subtitle={service.shortDescription}
			breadcrumbs={
				<Breadcrumbs chapter="services" slug={service.title} categorySlug={type?.slug} categoryName={type?.name} />
			}
			actions={
				<>
					<ArrowButton size="lg">{t('orderButton')}</ArrowButton>
					{tags.length > 0 && (
						<ul className="page-hero__tags">
							{tags.map((tag) => (
								<li key={tag} className="page-hero__tag glass">
									{tag}
								</li>
							))}
						</ul>
					)}
				</>
			}
		/>
	);
}
