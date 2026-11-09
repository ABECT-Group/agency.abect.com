import { Fragment, JSX } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import './Hero.scss';

export type HeroPrice = { label: string; price: number };

// Ціни з макета. Показуються, поки в CMS (Калькулятор → «Ціни на головній») нічого не задано.
const DEFAULT_PRICES = [
	{ key: 'landing', price: 199 },
	{ key: 'businessCard', price: 399 },
	{ key: 'corporate', price: 799 }
] as const;

const TAGS = ['modern', 'fast', 'adaptive', 'websites'] as const;

type HeroProps = {
	/** Ціни з CMS (`calculator-config.heroPrices`); порожньо / null — дефолтні з макета */
	prices?: HeroPrice[] | null;
};

// Серверний компонент: інтерактивності немає (модалку відкриває глобальний обробник data-open-modal).
export default function Hero({ prices }: HeroProps): JSX.Element {
	const t = useTranslations('HomePage.Hero');

	const priceItems: HeroPrice[] = prices?.length
		? prices
		: DEFAULT_PRICES.map((item) => ({ label: t(`defaultPrices.${item.key}`), price: item.price }));

	return (
		<section className="hero">
			<div className="hero__bg" aria-hidden="true" />

			{/* .container і .hero__inner — на різних елементах: padding у .container інакше перекриває відступи hero */}
			<div className="container container--design">
				<div className="hero__inner">
					<p className="hero__text">{t('description')}</p>

					<div className="hero__cta">
						<button type="button" data-open-modal className="hero__order">
							<span className="hero__order-label">{t('orderButton')}</span>
							{/* Стрілка — скляне коло поверх кнопки (у макеті — матове розмиття) */}
							<span className="hero__order-arrow hero__order-arrow--desktop glass">
								<Image src="/icons/arrow-36.svg" alt="" width={36} height={36} />
							</span>
							<span className="hero__order-arrow hero__order-arrow--mobile glass">
								<Image src="/icons/arrow-39.svg" alt="" width={39} height={39} />
							</span>
						</button>
					</div>

					<ul className="hero__tags" aria-label={t('tagsAriaLabel')}>
						{TAGS.map((tag, index) => (
							<Fragment key={tag}>
								{/* Перенос після другого тегу — два рядки по два (Hero.scss) */}
								{index === 2 && <li className="hero__tags-break" role="presentation" aria-hidden="true" />}
								<li className={`hero__tag hero__tag--${tag}`}>{t(`tags.${tag}`)}</li>
							</Fragment>
						))}
					</ul>

					<div className="hero__visual">
						<Image
							src="/images/hero/laptop.png"
							alt={t('imageAlt')}
							width={698}
							height={813}
							priority
							sizes="(max-width: 768px) 100vw, 627px"
						/>
					</div>

					<h1 className="hero__title">
						<span className="hero__title-row">
							<span className="hero__title-lead">{t('titleLead')}</span>{' '}
							<span className="hero__title-accent">{t('titleAccent')}</span>
						</span>{' '}
						<span className="hero__title-tail">{t('titleTail')}</span>
					</h1>

					<ul className="hero__prices" aria-label={t('pricesAriaLabel')}>
						{priceItems.map((item) => (
							<li key={item.label} className="hero__price glass">
								<span>{item.label}</span>
								<span className="hero__price-value">{t('priceFormat', { price: item.price })}</span>
							</li>
						))}
					</ul>
				</div>
			</div>
		</section>
	);
}
