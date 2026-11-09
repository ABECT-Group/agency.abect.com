import { revalidateTag } from 'next/cache'

/**
 * Скидає кеш усіх сторінок і запитів з тегом 'all' після зміни контенту в CMS.
 * `expire: 0` — негайне протермінування (наступний запит отримає свіжі дані),
 * як було в Next 15 до появи профілів кешу.
 *
 * Поза запитом Next.js (наприклад, у seed-скриптах через tsx) revalidateTag кидає
 * помилку — її ігноруємо, бо там кешу немає.
 */
export const revalidateAll = async (): Promise<void> => {
  try {
    revalidateTag('all', { expire: 0 })
  } catch {
    // поза контекстом Next.js — нічого скидати
  }
}
