import type { CollectionConfig } from 'payload'
import { authenticated, canEditRole, canManageUsers, selfOrSuperadmin } from '../access'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Користувач', plural: 'Користувачі' },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['firstName', 'lastName', 'email', 'role'],
    group: 'Технічні',
  },
  auth: true,
  // Додавати й видаляти користувачів може лише superadmin.
  // Редагувати — себе або (superadmin) будь-кого. Див. src/access/index.ts.
  access: {
    read: authenticated,
    create: canManageUsers,
    update: selfOrSuperadmin,
    delete: canManageUsers,
  },
  hooks: {
    beforeChange: [
      // Перший користувач, створений через /admin/create-first-user, стає superadmin.
      // Не payload.count без умови: адаптер MongoDB тоді робить estimatedDocumentCount, а він заборонений
      // у транзакції (на проді MongoDB — replica set, створення користувача падало з 500:
      // «Cannot run 'count' in a multi-document transaction»). Достатньо знати, чи є хоч один запис.
      async ({ data, operation, req }) => {
        if (operation !== 'create') return data
        const { docs } = await req.payload.find({
          collection: 'users',
          limit: 1,
          pagination: false,
          depth: 0,
          overrideAccess: true,
          req,
        })
        if (docs.length === 0) return { ...data, role: 'superadmin' }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'firstName',
      type: 'text',
      required: true,
      localized: true,
      label: 'Імʼя',
    },
    {
      name: 'lastName',
      type: 'text',
      required: true,
      localized: true,
      label: 'Прізвище',
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'moderator',
      label: 'Роль користувача',
      options: [
        { label: 'Суперадмін', value: 'superadmin' },
        { label: 'Адмін', value: 'admin' },
        { label: 'Модератор', value: 'moderator' },
      ],
      access: {
        create: canEditRole,
        update: canEditRole,
      },
      saveToJWT: true,
      admin: {
        description:
          'Суперадмін — усе, включно з користувачами. Адмін — усе, крім користувачів. Модератор — контент і заявки.',
      },
    },
  ],
}
