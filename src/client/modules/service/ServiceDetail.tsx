import React, { JSX } from 'react';
import type { Service, ServiceType } from '@/payload-types';
import ScrollReveal from '@/client/components/ScrollReveal/ScrollReveal';

import ServiceHero from './ServiceHero/ServiceHero';
import PricingComparison from './PricingComparison/PricingComparison';
import ServiceContent from './ServiceContent/ServiceContent';
import PortfolioShowcase from './PortfolioShowcase/PortfolioShowcase';
import FAQSection from './FAQSection/FAQSection';
import RelatedServices from './RelatedServices/RelatedServices';

interface ServiceDetailProps {
	service: Service;
	relatedServices: Service[];
	locale: string;
	serviceType?: ServiceType;
}

// Сторінка послуги в стилі нового дизайну: шапка → ціни (PlanCard) → опис → роботи → схожі послуги → FAQ
function ServiceDetail({ service, relatedServices, locale, serviceType }: ServiceDetailProps): JSX.Element {
	return (
		<main className="service-detail">
			<ServiceHero service={service} locale={locale} serviceType={serviceType} />

			{/* Ціни — завжди: одна картка або дві («кодом» і «на конструкторі») */}
			<PricingComparison service={service} locale={locale} />

			<ServiceContent service={service} />

			{service.relatedPortfolioProjects && service.relatedPortfolioProjects.length > 0 && (
				<PortfolioShowcase projects={service.relatedPortfolioProjects} locale={locale} />
			)}

			<RelatedServices services={relatedServices} locale={locale} />

			{service.faq && service.faq.length > 0 && <FAQSection faq={service.faq} />}

			<ScrollReveal />
		</main>
	);
}

export default ServiceDetail;
