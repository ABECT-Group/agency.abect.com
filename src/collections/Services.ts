import type { CollectionConfig } from 'payload'
import { revalidateAll } from '../hooks/revalidate'
import { authenticated, publishedOrAuthenticated } from '../access'

export const Services: CollectionConfig = {
  slug: 'services',
  labels: { singular: 'Послуга', plural: 'Послуги' },
  hooks: {
    afterChange: [revalidateAll],
    afterDelete: [revalidateAll],
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'serviceType', 'featured', 'order', 'createdAt'],
    group: 'Послуги',
  },
  access: {
    read: publishedOrAuthenticated, // чернетки й архів — лише в адмінці
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    // ============ БАЗОВА ІНФОРМАЦІЯ ============
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      label: 'Назва послуги',
      admin: {
        description: 'Наприклад: "Розробка Landing Page"',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: 'URL (slug)',
      admin: {
        description: 'URL-friendly назва, наприклад: "landing-page"',
      },
    },
    {
      name: 'shortDescription',
      type: 'textarea',
      required: true,
      localized: true,
      label: 'Короткий опис',
      maxLength: 200,
      admin: {
        description: 'Короткий опис для картки на сторінці /services',
      },
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Головне зображення',
      admin: {
        description: 'Головне зображення для сторінки послуги',
      },
    },
    {
      name: 'serviceType',
      type: 'relationship',
      relationTo: 'service-types',
      required: true,
      label: 'Тип послуги',
      admin: {
        description: 'Тип послуги для фільтрації та групування',
      },
    },
    {
      name: 'order',
      type: 'number',
      label: 'Порядковий номер',
      defaultValue: 999,
      admin: {
        description: 'Порядок відображення (менше число = вище)',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      label: 'Виділена послуга',
      defaultValue: false,
      admin: {
        description: 'Показувати на головній сторінці',
      },
    },
    
    // ============ PRICING - WEBLIUM ============
    {
      name: 'hasWebliumOption',
      type: 'checkbox',
      label: 'Є варіант на Weblium',
      defaultValue: true,
      admin: {
        description: 'Чи доступний варіант на конструкторі Weblium',
      },
    },
    {
      name: 'webliumPrice',
      type: 'number',
      label: 'Ціна Weblium',
      min: 0,
      admin: {
        condition: (data) => data.hasWebliumOption === true,
        description: 'Вартість варіанту на Weblium',
      },
    },
    {
      name: 'webliumPriceCurrency',
      type: 'select',
      label: 'Валюта (Weblium)',
      options: [
        { label: 'UAH', value: 'UAH' },
        { label: 'USD', value: 'USD' },
        { label: 'EUR', value: 'EUR' },
      ],
      defaultValue: 'UAH',
      admin: {
        condition: (data) => data.hasWebliumOption === true,
      },
    },
    {
      name: 'webliumPriceUah',
      type: 'number',
      label: 'Ціна в гривнях (Weblium)',
      min: 0,
      admin: {
        condition: (data) => data.hasWebliumOption === true,
        description: 'Необовʼязково. На головній — праворуч від основної ціни: «від 3 600 грн» (якщо основна валюта не UAH)',
      },
    },
    {
      name: 'webliumExtraCosts',
      type: 'text',
      localized: true,
      label: 'Додаткові витрати (Weblium)',
      admin: {
        condition: (data) => data.hasWebliumOption === true,
        description: 'Необовʼязково. Наприклад: «$22 — домен, хостинг» (у картці над кнопками)',
      },
    },
    {
      name: 'webliumTimeline',
      type: 'text',
      localized: true,
      label: 'Термін виконання (Weblium)',
      admin: {
        condition: (data) => data.hasWebliumOption === true,
        description: 'Наприклад: "5-7 днів"',
      },
    },
    {
      name: 'webliumFeatures',
      type: 'array',
      label: 'Що входить (Weblium)',
      localized: true,
      admin: {
        condition: (data) => data.hasWebliumOption === true,
      },
      fields: [
        {
          name: 'feature',
          type: 'text',
          label: 'Опція',
        },
      ],
    },
    {
      name: 'webliumDescription',
      type: 'textarea',
      localized: true,
      label: 'Опис варіанту Weblium',
      admin: {
        condition: (data) => data.hasWebliumOption === true,
        description: 'Короткий опис переваг Weblium варіанту',
      },
    },
    
    // ============ PRICING - CUSTOM ============
    {
      name: 'customPrice',
      type: 'number',
      required: true,
      label: 'Ціна Custom',
      min: 0,
      admin: {
        description: 'Вартість кастомної розробки',
      },
    },
    {
      name: 'customPriceCurrency',
      type: 'select',
      label: 'Валюта (Custom)',
      required: true,
      options: [
        { label: 'UAH', value: 'UAH' },
        { label: 'USD', value: 'USD' },
        { label: 'EUR', value: 'EUR' },
      ],
      defaultValue: 'UAH',
    },
    {
      name: 'customPriceUah',
      type: 'number',
      label: 'Ціна в гривнях (Custom)',
      min: 0,
      admin: {
        description: 'Необовʼязково. На головній — праворуч від основної ціни: «від 5 400 грн» (якщо основна валюта не UAH)',
      },
    },
    {
      name: 'customExtraCosts',
      type: 'text',
      localized: true,
      label: 'Додаткові витрати (Custom)',
      admin: {
        description: 'Необовʼязково. Наприклад: «$22 — домен, хостинг» (у картці над кнопками)',
      },
    },
    {
      name: 'customTimeline',
      type: 'text',
      required: true,
      localized: true,
      label: 'Термін виконання (Custom)',
      admin: {
        description: 'Наприклад: "2-3 тижні"',
      },
    },
    {
      name: 'customFeatures',
      type: 'array',
      required: true,
      label: 'Що входить (Custom)',
      localized: true,
      fields: [
        {
          name: 'feature',
          type: 'text',
          label: 'Опція',
        },
      ],
    },
    {
      name: 'customDescription',
      type: 'textarea',
      required: true,
      localized: true,
      label: 'Опис кастомного варіанту',
      admin: {
        description: 'Короткий опис переваг кастомної розробки',
      },
    },
    
    // ============ ДЕТАЛЬНИЙ КОНТЕНТ ============
    {
      name: 'detailedDescription',
      type: 'richText',
      required: true,
      localized: true,
      label: 'Повний опис послуги',
      admin: {
        description: 'Що таке, для кого, які завдання вирішує',
      },
    },

    // ============ ЗВ\'ЯЗКИ ============
    {
      name: 'relatedPortfolioProjects',
      type: 'relationship',
      relationTo: 'portfolio',
      hasMany: true,
      label: 'Приклади робіт',
      admin: {
        description: 'Проекти з портфоліо для цієї послуги',
      },
    },
    {
      name: 'relatedServices',
      type: 'relationship',
      relationTo: 'services',

      
      hasMany: true,
      label: 'Схожі послуги',
      admin: {
        description: 'Інші послуги які можуть зацікавити клієнта',
      },
    },
    
    // ============ FAQ ============
    {
      name: 'faq',
      type: 'array',
      label: 'FAQ',
      localized: true,
      fields: [
        {
          name: 'question',
          type: 'text',
          label: 'Питання',
        },
        {
          name: 'answer',
          type: 'richText',
          label: 'Відповідь',
        },
      ],
    },
    

    // ============ SEO ============
    {
      name: 'seo',
      type: 'group',
      label: 'SEO',
      fields: [
        {
          name: 'metaTitle',
          type: 'text',
          required: true,
          localized: true,
          label: 'Meta Title',
        },
        {
          name: 'metaDescription',
          type: 'textarea',
          required: true,
          localized: true,
          label: 'Meta Description',
          maxLength: 160,
        },
        {
          name: 'metaKeywords',
          type: 'textarea',
          required: true,
          localized: true,
          label: 'Meta Keywords',
        },
      ],
    },
    {
      name: 'viewCount',
      type: 'number',
      label: 'Кількість переглядів',
      defaultValue: 0,
      admin: {
        readOnly: true,
        description: 'Лічильник переглядів сторінки послуги',
      },
    },
    
    // ============ СТАТУС ============
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      label: 'Статус',
      options: [
        { label: 'Чернетка', value: 'draft' },
        { label: 'Опубліковано', value: 'published' },
        { label: 'Архів', value: 'archived' },
      ],
    },
    {
      name: 'publishedDate',
      type: 'date',
      label: 'Дата публікації',
      admin: {
        description: 'Дата публікації послуги',
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
    },
  ],
}
