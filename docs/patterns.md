# Патерни коду

Шаблони, за якими написаний проект. Нове робимо так само, щоб код лишався однорідним.

## 1. Публічна сторінка (`src/app/(frontend)/[locale]/<route>/page.tsx`)

```tsx
import { setRequestLocale, getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import { getAllServices } from '@/client/lib/services'
import ServicesPage from '@/client/modules/services/ServicesPage/ServicesPage'
import { SITE_URL } from '@/client/config/site'

type Params = { params: Promise<{ locale: string }> }

// Нічого не пререндеримо на білді (у Docker-білді немає БД) — сторінка рендериться
// при першому запиті й кешується до revalidateTag('all').
export function generateStaticParams() {
  return []
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'ServicesPage.seo' })
  const url = locale === 'ua' ? `${SITE_URL}/services` : `${SITE_URL}/en/services`
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: url,
      languages: {
        'uk-UA': `${SITE_URL}/services`,
        'en-US': `${SITE_URL}/en/services`,
        'x-default': `${SITE_URL}/en/services`,
      },
    },
    openGraph: {
      locale: locale === 'ua' ? 'uk_UA' : 'en_US',
      url,
      images: [{ url: `${SITE_URL}/seo/${locale === 'ua' ? '' : 'en-'}service-og.jpg`, width: 1200, height: 630 }],
    },
  }
}

export default async function Page({ params }: Params) {
  const { locale } = await params
  setRequestLocale(locale)                       // обов'язково для статичного рендеру з next-intl
  const services = await getAllServices(locale)  // дані з lib
  const jsonLd = { /* BreadcrumbList + тип сторінки */ }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ServicesPage services={services} />
    </>
  )
}
```

- `metadataBase`, `icons`, `manifest`, `authors` задані в `[locale]/layout.tsx` — на сторінках їх не повторювати.
- Домен — лише через `SITE_URL` (`src/client/config/site.ts`).
- Динамічна сторінка (`[slug]`): `export const dynamicParams = true` + `generateStaticParams` → `[]`. Якщо запис не знайдено — `notFound()`.
- Сторінка, що читає `searchParams` / `cookies()` / `headers()`, має `export const dynamic = 'force-dynamic'` (приклад — `thx/page.tsx`). Інакше в runtime буде `DYNAMIC_SERVER_USAGE` (500).
- OG-зображення лежать у `public/seo/*.jpg` (1200×630). Нове — додати файл UA і `en-` версію.

## 2. Модуль сторінки (`src/client/modules/<page>/<Section>/`)

```
modules/service/
├── ServiceDetail.tsx          # збирає секції в сторінку
├── ServiceHero/ServiceHero.tsx + ServiceHero.scss
├── FAQSection/FAQSection.tsx + FAQSection.scss
└── ...
```
- Модуль отримує готові дані через props і сам їх не запитує.
- Тексти — з `useTranslations('Namespace')` (клієнт) або `getTranslations` (сервер).
- Перевикористовувані елементи (картки, списки, хлібні крихти) — у `src/client/components/`.
- Навігація в клієнтських компонентах — лише через `Link` / `useRouter` з `@/client/i18n/navigation` (зберігають мову). `window.location.href = '/…'` губить `/en`.
- SCSS-файли компонентів — глобальні (не CSS Modules): `:global(...)` у них не працює.

## 3. Запит до CMS (`src/client/lib/`)

Усі запити — через `payloadFetch` / `payloadFind` з `lib/payload-fetch.ts`:

```ts
import type { Service } from '@/payload-types'
import { payloadFind } from './payload-fetch'

export async function getServiceBySlug(slug: string, locale: string = 'uk'): Promise<Service | null> {
  const services = await payloadFind<Service>('services', {
    'where[slug][equals]': slug,          // значення кодується автоматично
    'where[status][equals]': 'published',
    locale,                               // 'ua' → 'uk' автоматично
    limit: 1,
    depth: 2,
  })
  return services[0] ?? null
}
```

`payloadFetch` сам:
- ходить на `http://127.0.0.1:$PORT` (той самий процес; `PAYLOAD_INTERNAL_URL` — щоб перевизначити);
- кешує з тегом `'all'` (`cache: 'force-cache'`), який скидають хуки Payload;
- **кидає помилку**, якщо Payload не відповів — сторінка з помилкою не потрапляє в кеш. Не обгортати в `try/catch` з поверненням `[]`: так порожні дані «застигали» в кеші.

Правила: фільтр `status = published` для контенту зі статусом; сортування `order → createdAt` / `featured → date` — як у наявних функціях.

## 4. Колекція Payload (`src/collections/<Name>.ts`)

```ts
import type { CollectionConfig } from 'payload'
import { revalidateAll } from '../hooks/revalidate'
import { authenticated, publishedOrAuthenticated } from '../access'

export const Things: CollectionConfig = {
  slug: 'things',
  labels: { singular: 'Річ', plural: 'Речі' },
  hooks: { afterChange: [revalidateAll], afterDelete: [revalidateAll] },   // обов'язково
  admin: { useAsTitle: 'title', group: 'Контент' },
  access: {
    read: publishedOrAuthenticated,   // публічно лише published; без status — () => true
    create: authenticated,
    update: authenticated,
    delete: authenticated,            // або adminOnly / superadminOnly
  },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true, label: 'Назва' },
    { name: 'slug', type: 'text', required: true, unique: true, index: true /* + generateSlug */ },
    { name: 'status', type: 'select', defaultValue: 'draft',
      options: [{ label: 'Чернетка', value: 'draft' }, { label: 'Опубліковано', value: 'published' }] },
    { name: 'order', type: 'number', min: 0 },
    { name: 'seo', type: 'group', fields: [ /* metaTitle, metaDescription — localized */ ] },
  ],
}
```
- `access` задавати **завжди явно**. Дані з персональною інформацією — ніколи не `read: () => true`.
- Після змін: `npm run generate:types` (і `npm run generate:importmap`, якщо змінились кастомні компоненти адмінки).
- Slug генерується через `src/utils/generateSlug.ts` (транслітерація UA → латиниця).

## 5. Заявка з клієнта

```ts
import { submitLead } from '@/client/lib/leads'
const result = await submitLead({ type: 'simple', name: name.trim(), contact: contact.trim(), message })
if (result.success) {
  router.push(`/thx?form=simple&token=${token}`)   // token = `${Date.now()}-<9 символів a-z0-9>`
}
```
`submitLead` додає `source` (поточна сторінка) і `utm` (з URL). Сервер (`src/app/api/leads/route.ts`) валідує, нормалізує, зберігає в `leads` і надсилає в Telegram. Див. [api.md](api.md).

## 6. Модалка

Глобальна контактна модалка відкривається через `ModalProvider` (`src/client/providers/ModalProvider.tsx`). Кнопки «Зв'язатися» викликають `useModal()`. Власну модалку для кожної сторінки не створювати.

## 7. Аналітика і cookie-згода

- Стан згоди — хук `useCookieConsent()` (`src/client/hooks/useCookieConsent.ts`, `useSyncExternalStore` над localStorage `abect_cookie_consent`). Записати рішення — `setCookieConsent('accepted' | 'declined')`.
- `Analytics.tsx` вантажить GA і Clarity лише коли згода `accepted`. Нові трекери підключаються тільки сюди, а їхні домени додаються в CSP (`next.config.mjs`).
- Не читати localStorage у `useEffect` + `setState` (правило `react-hooks/set-state-in-effect`).

## 8. Скло (`.glass`)

Ефект Glass з макета — глобальний клас `.glass` у `globals.scss`: розмиття фону, обідок-градієнт (`::before` з `mask`), внутрішнє світіння. Додати клас елементу з `border-radius`; колір і розмиття — через `--glass-bg`, `--glass-blur` (наприклад, на hover: `--glass-bg: var(--header-active)`). Активні «пігулки» всередині скла — `box-shadow: var(--glass-pill-shadow)`.

- `::before` у такого елемента зайнятий обідком — не використовувати його під інше.
- Писати **лише** `backdrop-filter`, без `-webkit-backdrop-filter`: Lightning CSS (збірка Next) при обох властивостях залишає тільки `-webkit-`, і в Chrome розмиття зникає. Префікс для Safari він додає сам.
- Бібліотеки liquid glass із SVG-заломленням не підключати: працюють лише в Chromium і важкі для фіксованих елементів.

## 9. Security-заголовки

`next.config.mjs` → `headers()` для всіх маршрутів, крім `/admin`. CSP **увімкнена** (enforce). `'unsafe-eval'` додається лише в dev. Новий зовнішній домен (скрипти, шрифти, API, iframe) треба додати у відповідну директиву, інакше браузер його заблокує. Перевірка: відкрити сторінку, у консолі не має бути `Refused to …`.
