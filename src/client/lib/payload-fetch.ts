/**
 * Єдина точка запитів до Payload REST API з серверних компонентів.
 *
 * - Ходить на внутрішню адресу застосунку (той самий процес), а не на публічний домен:
 *   не залежить від NEXT_PUBLIC_SERVER_URL і не робить кола через інтернет і nginx.
 * - Кодує всі параметри (slug з URL більше не потрапляє в запит як є).
 * - Мапить локаль маршруту (`ua`) на локаль Payload (`uk`).
 * - Кешує відповідь з тегом 'all' (скидається хуками колекцій → src/hooks/revalidate.ts).
 * - Помилку КИДАЄ, а не повертає порожній результат: сторінка з помилкою не кешується,
 *   тож порожні дані не «застигають» у кеші до наступної зміни в CMS.
 */

export interface PayloadListResponse<T> {
  docs: T[]
  totalDocs?: number
  totalPages?: number
  page?: number
  limit?: number
}

export type QueryValue = string | number | boolean | null | undefined

/**
 * Адреса Payload REST для серверних запитів:
 * 1. `PAYLOAD_INTERNAL_URL`, якщо задано явно;
 * 2. на Vercel (serverless) — адреса цього ж деплою (`VERCEL_URL`): власного HTTP-сервера
 *    на 127.0.0.1 там немає (ISS-038);
 * 3. інакше (VPS / Docker / локально) — цей самий Next.js-процес.
 */
function internalBaseUrl(): string {
  const explicit = process.env.PAYLOAD_INTERNAL_URL
  if (explicit) return explicit.replace(/\/$/, '')
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return `http://127.0.0.1:${process.env.PORT || 3000}`
}

/**
 * Превʼю на Vercel закриті Deployment Protection — запит сайту до самого себе отримав би 401.
 * Якщо у Vercel увімкнено «Protection Bypass for Automation», Vercel сам задає
 * VERCEL_AUTOMATION_BYPASS_SECRET, і ми передаємо його заголовком.
 */
function internalHeaders(): Record<string, string> {
  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
  return bypass ? { 'x-vercel-protection-bypass': bypass } : {}
}

/** Локаль маршруту (`ua` | `en`) → локаль Payload (`uk` | `en`). */
export function toPayloadLocale(locale: string | undefined): 'uk' | 'en' {
  return locale === 'en' ? 'en' : 'uk'
}

export async function payloadFetch<T>(path: string, query: Record<string, QueryValue> = {}): Promise<T> {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue
    params.set(key, key === 'locale' ? toPayloadLocale(String(value)) : String(value))
  }

  const url = `${internalBaseUrl()}${path}?${params.toString()}`
  const response = await fetch(url, {
    headers: internalHeaders(),
    next: { tags: ['all'] },
    cache: 'force-cache',
  })

  if (!response.ok) {
    throw new Error(`[payloadFetch] ${path} → ${response.status} ${response.statusText}`)
  }

  return (await response.json()) as T
}

/** Скорочення для колекцій: повертає лише `docs`. */
export async function payloadFind<T>(collection: string, query: Record<string, QueryValue> = {}): Promise<T[]> {
  const data = await payloadFetch<PayloadListResponse<T>>(`/api/${collection}`, query)
  return data.docs ?? []
}
