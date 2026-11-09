import type { CollectionConfig } from 'payload'
import { revalidateAll } from '../hooks/revalidate'
import { authenticated, publishedOrAuthenticated } from '../access'

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'Стаття', plural: 'Статті' },
  hooks: {
    afterChange: [revalidateAll],
    afterDelete: [revalidateAll],
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'author', 'category', 'createdAt'],
    group: 'Блог',
  },
  access: {
    read: publishedOrAuthenticated, // чернетки й архів — лише в адмінці
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      label: 'Заголовок статті',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: 'URL (slug)',
      admin: {
        description: 'URL-friendly назва для посилань',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      localized: true,
      label: 'Короткий опис',
      admin: {
        description: 'Опис для превью статті',
      },
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      localized: true,
      label: 'Повний текст статті'
    },
    // Meta Information
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      label: 'Автор',
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
      label: 'Категорія',
    },
    {
      name: 'tags',
      type: 'array',
      label: 'Теги',
      fields: [
        {
          name: 'tag',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      label: 'Дата публікації',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    // Media
    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'Головне зображення',
    },
    // SEO
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
      name: 'readTime',
      type: 'number',
      required: true,
      label: 'Час читання (секунди)',
      admin: {
        description: 'Приблизний час читання статті в секундах',
      },
    },
    // Status
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
      name: 'featured',
      type: 'checkbox',
      label: 'Виділена стаття',
      defaultValue: false,
      admin: {
        description: 'Показувати на головній сторінці',
      },
    },
    {
      name: 'viewCount',
      type: 'number',
      label: 'Кількість переглядів',
      defaultValue: 0,
      admin: {
        readOnly: true,
      },
    },
  ],
}
