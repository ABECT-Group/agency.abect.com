'use client';

import { JSX } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/client/i18n/navigation';
import { useCalculator } from '../CalculatorContext';
import { currencyLabel, formatPrice } from '../format';
import { isValidContact } from '@/client/lib/leads';
import './Steps.scss';

export default function ContactStep(): JSX.Element {
  const t = useTranslations('Calculator.steps.contact');
  const tForm = useTranslations('ContactForm');
  const tCalc = useTranslations('Calculator');
  const { state, setName, setContact, setMessage, setPrivacyAccepted } = useCalculator();

  const nameError = state.name.length > 0 && state.name.length < 2;
  const contactError = state.contact.length > 0 && !isValidContact(state.contact);

  return (
    <div className="calculator-step">
      <div className="calculator-step__header">
        <h2 className="calculator-step__title">{t('title')}</h2>
        <p className="calculator-step__subtitle">{t('subtitle')}</p>
      </div>

      {/* Summary */}
      <div className="calculator-step__summary">
        <div className="calculator-step__summary-row">
          <span>{t('summaryProjectType')}:</span>
          <strong>
            {state.config?.projectTypes.find((p) => p.slug === state.projectType)?.name || '-'}
          </strong>
        </div>
        <div className="calculator-step__summary-row">
          <span>{t('summaryPlatform')}:</span>
          <strong>{state.platform === 'weblium' ? 'Weblium' : 'Custom'}</strong>
        </div>
        <div className="calculator-step__summary-row">
          <span>{t('summaryPages')}:</span>
          <strong>{state.pagesCount}</strong>
        </div>
        {state.additionalServices.length > 0 && (
          <div className="calculator-step__summary-row">
            <span>{t('summaryAddons')}:</span>
            <strong>
              {state.additionalServices
                .map(
                  (slug) =>
                    state.config?.additionalServices.find((s) => s.slug === slug)?.name || slug
                )
                .join(', ')}
            </strong>
          </div>
        )}
        <div className="calculator-step__summary-row">
          <span>{t('summaryTimeline')}:</span>
          <strong>
            {state.config?.urgencyOptions.find((u) => u.slug === state.urgency)?.name || '-'}
          </strong>
        </div>
        <div className="calculator-step__summary-row calculator-step__summary-row--total">
          <span>{t('summaryPrice')}:</span>
          <strong>{t('summaryPriceFrom')} {formatPrice(state.estimatedPrice)} {currencyLabel(state.config?.generalSettings.currency, tCalc('currency'))}</strong>
        </div>
      </div>

      {/* Contact form */}
      <div className="calculator-step__form">
        <div className={`calculator-step__field ${nameError ? 'calculator-step__field--error' : ''}`}>
          <label htmlFor="calc-name">{tForm('nameLabel')}</label>
          <input
            type="text"
            id="calc-name"
            value={state.name}
            onChange={(e) => setName(e.target.value)}
            placeholder={tForm('namePlaceholder')}
            autoComplete="name"
          />
          {nameError && (
            <span className="calculator-step__field-error">{tForm('validation.nameRequired')}</span>
          )}
        </div>

        <div className={`calculator-step__field ${contactError ? 'calculator-step__field--error' : ''}`}>
          <label htmlFor="calc-contact">{tForm('contactLabel')}</label>
          <input
            type="text"
            id="calc-contact"
            value={state.contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder={tForm('contactPlaceholder')}
            autoComplete="on"
          />
          {contactError && (
            <span className="calculator-step__field-error">{tForm('validation.contactInvalid')}</span>
          )}
        </div>

        <div className="calculator-step__field">
          <label htmlFor="calc-message">{tForm('messageLabel')}</label>
          <textarea
            id="calc-message"
            value={state.message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={tForm('messagePlaceholder')}
            rows={3}
          />
        </div>

        <label className={`contact-modal__privacy-check ${!state.privacyAccepted && state.name.length > 0 ? 'contact-modal__privacy-check--error' : ''}`}>
          <input
            type="checkbox"
            checked={state.privacyAccepted}
            onChange={(e) => setPrivacyAccepted(e.target.checked)}
          />
          <span>
            {tForm('privacyCheckbox')}{' '}
            <Link href="/privacy-policy" target="_blank" className="contact-modal__privacy-link">
              {tForm('privacyLink')}
            </Link>
          </span>
        </label>
      </div>
    </div>
  );
}
