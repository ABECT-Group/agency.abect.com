'use client';

import { CSSProperties, JSX } from 'react';
import { useTranslations } from 'next-intl';
import { serviceVariants, type CardService } from '@/client/lib/cards';
import SectionHeading from '@/client/components/SectionHeading/SectionHeading';
import PlanCard from '@/client/components/PlanCard/PlanCard';
import './PricingComparison.scss';

interface PricingComparisonProps {
	service: CardService;
	locale: string;
}

// Ціни й склад послуги — картки PlanCard: «Розробка кодом» (виділена) і, якщо є, «На конструкторі»
export default function PricingComparison({ service }: PricingComparisonProps): JSX.Element {
	const t = useTranslations('ServiceDetail.pricing');
	const tVariants = useTranslations('HomePage.Services.variants');
	const variants = serviceVariants(service);

	return (
		<section className="pricing-comparison" aria-labelledby="pricing-title">
			<div className="container container--design">
				<SectionHeading
					id="pricing-title"
					size="md"
					title={variants.length > 1 ? t('title') : t('singleTitle')}
					subtitle={t('subtitle')}
				/>

				<ul className={`pricing-comparison__grid pricing-comparison__grid--${variants.length}`}>
					{variants.map((variant, index) => (
						<li key={variant} data-reveal="" style={{ '--reveal-delay': `${0.08 * index}s` } as CSSProperties}>
							<PlanCard
								service={service}
								index={index}
								variant={variant}
								accent={variant === 'custom'}
								heading={tVariants(variant)}
								showDetails={false}
							/>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}
