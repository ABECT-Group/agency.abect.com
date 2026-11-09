import type { CalculatorConfig } from '@/payload-types';
import { payloadFetch } from './payload-fetch';

/**
 * Отримує конфігурацію калькулятора з CMS.
 * Помилка запиту прокидається далі (сторінка з помилкою не кешується);
 * `null` — лише якщо global ще не заповнений.
 */
export async function getCalculatorConfig(locale: string = 'uk'): Promise<CalculatorConfig | null> {
  const data = await payloadFetch<CalculatorConfig | null>('/api/globals/calculator-config', { locale, depth: 1 });
  return data ?? null;
}

/**
 * Дефолтна конфігурація калькулятора (використовується якщо API недоступний)
 */
export const defaultCalculatorConfig = {
  projectTypes: [
    {
      name: 'Landing Page',
      slug: 'landing',
      description: 'Односторінковий сайт для продукту або послуги',
      icon: 'layout',
      hasWebliumOption: true,
      webliumBasePrice: 6000,
      customBasePrice: 10000,
      order: 1,
    },
    {
      name: 'Корпоративний сайт',
      slug: 'corporate',
      description: 'Багатосторінковий сайт для компанії',
      icon: 'building',
      hasWebliumOption: true,
      webliumBasePrice: 15000,
      customBasePrice: 25000,
      order: 2,
    },
    {
      name: 'Інтернет-магазин',
      slug: 'shop',
      description: 'Повнофункціональний онлайн-магазин',
      icon: 'store',
      hasWebliumOption: true,
      webliumBasePrice: 25000,
      customBasePrice: 40000,
      order: 3,
    },
    {
      name: 'Веб-додаток',
      slug: 'webapp',
      description: 'Складний веб-додаток з кастомним функціоналом',
      icon: 'globe',
      hasWebliumOption: false,
      customBasePrice: 50000,
      order: 4,
    },
  ],
  pagesConfig: {
    webliumPricePerPage: 500,
    customPricePerPage: 1500,
    minPages: 1,
    maxPages: 30,
    defaultPages: 5,
  },
  additionalServices: [
    {
      name: 'SEO-оптимізація',
      slug: 'seo',
      description: 'Базова SEO оптимізація для пошукових систем',
      price: 3000,
      icon: 'search',
      order: 1,
    },
    {
      name: 'Копірайтинг',
      slug: 'copywriting',
      description: 'Написання текстів для сайту',
      price: 5000,
      icon: 'text',
      order: 2,
    },
    {
      name: 'Мультимовність',
      slug: 'multilang',
      description: 'Підтримка кількох мов на сайті',
      price: 4000,
      icon: 'languages',
      order: 3,
    },
    {
      name: 'Інтеграції',
      slug: 'integrations',
      description: 'CRM, платіжні системи, зовнішні API',
      price: 5000,
      icon: 'plug',
      order: 4,
    },
    {
      name: 'Анімації',
      slug: 'animations',
      description: 'Інтерактивні елементи та мікроанімації',
      price: 3000,
      icon: 'sparkles',
      order: 5,
    },
    {
      name: 'Технічна підтримка',
      slug: 'support',
      description: 'Підтримка та обслуговування після запуску',
      price: 2000,
      icon: 'support',
      order: 6,
    },
  ],
  urgencyOptions: [
    {
      name: 'Терміново',
      slug: 'urgent',
      description: 'Потрібно якнайшвидше',
      coefficient: 1.5,
      timelineText: 'до 2 тижнів',
      order: 1,
    },
    {
      name: 'Стандартно',
      slug: 'standard',
      description: 'Звичайні терміни',
      coefficient: 1.0,
      timelineText: '2-4 тижні',
      order: 2,
    },
    {
      name: 'Не поспішаємо',
      slug: 'relaxed',
      description: 'Можна не поспішати',
      coefficient: 0.9,
      timelineText: '1-2 місяці',
      order: 3,
    },
    {
      name: 'Ще не визначились',
      slug: 'undefined',
      description: 'Поки що невідомо',
      coefficient: 1.0,
      timelineText: 'За домовленістю',
      order: 4,
    },
  ],
  generalSettings: {
    currency: 'UAH',
    showPriceFrom: true,
    minimumOrderPrice: 5000,
  },
};
