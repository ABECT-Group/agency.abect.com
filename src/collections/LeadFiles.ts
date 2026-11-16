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
 * ⚠️ Файли лежать в ОКРЕМІЙ теці `lead-files/` (окремий том Docker), а НЕ всередині `media/`:
 *    колекція Media публічна, і її файловий роут віддає будь-який файл зі свого staticDir,
 *    включно з підтеками (`/api/media/file/lead-files%2F<імʼя>` віддавав файли заявок без логіну).
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
    staticDir: 'lead-files',
    mimeTypes: LEAD_FILE_MIME_TYPES,
  },
  fields: [],
}
