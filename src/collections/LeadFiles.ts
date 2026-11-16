import type { CollectionConfig } from 'payload'
import { adminOnly, authenticated } from '../access'

/** Дозволені типи вкладень до заявки (перевіряються ще й за сигнатурою файлу в /api/leads) */
export const LEAD_FILE_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
]

/** Максимальний розмір вкладення, байт */
export const LEAD_FILE_MAX_SIZE = 10 * 1024 * 1024

/**
 * Файли, прикріплені до заявок (форма «Обговорити проєкт»). Можуть містити персональні дані /
 * комерційну інформацію клієнта, тому:
 * - читати й завантажувати — лише залогіненим (Payload віддає файл через /api/lead-files/file/…
 *   з перевіркою доступу; у public/ і напряму через nginx вони не потрапляють);
 * - створювати — лише через POST /api/leads (Local API з overrideAccess після перевірок типу й розміру).
 * Файли лежать у media/lead-files — у тому ж змонтованому томі, що й медіа (і потрапляють у бекап).
 */
export const LeadFiles: CollectionConfig = {
  slug: 'lead-files',
  labels: { singular: 'Файл заявки', plural: 'Файли заявок' },
  admin: {
    useAsTitle: 'filename',
    group: 'Ліди',
    defaultColumns: ['filename', 'filesize', 'createdAt'],
  },
  access: {
    read: authenticated,
    create: () => false,
    update: adminOnly,
    delete: adminOnly,
  },
  upload: {
    staticDir: 'media/lead-files',
    mimeTypes: LEAD_FILE_MIME_TYPES,
  },
  fields: [],
}
