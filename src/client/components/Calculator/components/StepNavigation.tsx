'use client';

import { JSX } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useCalculator } from '../CalculatorContext';
import './StepNavigation.scss';

interface StepNavigationProps {
  onSubmit?: () => void;
}

export default function StepNavigation({ onSubmit }: StepNavigationProps): JSX.Element {
  const t = useTranslations('Calculator');
  const { state, nextStep, prevStep, canProceed } = useCalculator();

  const isFirstStep = state.currentStep === 0;
  const isLastStep = state.currentStep === state.totalSteps - 1;

  const handleNext = () => {
    if (isLastStep && onSubmit) {
      onSubmit();
    } else {
      nextStep();
    }
  };

  return (
    <div className="calculator-nav">
      {/* Back button */}
      <button
        type="button"
        className="calculator-nav__btn calculator-nav__btn--back"
        onClick={prevStep}
        disabled={isFirstStep || state.isSubmitting}
        aria-label={t('backButton')}
      >
        <ArrowLeft size={20} />
        <span>{t('backButton')}</span>
      </button>

      {/* Next/Submit button */}
      <button
        type="button"
        className={`calculator-nav__btn calculator-nav__btn--next cta ${
          isLastStep ? 'calculator-nav__btn--submit' : ''
        }`}
        onClick={handleNext}
        disabled={!canProceed() || state.isSubmitting}
      >
        {state.isSubmitting ? (
          <>
            <Loader2 size={20} className="calculator-nav__spinner" />
            <span>{t('loadingButton')}</span>
          </>
        ) : (
          <>
            <span>{isLastStep ? t('submitButton') : t('nextButton')}</span>
            {!isLastStep && <ArrowRight size={20} />}
          </>
        )}
      </button>
    </div>
  );
}
