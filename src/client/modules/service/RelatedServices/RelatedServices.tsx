import { JSX } from 'react';
import { Link } from '@/client/i18n/navigation';
import { useTranslations } from 'next-intl';
import ServicesList from '@/client/components/ServicesList/ServicesList';
import SectionHeading from '@/client/components/SectionHeading/SectionHeading';
import type { Service } from '@/payload-types';
import './RelatedServices.scss';

interface RelatedServicesProps {
	services: Service[];
	locale: string;
}

// «Схожі послуги» — заголовок нового дизайну з посиланням праворуч і картки PlanCard
export default function RelatedServices({ services }: RelatedServicesProps): JSX.Element | null {
	const t = useTranslations('ServiceDetail.related');

	if (services.length === 0) return null;

	return (
		<section className="related-services" aria-labelledby="related-services-title">
			<div className="container container--design">
				<SectionHeading
					id="related-services-title"
					size="md"
					title={t('title')}
					subtitle={t('subtitle')}
					aside={
						<Link href="/services" className="pill-btn pill-btn--outline">
							{t('viewAll')}
						</Link>
					}
				/>

				<ServicesList className="related-services__list" services={services} />
			</div>
		</section>
	);
}
