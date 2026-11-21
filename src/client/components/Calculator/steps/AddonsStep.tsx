'use client';

import { JSX } from 'react';
import { useTranslations } from 'next-intl';
import {
  Search,
  FileText,
  Languages,
  Plug,
  Sparkles,
  HeadphonesIcon,
  BarChart,
  Shield,
} from 'lucide-react';
import { useCalculator } from '../CalculatorContext';
import OptionCard from '../components/OptionCard';
import { currencyLabel, formatPrice } from '../format';
import './Steps.scss';

// Icon mapping
const iconMap: Record<string, JSX.Element> = {
  search: <Search />,
  seo: <Search />,
  text: <FileText />,
  copywriting: <FileText />,
  languages: <Languages />,
  multilang: <Languages />,
  plug: <Plug />,
  integrations: <Plug />,
  sparkles: <Sparkles />,
  animations: <Sparkles />,
  support: <HeadphonesIcon />,
  analytics: <BarChart />,
  security: <Shield />,
};

export default function AddonsStep(): JSX.Element {
  const t = useTranslations('Calculator.steps.addons');
  const tCalc = useTranslations('Calculator');
  const { state, toggleService } = useCalculator();
  const currency = currencyLabel(state.config?.generalSettings.currency, tCalc('currency'));

  return (
    <div className="calculator-step">
      <div className="calculator-step__header">
        <h2 className="calculator-step__title">{t('title')}</h2>
        <p className="calculator-step__subtitle">{t('subtitle')}</p>
      </div>

      <div className="calculator-step__options calculator-step__options--list">
        {state.config?.additionalServices
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map((service) => (
            <OptionCard
              key={service.slug}
              title={service.name}
              description={service.description}
              icon={iconMap[service.icon || service.slug] || <Plug />}
              selected={state.additionalServices.includes(service.slug)}
              onClick={() => toggleService(service.slug)}
              variant="checkbox"
              price={`+${formatPrice(service.price)} ${currency}`}
            />
          ))}
      </div>
    </div>
  );
}
