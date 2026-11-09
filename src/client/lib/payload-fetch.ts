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

/** Внутрішня адреса Payload. За замовчуванням — цей самий Next.js-процес. */
function internalBaseUrl(): string {
  const explicit = process.env.PAYLOAD_INTERNAL_URL
  if (explicit) return explicit.replace(/\/$/, '')
  return `http://127.0.0.1:${process.env.PORT || 3000}`
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
