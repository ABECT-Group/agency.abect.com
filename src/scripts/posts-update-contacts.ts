/**
 * Статті блогу: сайт → agency.abect.com, пошта → agency@abect.com — через REST API Payload, з логіном адмінки.
 * Проходить усі статті (усі статуси) обома мовами: текст і посилання в `content`, опис, SEO-поля.
 *
 *   IMPORT_URL=https://agency.abect.com IMPORT_EMAIL=you@example.com IMPORT_PASSWORD=... npm run posts:contacts   # лише план
 *   ... APPLY=1 npm run posts:contacts                                                                            # застосувати
 *   (без IMPORT_URL — локальний http://localhost:3000)
 *
 * Що НЕ міняє: пояснення «"abect" у домені abect.com» (там abect — саме назва домену другого рівня).
 */

// Модуль (не глобальний скрипт) — щоб константи не конфліктували з іншими скриптами в typecheck
export {}

const BASE = (process.env.IMPORT_URL || 'http://localhost:3000').replace(/\/$/, '')
const EMAIL = process.env.IMPORT_EMAIL || ''
const PASSWORD = process.env.IMPORT_PASSWORD || ''
const APPLY = process.env.APPLY === '1'
const LOCALES = ['uk', 'en'] as const

if (!EMAIL || !PASSWORD) {
	console.error('Задайте IMPORT_EMAIL і IMPORT_PASSWORD (користувач адмінки). Див. коментар на початку файлу.')
	process.exit(1)
}

const SITE = 'agency.abect.com'
const MAIL = 'agency@abect.com'

/** Заміни по черзі; кожна — [що, на що] */
const RULES: Array<[RegExp, string]> = [
	// Приклади й старі адреси пошти
	[/\binfo@(?:vashsite|yoursite)\.com\b/gi, MAIL],
	[/\bsupport@agency\.abect\.com\b/gi, MAIL],
	[/\b(?:info|support|hello)@abect\.com\b/gi, MAIL],
	// Сайт: посилання на старий домен і приклади домену / піддомену
	[/https?:\/\/(?:www\.)?abect\.com/gi, `https://${SITE}`],
	[/\bwww\.abect\.com\b/gi, SITE],
	[/\bblog\.abect\.com\b/gi, SITE],
	[/(["«“])abect\.com(["»”])/gi, `$1${SITE}$2`]
]

const replaceAll = (text: string): string => RULES.reduce((acc, [pattern, to]) => acc.replace(pattern, to), text)

type Json = Record<string, unknown>
type Change = { where: string; from: string; to: string }

// Рекурсивно по Lexical: текстові вузли (text) і адреси посилань (fields.url)
function walk(node: unknown, path: string, changes: Change[]): unknown {
	if (Array.isArray(node)) return node.map((child, i) => walk(child, `${path}[${i}]`, changes))
	if (!node || typeof node !== 'object') return node
	const copy: Json = { ...(node as Json) }
	if (typeof copy.text === 'string') {
		const next = replaceAll(copy.text)
		if (next !== copy.text) changes.push({ where: `${path}.text`, from: copy.text, to: next })
		copy.text = next
	}
	const fields = copy.fields as Json | undefined
	if (fields && typeof fields.url === 'string') {
		const next = replaceAll(fields.url)
		if (next !== fields.url) changes.push({ where: `${path}.url`, from: fields.url, to: next })
		copy.fields = { ...fields, url: next }
	}
	for (const [key, value] of Object.entries(copy)) {
		if (key !== 'fields' && value && typeof value === 'object') copy[key] = walk(value, `${path}.${key}`, changes)
	}
	return copy
}

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
	console.log(`Сервер: ${BASE}\nРежим: ${APPLY ? 'ЗАСТОСУВАННЯ' : 'лише план (APPLY=1 — застосувати)'}\n`)
	token = (await api<{ token: string }>('/api/users/login', { method: 'POST', body: JSON.stringify({ email: EMAIL, password: PASSWORD }) })).token

	const posts = await api<{ docs: Json[] }>('/api/posts?limit=500&depth=0&locale=all&draft=true')
	let total = 0

	for (const post of posts.docs) {
		for (const locale of LOCALES) {
			const changes: Change[] = []
			const data: Json = {}

			const content = (post.content as Partial<Record<string, unknown>> | undefined)?.[locale]
			if (content) {
				const next = walk(content, 'content', changes)
				if (changes.length) data.content = next
			}

			for (const field of ['description'] as const) {
				const value = (post[field] as Partial<Record<string, string>> | undefined)?.[locale]
				if (typeof value === 'string' && replaceAll(value) !== value) {
					changes.push({ where: field, from: value, to: replaceAll(value) })
					data[field] = replaceAll(value)
				}
			}

			const seo = (post.seo as Record<string, Partial<Record<string, string>>> | undefined) || {}
			const seoData: Json = {}
			for (const field of ['metaTitle', 'metaDescription', 'metaKeywords']) {
				const value = seo[field]?.[locale]
				if (typeof value === 'string' && replaceAll(value) !== value) {
					changes.push({ where: `seo.${field}`, from: value, to: replaceAll(value) })
					seoData[field] = replaceAll(value)
				}
			}
			if (Object.keys(seoData).length) data.seo = seoData

			if (!changes.length) continue
			total += changes.length
			console.log(`■ ${post.slug} (${locale}) — ${changes.length}`)
			for (const change of changes) console.log(`   ${change.where}\n     − ${change.from}\n     + ${change.to}`)

			if (APPLY) {
				await api(`/api/posts/${post.id}?locale=${locale}&depth=0`, { method: 'PATCH', body: JSON.stringify(data) })
				console.log('   ✓ збережено')
			}
		}
	}

	console.log(total ? `\nУсього замін: ${total}.${APPLY ? '' : ' Це план — щоб застосувати, повторіть з APPLY=1.'}` : '\nЗамінювати нічого.')
}

main().catch((error) => {
	console.error(`\n✗ ${(error as Error).message}`)
	process.exit(1)
})
