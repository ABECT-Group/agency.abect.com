/**
 * Переводить послугу в режим «Лише на конструкторі» (webliumOnly) — через REST API Payload, з логіном адмінки.
 * Потрібен, коли послугу на конструкторі колись завели в полях «кодом» (ISS-046: «Розробка сайту на Weblium»).
 *
 *   SERVICE_SLUG=website-development-weblium IMPORT_URL=https://agency.abect.com \
 *   IMPORT_EMAIL=you@example.com IMPORT_PASSWORD=... npm run service:weblium-only            # лише показує план
 *   ... APPLY=1 npm run service:weblium-only                                                 # застосовує
 *   (без IMPORT_URL — локальний http://localhost:3000)
 *
 * Що робить:
 * 1. вмикає `webliumOnly`; якщо сервер повернув документ без цього поля (код із полем ще не задеплоєно) — зупиняється;
 * 2. порожні поля Weblium заповнює з полів «кодом» (ціна, валюта, ціна в грн, додаткові витрати; для кожної мови —
 *    термін, переваги, опис). Заповнені поля Weblium не перезаписує; поля «кодом» не чіпає (вони просто ховаються).
 * Нічого не видаляє.
 */

// Модуль (не глобальний скрипт) — щоб константи не конфліктували з іншими скриптами в typecheck
export {}

const BASE = (process.env.IMPORT_URL || 'http://localhost:3000').replace(/\/$/, '')
const EMAIL = process.env.IMPORT_EMAIL || ''
const PASSWORD = process.env.IMPORT_PASSWORD || ''
const SLUG = process.env.SERVICE_SLUG || ''
const APPLY = process.env.APPLY === '1'
const LOCALES = ['uk', 'en'] as const

if (!EMAIL || !PASSWORD || !SLUG) {
	console.error('Задайте SERVICE_SLUG, IMPORT_EMAIL і IMPORT_PASSWORD (користувач адмінки). Див. коментар на початку файлу.')
	process.exit(1)
}

type Doc = Record<string, unknown> & { id: string }
type Localized<T> = Partial<Record<(typeof LOCALES)[number], T>>

const isEmpty = (value: unknown): boolean =>
	value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)

let token = ''

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
	const response = await fetch(`${BASE}${path}`, {
		...init,
		headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `JWT ${token}` } : {}), ...init.headers }
	})
	const body = await response.json().catch(() => ({}))
	if (!response.ok) throw new Error(`${init.method || 'GET'} ${path} → ${response.status}: ${JSON.stringify(body).slice(0, 300)}`)
	return body as T
}

async function main() {
	console.log(`Сервер: ${BASE}\nПослуга: ${SLUG}\nРежим: ${APPLY ? 'ЗАСТОСУВАННЯ' : 'лише план (APPLY=1 — застосувати)'}\n`)

	token = (await api<{ token: string }>('/api/users/login', { method: 'POST', body: JSON.stringify({ email: EMAIL, password: PASSWORD }) })).token

	const found = await api<{ docs: Doc[] }>(`/api/services?where[slug][equals]=${encodeURIComponent(SLUG)}&locale=all&depth=0&limit=1`)
	const doc = found.docs[0]
	if (!doc) throw new Error(`Послугу зі slug «${SLUG}» не знайдено`)

	// Неперекладні поля: Weblium ← «кодом», лише якщо поле Weblium порожнє
	const shared: Record<string, unknown> = { webliumOnly: true }
	// Ціну — разом із валютою: валюта Weblium має значення за замовчуванням (UAH), тож «порожньою» не буває
	if (isEmpty(doc.webliumPrice) && !isEmpty(doc.customPrice)) {
		shared.webliumPrice = doc.customPrice
		if (!isEmpty(doc.customPriceCurrency)) shared.webliumPriceCurrency = doc.customPriceCurrency
	}
	if (isEmpty(doc.webliumPriceUah) && !isEmpty(doc.customPriceUah)) shared.webliumPriceUah = doc.customPriceUah

	// Перекладні поля — окремо для кожної мови (locale=all повертає { uk, en })
	const perLocale: Record<string, Record<string, unknown>> = {}
	for (const locale of LOCALES) {
		const data: Record<string, unknown> = {}
		for (const [weblium, custom] of [
			['webliumExtraCosts', 'customExtraCosts'],
			['webliumTimeline', 'customTimeline'],
			['webliumFeatures', 'customFeatures'],
			['webliumDescription', 'customDescription']
		] as const) {
			const target = (doc[weblium] as Localized<unknown> | undefined)?.[locale]
			const source = (doc[custom] as Localized<unknown> | undefined)?.[locale]
			if (isEmpty(target) && !isEmpty(source)) {
				// У масиві переваг — без старих id рядків (Payload створить нові)
				data[weblium] = Array.isArray(source) ? source.map(({ feature }) => ({ feature })) : source
			}
		}
		if (Object.keys(data).length) perLocale[locale] = data
	}

	console.log('Буде змінено:')
	console.log('  усі мови:', JSON.stringify(shared))
	for (const [locale, data] of Object.entries(perLocale)) console.log(`  ${locale}:`, JSON.stringify(data))
	if (doc.webliumOnly === true && Object.keys(shared).length === 1 && !Object.keys(perLocale).length) {
		console.log('\nПослуга вже «лише на конструкторі», заповнювати нічого.')
		return
	}
	if (!APPLY) {
		console.log('\nЦе план. Щоб застосувати — повторіть з APPLY=1.')
		return
	}

	// 1) webliumOnly + неперекладні поля; перевірка, що сервер знає поле
	const updated = await api<{ doc: Doc }>(`/api/services/${doc.id}?locale=uk&depth=0`, { method: 'PATCH', body: JSON.stringify(shared) })
	if (updated.doc.webliumOnly !== true) {
		throw new Error('Сервер не зберіг webliumOnly — на ньому ще стара версія коду. Спершу реліз, потім цей скрипт.')
	}
	// 2) перекладні поля
	for (const [locale, data] of Object.entries(perLocale)) {
		await api(`/api/services/${doc.id}?locale=${locale}&depth=0`, { method: 'PATCH', body: JSON.stringify(data) })
	}
	console.log('\n✓ Готово. Перевірте головну й сторінку послуги (перемикач «Розробка кодом / На конструкторі»).')
}

main().catch((error) => {
	console.error(`\n✗ ${(error as Error).message}`)
	process.exit(1)
})
