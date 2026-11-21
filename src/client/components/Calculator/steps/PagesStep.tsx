'use client';

import { JSX } from 'react';
import { useTranslations } from 'next-intl';
import { useCalculator } from '../CalculatorContext';
import './Steps.scss';

export default function PagesStep(): JSX.Element {
  const t = useTranslations('Calculator.steps.pages');
  const { state, setPagesCount } = useCalculator();

  const min = state.config?.pagesConfig.minPages || 1;
  const max = state.config?.pagesConfig.maxPages || 30;

  // Labels for slider
  const getLabel = (value: number): string => {
    if (value <= 3) return t('sizes.mini');
    if (value <= 7) return t('sizes.standard');
    if (value <= 15) return t('sizes.extended');
    if (value <= 30) return t('sizes.large');
    return t('sizes.corporate');
  };

  const progress = ((state.pagesCount - min) / (max - min)) * 100;

  return (
    <div className="calculator-step">
      <div className="calculator-step__header">
        <h2 className="calculator-step__title">{t('title')}</h2>
        <p className="calculator-step__subtitle">{t('subtitle')}</p>
      </div>

      <div className="calculator-step__slider">
        {/* Value display */}
        <div className="calculator-step__slider-value">
          <span className="calculator-step__slider-number">{state.pagesCount}</span>
          <span className="calculator-step__slider-label">{t('pagesLabel')}</span>
        </div>

        {/* Size label */}
        <div className="calculator-step__slider-size">
          {getLabel(state.pagesCount)}
        </div>

        {/* Slider */}
        <div className="calculator-step__slider-track">
          <input
            type="range"
            min={min}
            max={max}
            value={state.pagesCount}
            onChange={(e) => setPagesCount(Number(e.target.value))}
            className="calculator-step__slider-input"
            style={{
              '--progress': `${progress}%`,
            } as React.CSSProperties}
          />
        </div>

        {/* Labels */}
        <div className="calculator-step__slider-labels">
          <span>{min}</span>
          <span>{Math.round((max - min) / 4 + min)}</span>
          <span>{Math.round((max - min) / 2 + min)}</span>
          <span>{Math.round(((max - min) / 4) * 3 + min)}</span>
          <span>{max}+</span>
        </div>
      </div>
    </div>
  );
}
