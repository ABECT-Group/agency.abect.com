'use client';

import { JSX } from 'react';
import { useTranslations } from 'next-intl';
import { RotateCcw } from 'lucide-react';
import { useRouter } from '@/client/i18n/navigation';
import { useCalculator, CalculatorConfig } from './CalculatorContext';
import { submitLead, createThxToken } from '@/client/lib/leads';
import ProgressBar from './components/ProgressBar';
import PriceDisplay from './components/PriceDisplay';
import StepNavigation from './components/StepNavigation';
import ProjectTypeStep from './steps/ProjectTypeStep';
import PlatformStep from './steps/PlatformStep';
import PagesStep from './steps/PagesStep';
import AddonsStep from './steps/AddonsStep';
import UrgencyStep from './steps/UrgencyStep';
import ContactStep from './steps/ContactStep';
import './Calculator.scss';

interface CalculatorContentProps {
  config: CalculatorConfig;
  /** Компактний вигляд для віджета: без заголовка сторінки (H1) і контейнера — заголовок дає панель */
  compact?: boolean;
}

function CalculatorContent({ config, compact = false }: CalculatorContentProps): JSX.Element {
  const t = useTranslations('Calculator');
  const tForm = useTranslations('ContactForm');
  const router = useRouter();
  const { state, dispatch, reset } = useCalculator();

  const handleSubmit = async () => {
    dispatch({ type: 'SET_SUBMITTING', payload: true });
    dispatch({ type: 'SET_SUBMIT_ERROR', payload: null });

    try {
      const result = await submitLead({
        type: 'calculator',
        name: state.name.trim(),
        contact: state.contact.trim(),
        message: state.message.trim() || undefined,
        calculatorData: {
          projectType: state.projectType || '',
          projectTypeName: config.projectTypes.find((p) => p.slug === state.projectType)?.name,
          platform: state.platform || 'custom',
          pagesCount: state.pagesCount,
          additionalServices: state.additionalServices,
          additionalServicesNames: state.additionalServices.map(
            (slug) => config.additionalServices.find((s) => s.slug === slug)?.name || slug
          ),
          urgency: state.urgency || '',
          urgencyName: config.urgencyOptions.find((u) => u.slug === state.urgency)?.name,
          estimatedPrice: state.estimatedPrice,
          estimatedTimeline: state.estimatedTimeline,
        },
      });

      if (result.success) {
        const token = createThxToken();
        router.push(`/thx?form=calculator&token=${token}`);
      } else {
        dispatch({ type: 'SET_SUBMIT_ERROR', payload: result.error || tForm('errorMessage') });
      }
    } catch {
      dispatch({ type: 'SET_SUBMIT_ERROR', payload: tForm('errorMessage') });
    } finally {
      dispatch({ type: 'SET_SUBMITTING', payload: false });
    }
  };

  const renderStep = () => {
    switch (state.currentStep) {
      case 0: return <ProjectTypeStep />;
      case 1: return <PlatformStep />;
      case 2: return <PagesStep />;
      case 3: return <AddonsStep />;
      case 4: return <UrgencyStep />;
      case 5: return <ContactStep />;
      default: return null;
    }
  };

  return (
    <div className={`calculator${compact ? ' calculator--compact' : ''}`}>
      <div className={compact ? undefined : 'container'}>
        {!compact && (
          <header className="calculator__header">
            <span className="calculator__badge">{t('badge')}</span>
            <h1 className="calculator__title">{t('title')}</h1>
            <p className="calculator__subtitle">{t('subtitle')}</p>
          </header>
        )}

        <div className="calculator__card">
          <div className="calculator__card-top">
            <ProgressBar />
            {(state.projectType || state.currentStep > 0) && (
              <button
                type="button"
                className="calculator__reset"
                onClick={reset}
                aria-label={t('resetButton')}
              >
                <RotateCcw size={16} />
                <span>{t('resetButton')}</span>
              </button>
            )}
          </div>

          {state.submitError && (
            <div className="calculator__error">{state.submitError}</div>
          )}

          <div className="calculator__content">
            {renderStep()}
          </div>

          <PriceDisplay />

          <StepNavigation onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  );
}

export default function Calculator({ config, compact = false }: { config: CalculatorConfig; compact?: boolean }): JSX.Element {
  return <CalculatorContent config={config} compact={compact} />;
}
