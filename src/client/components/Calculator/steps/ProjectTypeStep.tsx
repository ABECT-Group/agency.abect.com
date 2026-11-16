'use client';

import { JSX } from 'react';
import { useTranslations } from 'next-intl';
import {
  Layout,
  Building2,
  ShoppingCart,
  Globe,
  RefreshCw,
  Smartphone,
  FileCode,
  Palette,
} from 'lucide-react';
import { useCalculator } from '../CalculatorContext';
import OptionCard from '../components/OptionCard';
import './Steps.scss';

// Icon mapping
const iconMap: Record<string, JSX.Element> = {
  layout: <Layout />,
  building: <Building2 />,
  store: <ShoppingCart />,
  globe: <Globe />,
  refresh: <RefreshCw />,
  mobile: <Smartphone />,
  code: <FileCode />,
  palette: <Palette />,
};

export default function ProjectTypeStep(): JSX.Element {
  const t = useTranslations('Calculator.steps.projectType');
  const { state, setProjectType, dispatch } = useCalculator();

  const handleSelect = (slug: string) => {
    setProjectType(slug);
    // Auto-advance after short delay
    // Перехід на конкретний крок, а не «наступний»: подвійний клік інакше перескакував крок
    setTimeout(() => dispatch({ type: 'SET_STEP', payload: 1 }), 300);
  };

  return (
    <div className="calculator-step">
      <div className="calculator-step__header">
        <h2 className="calculator-step__title">{t('title')}</h2>
        <p className="calculator-step__subtitle">{t('subtitle')}</p>
      </div>

      <div className="calculator-step__options calculator-step__options--grid">
        {[...(state.config?.projectTypes ?? [])]
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map((project) => (
            <OptionCard
              key={project.slug}
              title={project.name}
              description={project.description}
              icon={iconMap[project.icon || 'code'] || <FileCode />}
              selected={state.projectType === project.slug}
              onClick={() => handleSelect(project.slug)}
              variant="large"
            />
          ))}
      </div>
    </div>
  );
}
