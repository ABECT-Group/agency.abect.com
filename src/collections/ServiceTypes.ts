import type { CollectionConfig } from 'payload'
import { revalidateAll } from '../hooks/revalidate'
import { authenticated } from '../access'

export const ServiceTypes: CollectionConfig = {
  slug: 'service-types',
  labels: { singular: 'Категорія', plural: 'Категорії' },
  hooks: {
    afterChange: [revalidateAll],
    afterDelete: [revalidateAll],
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'order', 'createdAt'],
    group: 'Послуги',
  },
  access: {
    read: () => true,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Назва типу послуги',
      localized: true,
      admin: {
        description: 'Наприклад: "Веб-розробка", "Маркетинг", "Дизайн"',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: 'URL (slug)',
      admin: {
        description: 'URL-friendly назва, наприклад: "web-development"',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Опис типу послуги',
      required: true,
      localized: true,
      admin: {
        description: 'Опис для сторінки /services/[type]',
      },
    },
    {
      name: 'order',
      type: 'number',
      label: 'Порядковий номер',
      defaultValue: 999,
      admin: {
        description: 'Порядок відображення в фільтрі (менше число = вище)',
      },
    },
    // SEO Fields
    {
      name: 'seo',
      type: 'group',
      label: 'SEO',
      fields: [
        {
          name: 'metaTitle',
          type: 'text',
          label: 'Meta Title',
          required: true,
          localized: true,
        },
        {
          name: 'metaDescription',
          type: 'textarea',
          label: 'Meta Description',
          required: true,
          localized: true,
        },
        {
          name: 'metaKeywords',
          type: 'textarea',
          label: 'Meta Keywords',
          required: true,
          localized: true,
        },
      ],
    },
  ],
}
