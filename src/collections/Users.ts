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
      async ({ data, operation, req }) => {
        if (operation !== 'create') return data
        const { totalDocs } = await req.payload.count({ collection: 'users', overrideAccess: true, req })
        if (totalDocs === 0) return { ...data, role: 'superadmin' }
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
