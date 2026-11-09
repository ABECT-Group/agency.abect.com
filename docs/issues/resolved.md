# Історія вирішених проблем

> Нові записи додаються **зверху**. Формат: ID (якщо був) · дата · що було · як виправлено · посилання на ченджлог.
> Записи до 2026-11-07 перенесено з видалених звітів `frontend/REPORT.md` (аудит коду 2026-04-17), `ACTION-PLAN.md` і `FULL-AUDIT-REPORT.md` (SEO-аудит 2026-04-18). Кожен пункт звірено з поточним кодом 2026-11-07.

---

## 2026-11-09 — Безпека, оновлення, інфраструктура ([ченджлог](../changelogs/2026-11-09.md))

Код виправлено в репозиторії. На проді — після деплою (ISS-026 у [current.md](current.md)).

| ID | Що було | Як вирішено |
|---|---|---|
| ISS-001 | Заявки (ПІБ, телефони, email) публічно читались і створювались через GraphQL: `leads.access.read/create = () => true` | `leads`: read/update — залогінені, delete — admin, create — `false` (лише `POST /api/leads`). GraphQL вимкнено, роути `api/graphql*` видалено. Перевірено: анонімний `GET /api/leads/:id` → 403, `/api/graphql` → 404 |
| ISS-002 | Порт `3333:3000` відкритий в інтернет (адмінка по HTTP в обхід nginx) | `127.0.0.1:3333:3000` |
| ISS-004 | Критичні CVE: `next` 15.4.10, `payload`/`@payloadcms/*` 3.72.0 (pre-auth account takeover), `next-intl` 4.4, `sharp` 0.34 та ін. (41 вразливість, 6 critical) | Next 16.4.5, Payload 3.93.0, React 19.2.9, next-intl 4.14.9, sharp 0.35.5, eslint-config-next 16.4.5; overrides `happy-dom`, `dompurify`, `minimatch`. Лишилось 7 low (ISS-025) |
| ISS-003 | `NEXT_PUBLIC_*` не потрапляли в Docker-білд (аналітика мертва, Origin-check вимкнений) | `ARG`/`ENV` у Dockerfile + build args `${VAR}` у compose. Серверні запити більше не залежать від `NEXT_PUBLIC_SERVER_URL` (`payloadFetch` → `127.0.0.1:$PORT`) |
| ISS-005 | Зайва external-мережа `mongodb-net` | Видалено з compose |
| ISS-006 | Бекапи без `media/`, ротації, `trap`, копії поза сервером | `../scripts/backup.sh` (поза git): БД + `media/`, ротація 14 днів, `trap`, `chmod 600`, опційно `rclone`. Cron — задача власника (ISS-027) |
| ISS-007 | Sitemap без динамічних сторінок (статичний, згенерований на білді без БД) | `sitemap.ts` — `force-dynamic`; послуги фільтруються за `published` (раніше потрапляли б і чернетки) |
| ISS-008 | Простій ~5 хв на кожному деплої | `restart.sh`: `build` → `up -d` → health-check → `image prune`; lock-файл |
| ISS-009 | OG-зображення 404 (14 файлів) і `/logo.png` 404 (JSON-LD) | Згенеровано `public/seo/*.jpg` (1200×630, фірмовий стиль) і `public/logo.png` (512×512) |
| ISS-010 | `Link: hreflang="ua"`, у Payload ішов `locale=ua` | `alternateLinks: false` у proxy (hreflang — у metadata), `toPayloadLocale()` мапить `ua → uk` |
| ISS-011 | Ролі майже не перевірялись: будь-хто залогінений міг створювати користувачів і змінювати собі роль | `src/access/`: users — create/delete лише superadmin, update — себе або superadmin, поле `role` — лише superadmin; `calculator-config` — admin; запобіжник «немає superadmin»; перший користувач → superadmin. Перевірено в роботі |
| ISS-012 | Колекція `comments` не використовувалась | Видалено з конфігу й типів |
| ISS-013 | Шаблонні тести Payload Blank Template | Видалено `tests/`, конфіги vitest/playwright і 8 devDependencies |
| ISS-015 | `X-Powered-By: Next.js, Payload` | `poweredByHeader: false` |
| ISS-016 | Dockerfile: root, devDeps і `src` в образі, healthcheck залежав від БД | `output: 'standalone'`, `USER node`, лише standalone + static + public, healthcheck `/api/health` |
| ISS-017 | `name: "cms"`, опис і версія з шаблону | `agency-abect` 2.1.0, `private`, `engines.node ≥ 20.9` (git-теги — ISS-031) |
| ISS-018 | `mongodb/` і `scripts/` поза git, на сервер через SFTP | **Закрито рішенням власника:** ці папки свідомо лишаються поза репозиторієм. (Перенесення в `infra/` у коміті `1f021f2` скасовано) |
| ISS-019 | fetch-блок скопійований у ~20 lib-функціях, icons/metadata у 13 сторінках, хардкод домену | `payloadFetch`/`payloadFind`; icons/manifest/metadataBase/authors — у layout; `SITE_URL` |
| ISS-020 | Дубль `src/app/(frontend)/favicon.ico` | Видалено, `favicon.ico` прописано в metadata layout |
| ISS-021 | Rate limit обходився підробкою `X-Forwarded-For` | IP з `X-Real-IP`, інакше останнє значення XFF. Перевірено: підроблений XFF не дає обійти ліміт |
| ISS-022 | Сторінки пререндерились на білді без БД і могли кешуватись порожніми | `generateStaticParams → []`: рендер при першому запиті з реальною БД; `payloadFetch` кидає помилку замість `[]` (помилка не кешується). Перевірено: зміна в CMS одразу видна на закешованій сторінці |
| ISS-023 | CSP у Report-Only з `unsafe-eval` | CSP enforce, `unsafe-eval` лише в dev, додано `*.clarity.ms` (Clarity вантажить скрипти з `scripts.clarity.ms`). Перевірено в браузері: порушень немає (`unsafe-inline` — ISS-029) |

**Нові баги, знайдені й виправлені в процесі:**

| Що було | Як вирішено |
|---|---|
| Telegram: MarkdownV2 з неекранованими `!` і URL у статичному тексті → кожне повідомлення відхилялось, запасне йшло без форматування й **без `message_thread_id`** (не в ту гілку) | `parse_mode: HTML` з екрануванням; запасний варіант — у ту саму гілку; таймаут на обидва запити |
| `/api/leads`: Origin перевірявся через `startsWith` (пропускав `agency.abect.com.evil.com`) | Порівняння host цілком |
| `/api/leads`: без обмежень довжини полів і перевірки даних калькулятора | Ліміти довжини, нормалізація `calculatorData`, `platform` ∈ {weblium, custom} |
| Slug з URL вставлявся в запит до Payload без кодування (`?where[slug][equals]=${slug}`) | `URLSearchParams` у `payloadFetch` |
| `getRelatedPosts` / `getRelatedProjects` використовували `baseUrl`, який міг бути `undefined` | Переписано на `payloadFind` |
| Чернетки й архів (`posts`, `portfolio`, `services`) читались публічно через REST | `publishedOrAuthenticated`. Перевірено: анонім бачить лише `published` |
| Мобільний фільтр послуг: `window.location.href = '/services'` перекидав EN-користувача на UA | `useRouter` з next-intl |
| `Header.scss`: `:global(.fixed-body)` у глобальному SCSS невалідний (правило відкидалось) | Дубль прибрано, робоче правило — у `globals.scss` |
| Контактна модалка не очищувала форму після успішної відправки | `resetForm()` перед закриттям |
| `CookieBanner` / `Analytics`: `setState` в `useEffect` (нові правила react-hooks) | Хук `useCookieConsent` на `useSyncExternalStore` |
| 7 попереджень ESLint (невикористані змінні та імпорти) | Виправлено: lint 0 / 0 |

## 2026-11-07 — Чистка проекту ([ченджлог](../changelogs/2026-11-07.md))

| Що було | Як вирішено |
|---|---|
| Дві реалізації `/llms.txt`: `public/llms.txt` і `src/app/llms.txt/route.ts` (на проді віддавався статичний файл, роут був мертвим кодом) | Видалено `src/app/llms.txt/route.ts` |
| `public/seo/*` — 6 favicon і `site.webmanifest`, точні копії файлів із `public/`, ніде не використовувались | Видалено |
| Невикористані ассети `public/icons/pattern-old.svg`, `public/icons/ABECT.svg`, `public/companies/brandify-og.jpg` | Видалено |
| Застарілий звіт `REPORT.md` у репозиторії | Видалено, актуальні пункти перенесено в `issues/current.md` |
| Застаріла й розкидана документація в корені (`docs/`, `ACTION-PLAN.md`, `FULL-AUDIT-REPORT.md`, `ІНСТРУКЦІЯ-ДЛЯ-ВЛАСНИКА.md`, порожній `docs/pswd.txt`) | Видалено. Документація зведена у `frontend/docs/`, README додано в `scripts/` і `mongodb/` |
| Не було ченджлогу | Заведено `docs/changelogs/` з відновленою історією з git |

## 2026-04-18 — SEO-виправлення (коміти `03032ad`, `27c36b7` та ін.; [ченджлог](../changelogs/2026-04-18.md))

| Що було | Як вирішено |
|---|---|
| `<html lang="ua">` — невалідний BCP47 | `lang="uk"` (мапінг у `layout.tsx`) |
| `og:locale="ua"` | `uk_UA` / `en_US` на всіх сторінках |
| `/privacy-policy` повертав 404, хоча посилання є у футері | Створено сторінку (UA + EN) + чекбокс згоди у формах |
| Немає `x-default` hreflang | Додано на всі сторінки (2026-04-20 переведено на EN) |
| Немає CSP | CSP у режимі Report-Only (`next.config.mjs`) |
| Немає BreadcrumbList на секційних сторінках | JSON-LD додано |
| Немає hreflang у sitemap | `alternates` у `sitemap.ts` |
| Низький пріоритет калькулятора в sitemap | 0.3 → 0.6 |
| Анімація зірок ігнорувала `prefers-reduced-motion` | Виправлено в `StarsBackground` |
| Немає `llms.txt` | Створено |
| Schema Organization без логотипу | Organization + ProfessionalService, коректний logo URL |
| Немає alt у лого й hero | Додано |
| Аналітика вантажилась без згоди | GA + Clarity лише після згоди в CookieBanner |
| `/thx` міг індексуватися | `noindex` |
| Кастомна 404 не показувалась | Виправлено (`de862b7`) |
| Модалка давала layout shift (зникав скролбар) | Виправлено (`74aaf8a`) |

## 2026-04-17 — Аудит коду, v2.0 ([ченджлог](../changelogs/2026-04-17.md))

| Що було | Як вирішено |
|---|---|
| `PAYLOAD_SECRET` за замовчуванням `''` | `payload.config.ts` кидає помилку, якщо змінна не задана |
| `DATABASE_URI` за замовчуванням `''` | Те саме |
| `/api/send-telegram`: відкритий ендпоінт, будь-хто міг слати повідомлення в Telegram | Видалено |
| `sendMessageTG.ts` — мертвий клієнтський сервіс | Видалено |
| `/api/revalidate` і шаблонний `my-route` у публічному доступі | Видалено |
| ISR `revalidate=300` + конфлікт `force-cache` у lib-файлах | SSG + on-demand: `next: { tags: ['all'] }`, хуки `afterChange`/`afterDelete` → `revalidateTag('all')` у всіх колекціях і в `CalculatorConfig` |
| `generateStaticParams` у `portfolio/[slug]` падав у Docker-білді (`ECONNREFUSED`) | Прибрано, `dynamicParams = true` |
| `as any` при створенні ліда в `api/leads/route.ts` | Типізований `LeadCreateData` |
| Немає rate limit на `/api/leads` | 5 запитів / IP / 60 с (in-memory). Обхід через XFF — див. ISS-021 |
| Немає CSRF-захисту `/api/leads` | Перевірка `Origin`. Не працює, поки немає ISS-003 |
| `comments`: update/delete міг будь-який залогінений | Лише `admin` / `superadmin` |
| Telegram-запит без таймауту | `AbortController`, 10 с |
| `TELEGRAM_THREAD_ID` не перевірявся / не документований | Додано в `.env.example`, обробляється опційно |
| `Footer`: `setCurrentYear` на кожному рендері | Виправлено |
| Хардкод `'Орієнтовна вартість:'` у калькуляторі | Винесено в i18n |
| Російський коментар у `middleware.ts` | Замінено |
| Змішування `pnpm` і `npm` | Лише npm |
| Типи ID MongoDB (`number` замість `string`) | Виправлено (`82237e7`) |

## 2025-12-27 — CVE у React Server Components

| Що було | Як вирішено |
|---|---|
| Вразливі версії React / Next (RSC CVE) | PR #2 від бота Vercel (`059ede0`) підняв версії |
