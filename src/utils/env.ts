/**
 * Середовище застосунку (лише на сервері).
 *
 * APP_ENV:
 * - `production` — бойовий сайт на VPS (agency.abect.com): індексується, заявки звичайні;
 * - `preview`    — превʼю на Vercel / будь-яке тестове середовище: закрито від індексації,
 *                  заявки в Telegram з позначкою «ТЕСТОВЕ СЕРЕДОВИЩЕ».
 *
 * Якщо APP_ENV не задано: на Vercel (`VERCEL=1`) — `preview`, інакше — `production`.
 * Так прод не закриється від індексації, навіть якщо змінну на VPS забули задати,
 * а превʼю закрите, навіть якщо її забули задати у Vercel.
 *
 * Ту саму логіку дублює next.config.mjs (заголовок X-Robots-Tag) — змінювати обидва місця.
 */
export type AppEnv = 'production' | 'preview'

export function getAppEnv(): AppEnv {
  const explicit = process.env.APP_ENV?.trim().toLowerCase()
  if (explicit === 'production' || explicit === 'preview') return explicit
  return process.env.VERCEL ? 'preview' : 'production'
}

export function isProduction(): boolean {
  return getAppEnv() === 'production'
}

/** Підпис превʼю для повідомлень: гілка й адреса (на Vercel), інакше порожньо. */
export function previewLabel(): { branch?: string; url?: string } {
  const branch = process.env.VERCEL_GIT_COMMIT_REF || undefined
  const host = process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL
  return { branch, url: host ? `https://${host}` : undefined }
}
