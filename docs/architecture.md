# Архітектура та концепт

## Концепт продукту

**ABECT** — корпоративний сайт українського веб-агентства. Його головна задача — **генерувати ліди**: людина дізнається про послуги, бачить ціни й кейси, рахує вартість у калькуляторі та залишає заявку, яка одразу приходить у Telegram.

Ключові сценарії:

1. **Послуги** з двома ціновими моделями: **Weblium** (конструктор, швидко й дешево) та **Custom** (розробка на Next.js).
2. **Калькулятор вартості** — 6 кроків: тип проекту → платформа → кількість сторінок → додаткові послуги → терміновість → контакти. Ціни налаштовуються в CMS (global `calculator-config`).
3. **Портфоліо** — кейси (Brandify UA/EU, GeoSolution, Красота Одеса тощо).
4. **Блог** з категоріями (SEO-трафік).
5. **Заявки**: проста форма (модалка) і заявка з калькулятора → колекція `leads` + Telegram.
6. **SEO та AI-пошук**: JSON-LD, hreflang, динамічний sitemap, OG-зображення, `llms.txt`.

Мови: **UA** (за замовчуванням, без префікса в URL) та **EN** (`/en/...`).

## Стек

| Шар | Технологія |
|---|---|
| Фреймворк | Next.js 16 (App Router, Turbopack, `output: 'standalone'`), React 19.2, TypeScript 5.9 |
| CMS | Payload CMS 3.93 (вбудована в той самий Next-застосунок, адмінка на `/admin`) |
| БД | MongoDB 7 (`@payloadcms/db-mongodb`, mongoose) |
| Стилі | SCSS: окремий файл поруч з кожним компонентом |
| Шрифти | `next/font/google` у `[locale]/layout.tsx` (self-hosted): Montserrat — основний (`--font-montserrat`), Montserrat Alternates — акцентний з дизайну (`--font-montserrat-alt`), Victor Mono |
| i18n | `next-intl` 4.14 (локалі `ua`, `en`) + Payload localization (`uk`, `en`) |
| Редактор контенту | Lexical (`src/utils/editor.ts`) |
| Іконки | `lucide-react` |
| Сповіщення | Telegram Bot API (`src/utils/telegram.ts`) |
| Аналітика | GA4 + Microsoft Clarity, вмикаються лише після згоди на cookie (`useCookieConsent`) |
| Деплой | Docker (білд на VPS, non-root, healthcheck) + nginx + certbot, див. [deployment.md](deployment.md) |
| Перевірки | `npm run typecheck`, `npm run lint` (ESLint 9 flat config), `npm run build`. Автотестів немає |

## Схема роботи

```
Браузер ──HTTPS──► nginx (VPS) ──► 127.0.0.1:3333 ──► Next.js контейнер :3000 (agency-abect-frontend)
                                    ├── proxy.ts (next-intl)    /about → /ua/about (rewrite)
                                    ├── (frontend)/[locale]/*   публічні сторінки (ISR on-demand)
                                    ├── (payload)/admin         адмінка Payload
                                    ├── (payload)/api/*         Payload REST (GraphQL вимкнено)
                                    ├── api/leads, api/health   власні ендпоінти
                                    └── Payload Local API ──► MongoDB (abect-mongo)
                                                                    │
                                           Telegram Bot API ◄───────┘ (нова заявка)
```

### Як рендеряться сторінки

- **На білді нічого не пререндериться**: `generateStaticParams()` повертає `[]` (у layout і на всіх сторінках). У Docker-білді немає БД, тож раніше сторінки «застигали» порожніми до першої зміни в CMS.
- Кожна сторінка рендериться **при першому запиті** й кешується (Full Route Cache), наступні запити віддаються з кешу (`x-nextjs-cache: HIT`).
- Дані — через `payloadFetch()` (`src/client/lib/payload-fetch.ts`): `fetch` до **власного** Payload REST на `http://127.0.0.1:$PORT` з `next: { tags: ['all'] }` і `cache: 'force-cache'`. Помилка запиту **кидається**, тож сторінка з помилкою не кешується.
- **On-demand revalidation:** кожна колекція та global мають хуки `afterChange`/`afterDelete` → `revalidateAll()` (`src/hooks/revalidate.ts`, `revalidateTag('all', { expire: 0 })`). Будь-яка зміна в адмінці скидає кеш усіх сторінок; наступний запит отримує свіжі дані.
- `/thx` — `force-dynamic` (залежить від query). `sitemap.xml` — `force-dynamic` (Local API на кожен запит).

### Локалі — важливий нюанс

| Де | Коди |
|---|---|
| URL / `next-intl` (`src/client/i18n/routing.ts`) | `ua`, `en` (`localePrefix: 'as-needed'`) |
| Payload localization (`payload.config.ts`) | `uk`, `en` (default `uk`, `fallback: true`) |
| `<html lang>` | `uk` / `en` (мапінг у `layout.tsx`) |
| `og:locale` | `uk_UA` / `en_US` |
| hreflang | `uk-UA`, `en-US`, `x-default` — у metadata сторінок; авто-заголовок `Link` від next-intl вимкнено (`alternateLinks: false`) |

У lib-функції передається `locale` з URL (`ua`), а `payloadFetch` перетворює його на `uk` (`toPayloadLocale`).

### Next 16: proxy і `skipProxyUrlNormalize`

`src/proxy.ts` (колишній `middleware.ts`) робить rewrite `/about → /ua/about`. У Next 16.4 proxy отримує URL з хостом `localhost`, а rewrite порівнюється з URL на основі `HOSTNAME` (у Docker `0.0.0.0`). Без `skipProxyUrlNormalize: true` у `next.config.mjs` rewrite трактувався як зовнішній і давав 307-цикл / 500 на всіх українських сторінках. **Не прибирати цю опцію**, доки не перевірено на новій версії Next.

## Структура папок

```
frontend/
├── CLAUDE.md                 # правила для Claude
├── README.md                 # опис проекту + список документації
├── .github/                  # шаблон pull request
├── docs/                     # ця документація
├── messages/{ua,en}.json     # переклади інтерфейсу (next-intl)
├── public/                   # статика: favicon, logo.png, seo/*-og.jpg, llms.txt, icons/, images/
├── media/                    # завантаження Payload (не в git, на VPS це volume)
├── src/
│   ├── access/                    # хелпери прав доступу (ролі)
│   ├── app/
│   │   ├── (frontend)/[locale]/   # публічні сторінки: page.tsx = дані + metadata + JSON-LD
│   │   ├── (payload)/             # адмінка та API Payload (згенеровано, не правити вручну)
│   │   ├── api/leads/route.ts     # POST заявок
│   │   ├── api/health/route.ts    # healthcheck
│   │   ├── robots.ts, sitemap.ts
│   ├── client/
│   │   ├── components/            # перевикористовувані UI-компоненти (Header, Footer, Calculator…)
│   │   ├── config/site.ts         # SITE_URL — єдине місце з доменом
│   │   ├── hooks/                 # useCookieConsent
│   │   ├── modules/<page>/        # секції конкретних сторінок (home/Hero, about/AboutTeam…)
│   │   ├── lib/                   # payload-fetch + запити (blog, services, portfolio, calculator, leads)
│   │   ├── i18n/                  # routing, navigation, request (next-intl)
│   │   └── providers/             # ModalProvider
│   ├── collections/               # колекції Payload
│   ├── globals/                   # CalculatorConfig
│   ├── hooks/revalidate.ts        # revalidateAll() для хуків колекцій
│   ├── utils/                     # telegram, generateSlug, editor
│   ├── scripts/                   # seed-скрипти (npm run seed:services)
│   ├── proxy.ts                   # next-intl proxy (Next 16)
│   ├── payload.config.ts
│   └── payload-types.ts           # ЗГЕНЕРОВАНО: npm run generate:types
├── Dockerfile, docker-compose.yml, .dockerignore
└── .env.example
```

## Колекції Payload

| Slug | Призначення | Локалізовано |
|---|---|---|
| `services` | Послуги (ціни Weblium/Custom, FAQ, пов'язані кейси) | так |
| `service-types` | Категорії послуг (URL `/services/[type]`) | так |
| `portfolio` | Кейси | так |
| `posts` | Статті блогу (`draft` / `published` / `archived`) | так |
| `categories` | Категорії блогу | так |
| `media` | Файли та зображення (`alt`, `caption`, `folder`) | ні |
| `leads` | Заявки з форм | ні |
| `users` | Адміни (`superadmin` / `admin` / `moderator`) | так |
| global `calculator-config` | Типи проектів, ціни, додаткові послуги, коефіцієнти терміновості; `heroPrices` — плашки з цінами в hero головної (порожньо → дефолтні з макета) | так |

Колекцію `comments` видалено 2026-11-09 (на фронті не використовувалась). Документи, якщо були, лишились у MongoDB, але в адмінці не показуються.
