'use client';

import { JSX } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import type { Service, ServiceType } from '@/payload-types';
import { Link } from '@/client/i18n/navigation';
import ArrowButton from '../ArrowButton/ArrowButton';
import FloatingDecor from '../FloatingDecor/FloatingDecor';
import './PlanCard.scss';

export type PlanVariant = 'custom' | 'weblium';

type PlanCardProps = {
	service: Service;
	/** Порядковий номер (01 / …) і декор картки */
	index: number;
	variant: PlanVariant;
	/** Виділена картка (синя рамка) */
	accent?: boolean;
	/** Плавна зміна вмісту при перемиканні варіанта (не на першому рендері) */
	animateSwap?: boolean;
	/** Посилання «Детальніше» на сторінку послуги (на самій сторінці послуги — false) */
	showDetails?: boolean;
	/** Підпис картки замість назви послуги (наприклад, «Розробка кодом» у порівнянні варіантів) */
	heading?: string;
};

// Декоративні 3D-об'єкти з макета — по черзі на картках
const DECOR = ['drip', 'blob', 'spiral'] as const;

// Позначення валют; гривня — «грн» українською, «UAH» англійською
const currencySign = (currency: string, locale: string): string =>
	({ USD: '$', EUR: '€', UAH: locale === 'en' ? 'UAH' : 'грн' } as Record<string, string>)[currency] ?? currency;

// Ціна-картка послуги (Figma «ABECT»: «01 / Лендінг», «від 120 $»…). Дані — з колекції services.
export default function PlanCard({
	service,
	index,
	variant,
	accent = false,
	animateSwap = false,
	showDetails = true,
	heading
}: PlanCardProps): JSX.Element {
	const t = useTranslations('HomePage.Services');
	const locale = useLocale();

	const isWeblium = variant === 'weblium';
	const price = isWeblium ? service.webliumPrice : service.customPrice;
	const currency = (isWeblium ? service.webliumPriceCurrency : service.customPriceCurrency) ?? 'UAH';
	const description = isWeblium ? service.webliumDescription : service.customDescription;
	const features = (isWeblium ? service.webliumFeatures : service.customFeatures) ?? [];
	const timeline = isWeblium ? service.webliumTimeline : service.customTimeline;
	const priceUah = isWeblium ? service.webliumPriceUah : service.customPriceUah;
	const extraCosts = isWeblium ? service.webliumExtraCosts : service.customExtraCosts;
	// У картці до 4 пунктів: переваги, а якщо їх менше — ще й термін виконання (як у макеті)
	const items = features
		.slice(0, 4)
		.map((item) => item.feature)
		.filter((feature): feature is string => Boolean(feature));
	if (timeline && items.length < 4) items.push(t('timeline', { timeline }));

	const serviceType = service.serviceType as ServiceType | null;
	const href = `/services/${serviceType?.slug || 'other'}/${service.slug}`;
	const number = String(index + 1).padStart(2, '0');
	const decor = DECOR[index % DECOR.length];
	const numberFormat = new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'uk-UA');
	const formattedPrice = price != null ? numberFormat.format(price) : null;
	// Довідкова ціна в гривнях — лише якщо основна в іншій валюті
	const formattedUah = priceUah != null && currency !== 'UAH' ? numberFormat.format(priceUah) : null;

	return (
		<article
			className={`plan-card${accent ? ' plan-card--accent' : ''}${animateSwap ? ' plan-card--swap' : ''}`}
			aria-labelledby={`plan-${service.slug}`}
			itemScope
			itemType="https://schema.org/Service"
		>
			<FloatingDecor
				className={`plan-card__decor plan-card__decor--${decor}`}
				src={`/images/decor/${decor}.png`}
				width={240}
				height={240}
				revealDelay={0.15 + 0.08 * index}
			/>

			<h3 className="plan-card__title" id={`plan-${service.slug}`}>
				<span className="plan-card__number">{number} / </span>
				<span itemProp="name">{heading ?? service.title}</span>
			</h3>

			{formattedPrice && (
				<p className="plan-card__price" itemProp="offers" itemScope itemType="https://schema.org/Offer">
					<span className="plan-card__price-from">{t('priceFrom')}</span>
					<span className="plan-card__price-value" key={`price-${variant}`}>
						{formattedPrice} {currencySign(currency, locale)}
					</span>
					{formattedUah && (
						<span className="plan-card__price-alt" key={`alt-${variant}`}>
							<span className="plan-card__price-from">{t('priceFrom')}</span> {formattedUah} {currencySign('UAH', locale)}
						</span>
					)}
					<meta itemProp="price" content={String(price)} />
					<meta itemProp="priceCurrency" content={currency} />
				</p>
			)}

			{description && (
				<p className="plan-card__description" itemProp="description" key={`desc-${variant}`}>
					{description}
				</p>
			)}

			<ul className="plan-card__features" key={`features-${variant}`}>
				{items.map((item) => (
					<li key={item}>{item}</li>
				))}
			</ul>

			{extraCosts && (
				<p className="plan-card__extra" key={`extra-${variant}`}>
					{extraCosts}
				</p>
			)}

			<div className="plan-card__actions">
				<ArrowButton size="sm" tone="strong" ariaLabel={t('orderAriaLabel', { title: service.title })}>
					{t('orderButton')}
				</ArrowButton>
				{showDetails && (
					<Link href={href} className="plan-card__more">
						{t('detailsLink')}
						<Image src="/icons/arrow-link.svg" alt="" width={14} height={15} aria-hidden="true" />
					</Link>
				)}
			</div>
		</article>
	);
}
