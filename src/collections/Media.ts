import type { CollectionConfig } from 'payload'
import { revalidateAll } from '../hooks/revalidate'
import { authenticated } from '../access'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Медіа', plural: 'Медіа' },
  hooks: {
    afterChange: [revalidateAll],
    afterDelete: [revalidateAll],
  },
  admin: {
    useAsTitle: 'filename',
    group: 'Технічні',
  },
  access: {
    read: () => true,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  upload: {
    staticDir: 'media',
    mimeTypes: ['image/*', 'video/*', 'application/pdf'],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Alt текст',
      required: true,
      admin: {
        description: 'Опис зображення для SEO та доступності',
      },
    },
    {
      name: 'caption',
      type: 'text',
      label: 'Підпис',
      admin: {
        description: 'Підпис до зображення',
      },
    },
    {
      name: 'folder',
      type: 'select',
      label: 'Папка',
      options: [
        { label: 'Пости', value: 'posts' },
        { label: 'Категорії', value: 'categories' },
        { label: 'Портфоліо', value: 'portfolio' },
        { label: 'Загальне', value: 'general' },
      ],
      defaultValue: 'general',
      admin: {
        description: 'Організація файлів по папках',
      },
    },
  ],
}
