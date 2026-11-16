'use client';

import { JSX } from 'react';
import { useTranslations } from 'next-intl';
import { Zap, Clock, Calendar, HelpCircle } from 'lucide-react';
import { useCalculator } from '../CalculatorContext';
import OptionCard from '../components/OptionCard';
import './Steps.scss';

// Icon mapping based on coefficient
const getUrgencyIcon = (coefficient: number): JSX.Element => {
  if (coefficient >= 1.3) return <Zap />;
  if (coefficient >= 1.0) return <Clock />;
  if (coefficient >= 0.8) return <Calendar />;
  return <HelpCircle />;
};

export default function UrgencyStep(): JSX.Element {
  const t = useTranslations('Calculator.steps.urgency');
  const { state, setUrgency, dispatch } = useCalculator();

  const handleSelect = (slug: string) => {
    setUrgency(slug);
    // Перехід на конкретний крок, а не «наступний»: подвійний клік інакше перескакував крок
    setTimeout(() => dispatch({ type: 'SET_STEP', payload: 5 }), 300);
  };

  return (
    <div className="calculator-step">
      <div className="calculator-step__header">
        <h2 className="calculator-step__title">{t('title')}</h2>
        <p className="calculator-step__subtitle">{t('subtitle')}</p>
      </div>

      <div className="calculator-step__options calculator-step__options--list">
        {state.config?.urgencyOptions
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map((option) => {
            const coefficientLabel =
              option.coefficient > 1
                ? `+${Math.round((option.coefficient - 1) * 100)}%`
                : option.coefficient < 1
                ? `-${Math.round((1 - option.coefficient) * 100)}%`
                : '';

            return (
              <OptionCard
                key={option.slug}
                title={option.name}
                description={option.description || option.timelineText}
                icon={getUrgencyIcon(option.coefficient)}
                selected={state.urgency === option.slug}
                onClick={() => handleSelect(option.slug)}
                price={coefficientLabel}
              />
            );
          })}
      </div>
    </div>
  );
}
