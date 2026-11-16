/**
 * Імпорт статей блогу з Markdown у CMS як ЧЕРНЕТКИ — через REST API Payload, з логіном користувача адмінки.
 *
 *   IMPORT_URL=https://agency.abect.com IMPORT_EMAIL=you@example.com IMPORT_PASSWORD=... npm run import:blog
 *   (без IMPORT_URL — локальний http://localhost:3000; IMPORT_DIR — інша тека зі статтями)
 *
 * Що робить для кожного content/blog-drafts/*.md:
 * - пропускає, якщо стаття з таким slug уже є (повторний запуск нічого не дублює);
 * - вантажить обкладинку (covers/<slug>.png) у «Медіа»;
 * - перетворює Markdown у формат редактора Lexical (H2/H3, абзаци, списки, цитати, **жирний**, *курсив*, посилання);
 * - створює статтю: status = draft, автор — той, хто залогінився, категорія — за slug, дата — зараз.
 * Публікує людина в адмінці після перевірки. Скрипт нічого не видаляє й не змінює наявних записів.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import path from 'node:path'

const BASE = (process.env.IMPORT_URL || 'http://localhost:3000').replace(/\/$/, '')
const EMAIL = process.env.IMPORT_EMAIL || ''
const PASSWORD = process.env.IMPORT_PASSWORD || ''
const DIR = path.resolve(process.env.IMPORT_DIR || 'content/blog-drafts')
const LOCALE = 'uk'

if (!EMAIL || !PASSWORD) {
  console.error('Задайте IMPORT_EMAIL і IMPORT_PASSWORD (користувач адмінки). Див. коментар на початку файлу.')
  process.exit(1)
}

// ---------------------------------------------------------------- Markdown → Lexical

type LexNode = Record<string, unknown>

const text = (value: string, format = 0): LexNode => ({
  type: 'text',
  text: value,
  format,
  detail: 0,
  mode: 'normal',
  style: '',
  version: 1,
})

const block = (type: string, children: LexNode[], extra: Record<string, unknown> = {}): LexNode => ({
  type,
  children,
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
  ...extra,
})

// Інлайн: [посилання](url), **жирний**, *курсив* (вкладення жирного в посилання не підтримується — і не потрібне)
function inline(source: string): LexNode[] {
  const nodes: LexNode[] = []
  const pattern = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g
  let last = 0
  for (const match of source.matchAll(pattern)) {
    if (match.index! > last) nodes.push(text(source.slice(last, match.index)))
    if (match[1]) {
      nodes.push({
        ...block('link', [text(match[1])], { version: 3 }),
        fields: { linkType: 'custom', newTab: !match[2].startsWith('/'), url: match[2] },
      })
    } else if (match[3]) nodes.push(text(match[3], 1))
    else if (match[4]) nodes.push(text(match[4], 2))
    last = match.index! + match[0].length
  }
  if (last < source.length) nodes.push(text(source.slice(last)))
  return nodes
}

function markdownToLexical(markdown: string) {
  const children: LexNode[] = []
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  let paragraph: string[] = []
  let list: { type: 'bullet' | 'number'; items: string[] } | null = null

  const flushParagraph = () => {
    if (paragraph.length) children.push(block('paragraph', inline(paragraph.join(' ')), { textFormat: 0, textStyle: '' }))
    paragraph = []
  }
  const flushList = () => {
    if (!list) return
    children.push(
      block(
        'list',
        list.items.map((item, i) => block('listitem', inline(item), { value: i + 1 })),
        { listType: list.type, start: 1, tag: list.type === 'bullet' ? 'ul' : 'ol' }
      )
    )
    list = null
  }

  for (const raw of lines) {
    const line = raw.trimEnd()
    const heading = /^(#{2,4})\s+(.*)$/.exec(line)
    const bullet = /^[-*]\s+(.*)$/.exec(line)
    const numbered = /^\d+[.)]\s+(.*)$/.exec(line)
    const quote = /^>\s?(.*)$/.exec(line)

    if (!line.trim()) {
      flushParagraph()
      flushList()
    } else if (heading) {
      flushParagraph()
      flushList()
      children.push(block('heading', inline(heading[2]), { tag: `h${heading[1].length}` }))
    } else if (bullet || numbered) {
      flushParagraph()
      const type = bullet ? 'bullet' : 'number'
      if (list && list.type !== type) flushList()
      if (!list) list = { type, items: [] }
      list.items.push((bullet ?? numbered)![1])
    } else if (quote) {
      flushParagraph()
      flushList()
      children.push(block('quote', inline(quote[1])))
    } else {
      flushList()
      paragraph.push(line.trim())
    }
  }
  flushParagraph()
  flushList()

  return { root: block('root', children) }
}

// ---------------------------------------------------------------- Файл статті

type Article = {
  file: string
  slug: string
  title: string
  description: string
  category: string
  tags: string[]
  metaTitle: string
  metaDescription: string
  metaKeywords: string
  coverAlt: string
  body: string
}

function parseArticle(file: string): Article {
  const source = readFileSync(file, 'utf8').replace(/\r\n/g, '\n')
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(source)
  if (!match) throw new Error(`${file}: немає блоку --- з метаданими`)
  const meta: Record<string, string> = {}
  for (const line of match[1].split('\n')) {
    const kv = /^(\w+):\s*(.*)$/.exec(line)
    if (kv) meta[kv[1]] = kv[2].trim()
  }
  for (const key of ['slug', 'title', 'description', 'category', 'metaTitle', 'metaDescription', 'metaKeywords']) {
    if (!meta[key]) throw new Error(`${file}: не заповнено «${key}»`)
  }
  return {
    file,
    slug: meta.slug,
    title: meta.title,
    description: meta.description,
    category: meta.category,
    tags: (meta.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean),
    metaTitle: meta.metaTitle,
    metaDescription: meta.metaDescription,
    metaKeywords: meta.metaKeywords,
    coverAlt: meta.coverAlt || meta.title,
    body: match[2].trim(),
  }
}

// Час читання в секундах (поле readTime), ~180 слів за хвилину
const readTimeSeconds = (body: string) => Math.max(60, Math.round((body.split(/\s+/).length / 180) * 60))

// ---------------------------------------------------------------- REST

let token = ''

async function api<T>(pathname: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE}${pathname}`, {
    ...init,
    headers: { ...(token ? { Authorization: `JWT ${token}` } : {}), ...(init.headers || {}) },
  })
  const body = (await response.json().catch(() => ({}))) as T & { errors?: { message: string }[] }
  if (!response.ok) {
    const details = body.errors?.map((e) => e.message).join('; ') || response.statusText
    throw new Error(`${init.method || 'GET'} ${pathname} → ${response.status}: ${details}`)
  }
  return body
}

const json = (data: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
})

async function main() {
  const files = readdirSync(DIR)
    .filter((name) => name.endsWith('.md'))
    .sort()
    .map((name) => path.join(DIR, name))
  if (!files.length) throw new Error(`У ${DIR} немає .md файлів`)
  const articles = files.map(parseArticle)

  console.log(`Сайт: ${BASE}\nСтатей у теці: ${articles.length}`)

  const login = await api<{ token: string; user: { id: string; email: string } }>('/api/users/login', json({ email: EMAIL, password: PASSWORD }))
  token = login.token
  console.log(`Увійшли як ${login.user.email}`)

  for (const article of articles) {
    const label = `«${article.title}»`
    const q = (where: string) => `?where[slug][equals]=${encodeURIComponent(where)}&limit=1&depth=0&locale=${LOCALE}`

    const existing = await api<{ docs: { id: string }[] }>(`/api/posts${q(article.slug)}`)
    if (existing.docs.length) {
      console.log(`– пропущено ${label}: стаття зі slug «${article.slug}» уже є`)
      continue
    }

    const category = await api<{ docs: { id: string }[] }>(`/api/categories${q(article.category)}`)
    if (!category.docs.length) throw new Error(`${label}: немає категорії зі slug «${article.category}»`)

    const coverPath = path.join(DIR, 'covers', `${article.slug}.png`)
    if (!existsSync(coverPath)) throw new Error(`${label}: немає обкладинки ${coverPath}`)
    const form = new FormData()
    form.append('file', new Blob([readFileSync(coverPath)], { type: 'image/png' }), `${article.slug}.png`)
    form.append('_payload', JSON.stringify({ alt: article.coverAlt, folder: 'posts' }))
    const cover = await api<{ doc: { id: string } }>(`/api/media?locale=${LOCALE}`, { method: 'POST', body: form })

    const created = await api<{ doc: { id: string } }>(
      `/api/posts?locale=${LOCALE}`,
      json({
        title: article.title,
        slug: article.slug,
        description: article.description,
        content: markdownToLexical(article.body),
        author: login.user.id,
        category: category.docs[0].id,
        tags: article.tags.map((tag) => ({ tag })),
        date: new Date().toISOString(),
        cover: cover.doc.id,
        seo: { metaTitle: article.metaTitle, metaDescription: article.metaDescription, metaKeywords: article.metaKeywords },
        readTime: readTimeSeconds(article.body),
        status: 'draft',
        featured: false,
      })
    )
    console.log(`+ чернетка ${label} → ${BASE}/admin/collections/posts/${created.doc.id}`)
  }

  console.log('Готово. Перевірте чернетки в адмінці й опублікуйте (статус «Опубліковано»).')
}

main().catch((error: Error) => {
  console.error(`Помилка: ${error.message}`)
  process.exit(1)
})
