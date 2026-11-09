'use client';

import { JSX } from 'react';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import type { Service } from '@/payload-types';
import './PricingComparison.scss';

interface PricingComparisonProps {
	service: Service;
	locale: string;
}

export default function PricingComparison({ service, locale: _locale }: PricingComparisonProps): JSX.Element {
	const t = useTranslations('ServiceDetail.pricing');

	return (
		<section className="pricing-comparison">
			<div className="container">
				<header className="pricing-comparison__header">
					<h2 className="pricing-comparison__title">{t('title')}</h2>
					<p className="pricing-comparison__subtitle">{t('subtitle')}</p>
				</header>

				<div className="pricing-comparison__grid">
					{/* Weblium Column */}
					<div className="pricing-comparison__column">
						<div className="pricing-comparison__card pricing-comparison__card--weblium">
							<div className="pricing-comparison__card-header">
								<h3 className="pricing-comparison__card-title">Weblium</h3>
								<div className="pricing-comparison__card-price">
									<span className="price-amount">{service.webliumPrice}</span>
									<span className="price-currency">{service.webliumPriceCurrency}</span>
								</div>
								<p className="pricing-comparison__card-timeline">
									{t('timeline')}: {service.webliumTimeline}
								</p>
							</div>

							<div className="pricing-comparison__card-body">
								<p className="pricing-comparison__card-description">
									{service.webliumDescription}
								</p>

								<ul className="pricing-comparison__features">
									{service.webliumFeatures?.map((item, index) => (
										<li key={index}>
											<Check size={18} />
											<span>{item.feature}</span>
										</li>
									))}
								</ul>
							</div>

							<div className="pricing-comparison__card-footer">
								<button type="button" data-open-modal className="cta cta-secondary">
									{t('orderWeblium')}
								</button>
							</div>
						</div>
					</div>

					{/* Custom Column */}
					<div className="pricing-comparison__column">
						<div className="pricing-comparison__card pricing-comparison__card--custom">
							<div className="pricing-comparison__badge">{t('recommended')}</div>

							<div className="pricing-comparison__card-header">
								<h3 className="pricing-comparison__card-title">Custom</h3>
								<div className="pricing-comparison__card-price">
									<span className="price-amount">{service.customPrice}</span>
									<span className="price-currency">{service.customPriceCurrency}</span>
								</div>
								<p className="pricing-comparison__card-timeline">
									{t('timeline')}: {service.customTimeline}
								</p>
							</div>

							<div className="pricing-comparison__card-body">
								<p className="pricing-comparison__card-description">
									{service.customDescription}
								</p>

								<ul className="pricing-comparison__features">
									{service.customFeatures?.map((item, index) => (
										<li key={index}>
											<Check size={18} />
											<span>{item.feature}</span>
										</li>
									))}
								</ul>
							</div>

							<div className="pricing-comparison__card-footer">
								<button type="button" data-open-modal className="cta">
									{t('orderCustom')}
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
