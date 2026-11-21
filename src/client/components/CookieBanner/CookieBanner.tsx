'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Cookie } from 'lucide-react';
import { Link } from '@/client/i18n/navigation';
import { setCookieConsent, useCookieConsent } from '@/client/hooks/useCookieConsent';
import './CookieBanner.scss';

interface CookieBannerProps {
  /** Лишено для сумісності з layout; тексти — з messages (`CookieBanner`) */
  locale?: string;
}

/**
 * Банер згоди на cookies — скляна картка в стилі сайту (як підказка віджета калькулятора):
 * ліворуч унизу на ПК, плаваюча картка з відступами від країв на телефоні.
 * Аналітика вмикається лише після «Прийняти» (useCookieConsent → Analytics).
 */
export default function CookieBanner(_props: CookieBannerProps) {
  const t = useTranslations('CookieBanner');
  const consent = useCookieConsent();
  const [dismissed, setDismissed] = useState(false);

  const handle = (decision: 'accepted' | 'declined') => {
    setDismissed(true);
    setCookieConsent(decision);
  };

  // Показуємо лише коли точно відомо, що рішення ще не було (не на сервері)
  if (dismissed || consent !== null) return null;

  return (
    <div className="cookie-banner" role="region" aria-label={t('ariaLabel')}>
      <div className="cookie-banner__body">
        <span className="cookie-banner__icon" aria-hidden="true">
          <Cookie size={18} />
        </span>
        <div className="cookie-banner__content">
          <p className="cookie-banner__title">{t('title')}</p>
          <p className="cookie-banner__text">
            {t('text')}{' '}
            <Link href="/privacy-policy" className="cookie-banner__link">
              {t('policy')}
            </Link>
          </p>
        </div>
      </div>
      <div className="cookie-banner__actions">
        <button
          type="button"
          className="cookie-banner__btn cookie-banner__btn--decline"
          onClick={() => handle('declined')}
        >
          {t('decline')}
        </button>
        <button
          type="button"
          className="cookie-banner__btn cookie-banner__btn--accept"
          onClick={() => handle('accepted')}
        >
          {t('accept')}
        </button>
      </div>
    </div>
  );
}
