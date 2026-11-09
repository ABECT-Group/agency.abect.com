import type { Access, FieldAccess, PayloadRequest, Where } from 'payload'

/**
 * Матриця прав (див. docs/api.md → «Матриця доступів»):
 * - superadmin — усе, включно з керуванням користувачами;
 * - admin      — усе, крім керування користувачами;
 * - moderator  — контент (послуги, кейси, блог, медіа) і робота з заявками, без видалення заявок.
 */
export type Role = 'superadmin' | 'admin' | 'moderator'

type MaybeUser = PayloadRequest['user']

const roleOf = (user: MaybeUser): Role | undefined =>
  (user as { role?: Role } | null | undefined)?.role

export const isSuperadmin = (user: MaybeUser): boolean => roleOf(user) === 'superadmin'

export const isAdmin = (user: MaybeUser): boolean => {
  const role = roleOf(user)
  return role === 'superadmin' || role === 'admin'
}

/** Будь-який залогінений користувач адмінки. */
export const authenticated: Access = ({ req: { user } }) => Boolean(user)

/** Адмін або суперадмін. */
export const adminOnly: Access = ({ req: { user } }) => isAdmin(user)

/** Лише суперадмін. */
export const superadminOnly: Access = ({ req: { user } }) => isSuperadmin(user)

/**
 * Публічно — лише опубліковані документи, залогіненим — усі (чернетки теж).
 * Для колекцій з полем `status: 'draft' | 'published'`.
 */
export const publishedOrAuthenticated: Access = ({ req: { user } }) => {
  if (user) return true
  const where: Where = { status: { equals: 'published' } }
  return where
}

/**
 * Керування користувачами. Запобіжник від блокування: якщо в базі ще немає
 * жодного superadmin, дію дозволено будь-якому залогіненому користувачу —
 * щоб власник міг призначити собі роль superadmin.
 */
export const canManageUsers: Access = async ({ req }) => {
  if (!req.user) return false
  if (isSuperadmin(req.user)) return true
  const { totalDocs } = await req.payload.count({
    collection: 'users',
    where: { role: { equals: 'superadmin' } },
    overrideAccess: true,
    req,
  })
  return totalDocs === 0
}

/** Користувач бачить і редагує себе; суперадмін — усіх. */
export const selfOrSuperadmin: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isSuperadmin(user)) return true
  const where: Where = { id: { equals: user.id } }
  return where
}

/** Змінювати поле `role` може лише суперадмін (або будь-хто, поки суперадміна немає). */
export const canEditRole: FieldAccess = async ({ req }) => {
  if (!req.user) return false
  if (isSuperadmin(req.user)) return true
  const { totalDocs } = await req.payload.count({
    collection: 'users',
    where: { role: { equals: 'superadmin' } },
    overrideAccess: true,
    req,
  })
  return totalDocs === 0
}
