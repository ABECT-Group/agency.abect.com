'use client';

import { JSX, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/client/i18n/navigation';
import type { Service, ServiceType } from '@/payload-types';
import ServicesFilter from '../ServicesFilter/ServicesFilter';
import ServicesList from '@/client/components/ServicesList/ServicesList';
import Breadcrumbs from '@/client/components/Breadcrumbs/Breadcrumbs';
import PageHero from '@/client/components/PageHero/PageHero';
import VariantToggle from '@/client/components/VariantToggle/VariantToggle';
import ScrollReveal from '@/client/components/ScrollReveal/ScrollReveal';
import type { PlanVariant } from '@/client/components/PlanCard/PlanCard';
import './ServicesPage.scss';

interface ServicesPageProps {
	locale: string;
	services: Service[]; // Послуги для показу (усі або відфільтровані за категорією)
	allServices?: Service[]; // Усі послуги — для лічильників у фільтрі
	serviceTypes: ServiceType[];
	currentType?: ServiceType; // Поточна категорія (undefined = усі)
}

// «Послуги» і «Послуги / категорія»: PageHero → категорії + перемикач «кодом / на конструкторі» → картки PlanCard
export default function ServicesPage({
	locale: _locale,
	services,
	allServices,
	serviceTypes,
	currentType
}: ServicesPageProps): JSX.Element {
	const t = useTranslations('ServicesPage');
	const [variant, setVariant] = useState<PlanVariant>('custom');
	const [switched, setSwitched] = useState(false);

	const servicesForCounting = allServices || services;

	// Кількість послуг у кожній категорії
	const filterCounts = useMemo(() => {
		const counts: Record<string, number> = { all: 0 };
		serviceTypes.forEach((type) => {
			counts[type.slug] = 0;
		});
		servicesForCounting.forEach((service) => {
			counts.all++;
			const typeSlug = typeof service.serviceType === 'object' ? service.serviceType.slug : null;
			if (typeSlug && counts[typeSlug] !== undefined) counts[typeSlug]++;
		});
		return counts;
	}, [servicesForCounting, serviceTypes]);

	const pageTitle = currentType ? currentType.name : t('title');
	const pageSubtitle = currentType ? currentType.description : t('subtitle');
	const hasToggle = services.some((service) => service.hasWebliumOption);

	return (
		<>
			<PageHero
				title={pageTitle}
				subtitle={pageSubtitle}
				breadcrumbs={<Breadcrumbs chapter="services" slug={currentType ? currentType.name : undefined} />}
			/>
			<section className="services-page" itemScope itemType="https://schema.org/CollectionPage">
				{/* Назва й опис сторінки для schema.org (видимі — у PageHero) */}
				<meta itemProp="name" content={pageTitle} />
				<meta itemProp="description" content={pageSubtitle} />
				<meta itemProp="numberOfItems" content={String(services.length)} />

				<div className="container container--design">
					<div className="list-toolbar">
						<ServicesFilter activeType={currentType?.slug} serviceTypes={serviceTypes} counts={filterCounts} />
						{hasToggle && (
							<VariantToggle
								value={variant}
								onChange={(next) => {
									setVariant(next);
									setSwitched(true);
								}}
							/>
						)}
					</div>

					{services.length > 0 ? (
						<>
							<ServicesList services={services} variant={variant} animateSwap={switched} />

							<footer className="list-stats">
								<p>{t('showingResults', { count: services.length })}</p>
								{currentType && (
									<Link href="/services" className="pill-btn pill-btn--outline">
										{t('viewAllButton')}
									</Link>
								)}
							</footer>
						</>
					) : (
						<div className="list-empty glass">
							<h2>{t('noResults')}</h2>
							<p>{t('noResultsDescription')}</p>
							<Link href="/services" className="pill-btn pill-btn--gradient">
								{t('viewAllButton')}
							</Link>
						</div>
					)}
				</div>
			</section>
			<ScrollReveal />
		</>
	);
}
