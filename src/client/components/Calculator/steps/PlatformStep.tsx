'use client';

import { JSX, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Blocks, Code } from 'lucide-react';
import { useCalculator } from '../CalculatorContext';
import OptionCard from '../components/OptionCard';
import './Steps.scss';

export default function PlatformStep(): JSX.Element {
  const t = useTranslations('Calculator.steps.platform');
  const { state, setPlatform, dispatch, getSelectedProjectType } = useCalculator();

  const selectedProject = getSelectedProjectType();
  const hasWebliumOption = selectedProject?.hasWebliumOption ?? false;

  const handleSelect = (platform: 'weblium' | 'custom') => {
    setPlatform(platform);
    // Перехід на конкретний крок, а не «наступний»: подвійний клік інакше перескакував крок
    setTimeout(() => dispatch({ type: 'SET_STEP', payload: 2 }), 300);
  };

  // Без варіанта на конструкторі — лише Custom. Оновлення стану не під час рендеру, а в ефекті
  // (setState у рендері дає попередження React «Cannot update a component while rendering»).
  const needsCustom = !hasWebliumOption && state.platform !== 'custom';
  useEffect(() => {
    if (needsCustom) setPlatform('custom');
  }, [needsCustom, setPlatform]);

  if (!hasWebliumOption) {
    return (
      <div className="calculator-step">
        <div className="calculator-step__header">
          <h2 className="calculator-step__title">{t('title')}</h2>
          <p className="calculator-step__subtitle">
            Для цього типу проекту доступна тільки Custom розробка
          </p>
        </div>

        <div className="calculator-step__options calculator-step__options--two">
          <OptionCard
            title={t('custom.title')}
            description={t('custom.description')}
            icon={<Code />}
            selected={true}
            variant="large"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="calculator-step">
      <div className="calculator-step__header">
        <h2 className="calculator-step__title">{t('title')}</h2>
        <p className="calculator-step__subtitle">{t('subtitle')}</p>
      </div>

      <div className="calculator-step__options calculator-step__options--two">
        <OptionCard
          title={t('weblium.title')}
          description={t('weblium.description')}
          icon={<Blocks />}
          selected={state.platform === 'weblium'}
          onClick={() => handleSelect('weblium')}
          variant="large"
          price={selectedProject?.webliumBasePrice
            ? `від ${selectedProject.webliumBasePrice.toLocaleString('uk-UA')} грн`
            : undefined
          }
        />
        <OptionCard
          title={t('custom.title')}
          description={t('custom.description')}
          icon={<Code />}
          selected={state.platform === 'custom'}
          onClick={() => handleSelect('custom')}
          variant="large"
          price={selectedProject?.customBasePrice
            ? `від ${selectedProject.customBasePrice.toLocaleString('uk-UA')} грн`
            : undefined
          }
        />
      </div>
    </div>
  );
}
