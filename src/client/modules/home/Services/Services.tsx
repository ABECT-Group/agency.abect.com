import { JSX } from 'react';
import { getTranslations } from 'next-intl/server';
import { getFeaturedServices } from '@/client/lib/services';
import { Link } from '@/client/i18n/navigation';
import ServicePlans from './ServicePlans';
import './Services.scss';

interface ServicesProps {
	locale: string;
}

// «Послуги та ціни» — Figma «ABECT», Desktop 6. Картки — featured-послуги з CMS (перші три).
export default async function Services({ locale }: ServicesProps): Promise<JSX.Element | null> {
	const t = await getTranslations('HomePage.Services');
	const services = (await getFeaturedServices(locale)).slice(0, 3);

	// Без послуг у CMS секцію не показуємо
	if (services.length === 0) return null;

	return (
		<section className="services" id="services" aria-labelledby="services-title">
			<div className="container container--design">
				<ServicePlans services={services} headingId="services-title" title={t('title')} subtitle={t('subtitle')} />

				<footer className="services__footer" data-reveal="">
					<p className="services__footer-text">{t('footerText')}</p>
					<div className="services__footer-actions">
						<Link href="/calculator" className="pill-btn pill-btn--gradient services__calc" aria-label={t('calculateAriaLabel')}>
							{t('calculateButton')}
						</Link>
						<Link href="/services" className="pill-btn pill-btn--outline services__more">
							{t('moreButton')}
						</Link>
					</div>
				</footer>
			</div>
		</section>
	);
}
