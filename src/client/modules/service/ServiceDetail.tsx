import React, { JSX } from 'react';
import type { Service, ServiceType } from '@/payload-types';
import ScrollReveal from '@/client/components/ScrollReveal/ScrollReveal';

import ServiceHero from './ServiceHero/ServiceHero';
import PricingComparison from './PricingComparison/PricingComparison';
import ServiceContent from './ServiceContent/ServiceContent';
import PortfolioShowcase from './PortfolioShowcase/PortfolioShowcase';
import FAQSection from './FAQSection/FAQSection';
import RelatedServices from './RelatedServices/RelatedServices';
import { toCardService } from '@/client/lib/cards';

interface ServiceDetailProps {
	service: Service;
	relatedServices: Service[];
	locale: string;
	serviceType?: ServiceType;
}

// Сторінка послуги в стилі нового дизайну: шапка → ціни (PlanCard) → опис → роботи → схожі послуги → FAQ
function ServiceDetail({ service, relatedServices, locale, serviceType }: ServiceDetailProps): JSX.Element {
	// У клієнтські компоненти — лише поля картки, не весь документ (ISS-049)
	const card = toCardService(service);
	return (
		<main className="service-detail">
			<ServiceHero service={card} locale={locale} serviceType={serviceType} />

			{/* Ціни — завжди: одна картка або дві («кодом» і «на конструкторі») */}
			<PricingComparison service={card} locale={locale} />

			<ServiceContent service={{ detailedDescription: service.detailedDescription }} />

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
