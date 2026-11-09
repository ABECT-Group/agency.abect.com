import type { GlobalConfig } from 'payload'
import { revalidateAll } from '../hooks/revalidate'
import { adminOnly } from '../access'

export const CalculatorConfig: GlobalConfig = {
  slug: 'calculator-config',
  label: 'Калькулятор',
  hooks: {
    afterChange: [revalidateAll],
  },
  admin: {
    group: 'Налаштування',
  },
  access: {
    read: () => true,
    update: adminOnly, // ціни калькулятора змінюють лише admin і superadmin
  },
  fields: [
    // ============ ТИПИ ПРОЕКТІВ ============
    {
      name: 'projectTypes',
      type: 'array',
      label: 'Типи проектів',
      labels: {
        singular: 'Тип проекту',
        plural: 'Типи проектів',
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          label: 'Назва',
          localized: true,
          admin: {
            description: 'Наприклад: "Landing Page"',
          },
        },
        {
          name: 'slug',
          type: 'text',
          required: true,
          label: 'Slug',
          admin: {
            description: 'Унікальний ідентифікатор: "landing"',
          },
        },
        {
          name: 'description',
          type: 'textarea',
          label: 'Опис',
          localized: true,
        },
        {
          name: 'icon',
          type: 'text',
          label: 'Іконка',
          admin: {
            description: 'Назва іконки з Lucide: "layout", "store", "globe"',
          },
        },
        {
          name: 'hasWebliumOption',
          type: 'checkbox',
          label: 'Доступний на Weblium',
          defaultValue: true,
        },
        {
          name: 'webliumBasePrice',
          type: 'number',
          label: 'Базова ціна Weblium (грн)',
          admin: {
            condition: (data, siblingData) => siblingData.hasWebliumOption,
          },
        },
        {
          name: 'customBasePrice',
          type: 'number',
          required: true,
          label: 'Базова ціна Custom (грн)',
        },
        {
          name: 'order',
          type: 'number',
          label: 'Порядок',
          defaultValue: 0,
        },
      ],
    },

    // ============ ЦІНИ ЗА СТОРІНКИ ============
    {
      name: 'pagesConfig',
      type: 'group',
      label: 'Налаштування сторінок',
      fields: [
        {
          name: 'webliumPricePerPage',
          type: 'number',
          required: true,
          label: 'Ціна за сторінку (Weblium)',
          defaultValue: 500,
        },
        {
          name: 'customPricePerPage',
          type: 'number',
          required: true,
          label: 'Ціна за сторінку (Custom)',
          defaultValue: 1500,
        },
        {
          name: 'minPages',
          type: 'number',
          required: true,
          label: 'Мінімум сторінок',
          defaultValue: 1,
        },
        {
          name: 'maxPages',
          type: 'number',
          required: true,
          label: 'Максимум сторінок',
          defaultValue: 30,
        },
        {
          name: 'defaultPages',
          type: 'number',
          required: true,
          label: 'Значення за замовчуванням',
          defaultValue: 5,
        },
      ],
    },

    // ============ ДОДАТКОВІ ПОСЛУГИ ============
    {
      name: 'additionalServices',
      type: 'array',
      label: 'Додаткові послуги',
      labels: {
        singular: 'Послуга',
        plural: 'Додаткові послуги',
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          label: 'Назва',
          localized: true,
        },
        {
          name: 'slug',
          type: 'text',
          required: true,
          label: 'Slug',
        },
        {
          name: 'description',
          type: 'textarea',
          label: 'Опис',
          localized: true,
        },
        {
          name: 'price',
          type: 'number',
          required: true,
          label: 'Ціна (грн)',
        },
        {
          name: 'icon',
          type: 'text',
          label: 'Іконка',
        },
        {
          name: 'order',
          type: 'number',
          label: 'Порядок',
          defaultValue: 0,
        },
      ],
    },

    // ============ ТЕРМІНОВІСТЬ ============
    {
      name: 'urgencyOptions',
      type: 'array',
      label: 'Опції терміновості',
      labels: {
        singular: 'Опція',
        plural: 'Опції терміновості',
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          label: 'Назва',
          localized: true,
        },
        {
          name: 'slug',
          type: 'text',
          required: true,
          label: 'Slug',
        },
        {
          name: 'description',
          type: 'textarea',
          label: 'Опис',
          localized: true,
        },
        {
          name: 'coefficient',
          type: 'number',
          required: true,
          label: 'Коефіцієнт ціни',
          defaultValue: 1,
          admin: {
            description: '1.0 = стандарт, 1.5 = терміново (+50%), 0.9 = не поспішаємо (-10%)',
          },
        },
        {
          name: 'timelineText',
          type: 'text',
          label: 'Текст терміну',
          localized: true,
          admin: {
            description: 'Наприклад: "до 2 тижнів", "2-4 тижні"',
          },
        },
        {
          name: 'order',
          type: 'number',
          label: 'Порядок',
          defaultValue: 0,
        },
      ],
    },

    // ============ ЗАГАЛЬНІ НАЛАШТУВАННЯ ============
    {
      name: 'generalSettings',
      type: 'group',
      label: 'Загальні налаштування',
      fields: [
        {
          name: 'currency',
          type: 'select',
          required: true,
          label: 'Валюта',
          defaultValue: 'UAH',
          options: [
            { label: 'UAH (грн)', value: 'UAH' },
            { label: 'USD ($)', value: 'USD' },
            { label: 'EUR (€)', value: 'EUR' },
          ],
        },
        {
          name: 'showPriceFrom',
          type: 'checkbox',
          label: 'Показувати "від" перед ціною',
          defaultValue: true,
        },
        {
          name: 'minimumOrderPrice',
          type: 'number',
          label: 'Мінімальна сума замовлення',
          defaultValue: 5000,
        },
      ],
    },

    // ============ ЦІНИ В HERO ГОЛОВНОЇ ============
    {
      name: 'heroPrices',
      type: 'array',
      label: 'Ціни на головній (перший екран)',
      labels: {
        singular: 'Ціна',
        plural: 'Ціни',
      },
      maxRows: 3,
      admin: {
        description:
          'Плашки «Лендінг за 199 $» у першому екрані головної. Якщо порожньо — показуються ціни за замовчуванням із перекладів.',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          localized: true,
          label: 'Назва',
          admin: {
            description: 'Наприклад: "Лендінг"',
          },
        },
        {
          name: 'price',
          type: 'number',
          required: true,
          min: 0,
          label: 'Ціна, $',
        },
      ],
    },

    // ============ SEO ============
    {
      name: 'seo',
      type: 'group',
      label: 'SEO сторінки калькулятора',
      fields: [
        {
          name: 'metaTitle',
          type: 'text',
          required: true,
          localized: true,
          label: 'Meta Title',
          defaultValue: 'Калькулятор вартості сайту | ABECT',
        },
        {
          name: 'metaDescription',
          type: 'textarea',
          required: true,
          localized: true,
          label: 'Meta Description',
          defaultValue: 'Розрахуйте вартість створення сайту онлайн. Landing page від 5000 грн, інтернет-магазин від 15000 грн. Безкоштовна консультація.',
        },
        {
          name: 'metaKeywords',
          type: 'textarea',
          localized: true,
          label: 'Meta Keywords',
        },
      ],
    },
  ],
}
