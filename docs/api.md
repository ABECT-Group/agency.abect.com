# API

Базовий URL: прод — `https://agency.abect.com`, локально — `http://localhost:3000`.

## 1. Власні ендпоінти

### `POST /api/leads` — створення заявки

Файл: `src/app/api/leads/route.ts`. Клієнт: `submitLead()` у `src/client/lib/leads.ts`.

**Захист:**
- **Origin (CSRF).** Якщо браузер надіслав `Origin`, його host має **точно** збігатися з host із `NEXT_PUBLIC_SERVER_URL` або з `Host`/`X-Forwarded-Host` запиту. Інакше `403`. Запити без `Origin` (не з браузера) пропускаються: CSRF для них неможливий.
- **Rate limit:** 5 запитів / 60 с / IP, у пам'яті процесу (скидається при рестарті, для одного інстансу достатньо). IP береться з `X-Real-IP` (ставить nginx), запасний варіант — **останнє** значення `X-Forwarded-For`. Підробити ці значення клієнт не може.
- **Валідація й нормалізація:** ім'я 2–200 символів, контакт — телефон (10–13 цифр) або email (≤ 320), коментар ≤ 5000, `source` ≤ 2000, UTM ≤ 200. Дані калькулятора перевіряються: `platform` ∈ {`weblium`, `custom`}, числа приводяться до чисел, списки — до ≤ 50 рядків. Однакові нормалізовані значення йдуть і в БД, і в Telegram.

**Тіло: проста форма**
```json
{
  "type": "simple",
  "name": "Іван Петренко",          // обов'язково, 2–200 символів
  "contact": "+380501234567",       // обов'язково, телефон або email
  "message": "Потрібен лендинг",    // опційно, ≤ 5000
  "source": "/services",            // додає submitLead()
  "utm": { "source": "google", "medium": "cpc", "campaign": "x" }
}
```

**Тіло: калькулятор** — ті самі поля плюс:
```json
{
  "type": "calculator",
  "calculatorData": {
    "projectType": "landing",          // обов'язково
    "projectTypeName": "Лендинг",      // лише для Telegram
    "platform": "weblium",             // обов'язково: weblium | custom
    "pagesCount": 5,
    "additionalServices": ["seo"],
    "additionalServicesNames": ["SEO"],
    "urgency": "standard",
    "urgencyName": "Стандарт",
    "estimatedPrice": 12000,
    "estimatedTimeline": "2–3 тижні"
  }
}
```

**Відповіді**

| Код | Тіло |
|---|---|
| 200 | `{ "success": true, "message": "Заявка успішно відправлена", "id": "<mongoId>" }` |
| 400 | `{ "success": false, "error": "…" }` — ім'я, контакт, тип, коментар задовгий, неповні дані калькулятора, невірний формат |
| 403 | `{ "success": false, "error": "Forbidden" }` (Origin) |
| 429 | `{ "success": false, "error": "Забагато запитів. Спробуйте через хвилину." }` |
| 500 | `{ "success": false, "error": "Внутрішня помилка сервера" }` |
| 405 | на `GET /api/leads`: роут перекриває Payload REST для `leads` |

**Побічні ефекти:** запис у колекцію `leads` (`status: "new"`) через Payload Local API (`overrideAccess`), потім асинхронне повідомлення в Telegram (відповідь клієнту його не чекає).

### Службові маршрути

| Маршрут | Джерело |
|---|---|
| `GET /api/health` | `src/app/api/health/route.ts` → `{ "status": "ok" }`, без БД. Docker healthcheck |
| `GET /sitemap.xml` | `src/app/sitemap.ts`, `force-dynamic`: статичні сторінки + опубліковані posts / portfolio / services з Payload на кожен запит |
| `GET /robots.txt` | `src/app/robots.ts`: забороняє `/admin/` і `/api/`, явно дозволяє AI-ботів |
| `GET /llms.txt` | статичний файл `public/llms.txt` |

## 2. Payload REST API (`/api/<collection>`)

Генерується автоматично (`src/app/(payload)/api/[...slug]/route.ts`). Сайт читає його через `payloadFetch()` (`src/client/lib/payload-fetch.ts`), див. [patterns.md](patterns.md#3-запит-до-cms-srcclientlib).

```
GET /api/<slug>?where[status][equals]=published&locale=uk&limit=100&depth=2&sort=-createdAt
GET /api/<slug>/<id>
GET /api/globals/calculator-config?locale=uk
```

| Параметр | Опис |
|---|---|
| `where[field][op]=value` | фільтр (`equals`, `not_equals`, `in`, `like`, `exists`…) |
| `locale` | `uk` \| `en` — коди Payload. `payloadFetch` сам мапить `ua` → `uk` |
| `depth` | глибина розгортання relationship (зазвичай `2`) |
| `limit`, `page`, `sort` | пагінація та сортування |

Відповідь списку: `{ docs: T[], totalDocs, limit, page, totalPages, hasNextPage, ... }`.

### Матриця доступів

Хелпери — `src/access/index.ts`.

| Slug | read | create | update | delete |
|---|---|---|---|---|
| `posts`, `portfolio`, `services` | 🌐 лише `published`; 🔐 усі (з чернетками) | 🔐 | 🔐 | 🔐 |
| `service-types`, `categories`, `media` | 🌐 | 🔐 | 🔐 | 🔐 |
| global `calculator-config` | 🌐 | — | 👑 admin / superadmin | — |
| `leads` | 🔐 | ❌ лише через `POST /api/leads` | 🔐 | 👑 admin / superadmin |
| `users` | 🔐 | ⭐ superadmin | себе; ⭐ superadmin — будь-кого | ⭐ superadmin |
| поле `users.role` | — | ⭐ superadmin | ⭐ superadmin | — |

Легенда: 🌐 публічно · 🔐 будь-який залогінений (moderator / admin / superadmin) · 👑 admin або superadmin · ⭐ лише superadmin.

**Запобіжник:** поки в базі немає жодного `superadmin`, дії ⭐ дозволені будь-якому залогіненому користувачу — щоб власник міг призначити собі роль. Перший користувач, створений через `/admin/create-first-user`, автоматично стає `superadmin`.

## 3. GraphQL

**Вимкнено** (`graphQL: { disable: true }` у `payload.config.ts`, роути `api/graphql*` видалено). `POST /api/graphql` → `404`. Сайт і адмінка працюють через REST / Local API.

## 4. Адмінка

`/admin` — Payload Admin UI. Авторизація через колекцію `users` (cookie `payload-token`). Ролі: `superadmin`, `admin`, `moderator` (дефолт для нових — `moderator`). Права — див. матрицю вище.

## 5. Telegram

Файл `src/utils/telegram.ts`, функція `sendTelegramNotification(lead): Promise<boolean>`.

- `POST https://api.telegram.org/bot<TOKEN>/sendMessage`, `parse_mode: HTML`, усі дані користувача екрануються (`&`, `<`, `>`).
- Якщо Telegram не зміг розібрати розмітку — повтор тим самим текстом без розмітки **в ту саму гілку** (`message_thread_id`).
- Env: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_THREAD_ID` (тема у форум-групі, опційно).
- Таймаут 10 с на кожен запит. Якщо змінних немає, функція повертає `false` і пише лог.
- Формати: проста заявка (ім'я, контакт, коментар, сторінка, час Europe/Kyiv) і заявка з калькулятора (додатково тип, платформа, сторінки, послуги, терміновість, ціна, термін).

## 6. Env-змінні застосунку

| Змінна | Де читається | Коли |
|---|---|---|
| `DATABASE_URI` | `payload.config.ts` (кидає помилку, якщо немає) | runtime; на білді — заглушка |
| `PAYLOAD_SECRET` | `payload.config.ts` (кидає помилку, якщо немає) | runtime; на білді — заглушка |
| `NEXT_PUBLIC_SERVER_URL` | `api/leads` (Origin) | вшивається на білді (build arg) |
| `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_CLARITY_ID` | `Analytics.tsx` (клієнт) | вшивається на білді (build arg) |
| `PAYLOAD_INTERNAL_URL` | `lib/payload-fetch.ts` | runtime, опційно (дефолт: на Vercel `https://$VERCEL_URL`, інакше `http://127.0.0.1:$PORT`) |
| `APP_ENV` | `utils/env.ts`, `next.config.mjs` | `production` \| `preview`. Не задано → на Vercel `preview`, інакше `production`. `preview`: noindex (`robots.txt`, sitemap, `X-Robots-Tag`), заявки в Telegram з позначкою «ТЕСТОВЕ СЕРЕДОВИЩЕ». Заголовок `X-Robots-Tag` визначається на білді |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_THREAD_ID` | `utils/telegram.ts` | runtime |
