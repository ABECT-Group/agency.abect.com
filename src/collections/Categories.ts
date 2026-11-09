import type { CollectionConfig } from 'payload'
import { revalidateAll } from '../hooks/revalidate'
import { authenticated } from '../access'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'Категорія', plural: 'Категорії' },
  hooks: {
    afterChange: [revalidateAll],
    afterDelete: [revalidateAll],
  },
  admin: {
    useAsTitle: 'name',
    group: 'Блог',
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
      label: 'Назва категорії',
      localized: true
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: 'URL (slug) - відображення на нашому сайті',
      admin: {
        description: 'URL-friendly назва для посилань',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Опис категорії',
      required: true,
      localized: true
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
          localized: true
        },
        {
          name: 'metaDescription',
          type: 'textarea',
          label: 'Meta Description',
          required: true,
          localized: true
        },
        {
          name: 'metaKeywords',
          type: 'textarea',
          label: 'Meta Keywords',
          required: true,
          localized: true
        },
      ],
    },
  ],
}
