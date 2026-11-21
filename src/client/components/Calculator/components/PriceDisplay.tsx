'use client';

import { JSX, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useCalculator } from '../CalculatorContext';
import { currencyLabel, formatPrice } from '../format';
import './PriceDisplay.scss';

export default function PriceDisplay(): JSX.Element {
  const t = useTranslations('Calculator');
  const { state } = useCalculator();
  const [displayPrice, setDisplayPrice] = useState(0);
  const displayRef = useRef(0);

  // Плавна зміна від поточного показаного значення до нової ціни за 400 мс.
  // Раніше ефект залежав від displayPrice і перезапускався на кожному кроці — число лише
  // наближалося до ціни й зупинялось на неточному значенні (16 256 замість 16 409).
  useEffect(() => {
    const from = displayRef.current;
    const to = state.estimatedPrice;
    if (from === to) return;

    const duration = 400;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = progress === 1 ? to : Math.round(from + (to - from) * eased);
      displayRef.current = value;
      setDisplayPrice(value);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [state.estimatedPrice]);

  const showPrice = !!(state.projectType && state.platform);

  return (
    <div className={`calculator-price ${showPrice ? 'calculator-price--visible' : ''}`}>
      <div className="calculator-price__inner">
        <div>
          <div className="calculator-price__label">{t('priceLabel')}</div>
          <div className="calculator-price__value">
            {state.config?.generalSettings.showPriceFrom && (
              <span className="calculator-price__from">{t('priceFrom')}</span>
            )}
            <span className="calculator-price__amount">
              {formatPrice(displayPrice)}
            </span>
            <span className="calculator-price__currency">
              {currencyLabel(state.config?.generalSettings.currency, t('currency'))}
            </span>
          </div>
        </div>
        {state.estimatedTimeline && (
          <div className="calculator-price__timeline">
            <span className="calculator-price__timeline-label">{t('timelineLabel')}:</span>
            <span className="calculator-price__timeline-value">{state.estimatedTimeline}</span>
          </div>
        )}
      </div>
    </div>
  );
}
