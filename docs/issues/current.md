# Поточні проблеми

> Оновлено: **2026-11-09**. Нові проблеми додавати з наступним вільним номером `ISS-XXX` (останній — ISS-031).
> Коли проблему виправлено, запис **переноситься** в [resolved.md](resolved.md) з датою і посиланням на ченджлог.
>
> Пріоритети: 🔴 критично, робити негайно · 🟠 високий · 🟡 середній · ⚪ низький / техборг

## Зведення

| ID | Пріоритет | Коротко | Де |
|---|---|---|---|
| ISS-026 | 🔴 | Виправлення 2026-11-09 ще не задеплоєні: на проді досі відкриті заявки, порт 3333 і вразливі версії | VPS |
| ISS-014 | 🟡 | nginx на сервері не звірений з еталоном: дубль HSTS, потрібні `X-Real-IP` і `X-Forwarded-Host` | nginx |
| ISS-027 | 🟡 | Задачі власника після деплою: паролі, роль superadmin, cron бекапів, rclone, GA/Clarity | VPS / адмінка |
| ISS-024 | ⚪ | `../.claude/settings.local.json` — мертві дозволи на `E:/Startups/ABECT` і надто широкі правила | корінь |
| ISS-028 | ⚪ | Старі копії `../mongodb/` і `../scripts/` поза git (локально й на VPS) — тепер дублікати `infra/` | корінь |
| ISS-025 | ⚪ | `npm audit`: 7 low — `deepmerge` 4.3.1 усередині Payload, виправленої версії не існує | залежності |
| ISS-029 | ⚪ | CSP містить `'unsafe-inline'` для скриптів (JSON-LD, аналітика) | `next.config.mjs` |
| ISS-030 | ⚪ | Обхід бага Next 16.4 `skipProxyUrlNormalize: true` — перевіряти при кожному оновленні Next | `next.config.mjs` |
| ISS-031 | ⚪ | Немає git-тегів версій (у `package.json` уже `2.1.0`) | git |

---

## 🔴 Критичні

### ISS-026 — Виправлення ще не на проді
Код у `main` виправлений (ISS-001…004 і решта, див. [resolved.md](resolved.md)), але на VPS працює стара збірка: заявки клієнтів читаються через GraphQL без логіну, адмінка відкрита по HTTP на `:3333`, Next/Payload з критичними CVE.
**Що зробити:** пройти розділ «Міграція 2026-11-09» у [deployment.md](../deployment.md#міграція-2026-11-09-одноразово) і перевірити пункти з нього.

## 🟡 Середні

### ISS-014 — nginx
- Еталон — у [deployment.md](../deployment.md#nginx-etcnginxsites-availableagencyabectcom). Звірити з `/etc/nginx/sites-available/agency.abect.com`.
- **Обов'язково** `proxy_set_header X-Real-IP $remote_addr;` — з нього `/api/leads` бере IP для rate limit. Без нього використовується останнє значення `X-Forwarded-For` (теж безпечно, якщо nginx його дописує).
- `X-Forwarded-Host $host` — бажано (перевірка Origin).
- Не дублювати HSTS / X-Frame-Options (їх ставить Next.js), прибрати застарілий `X-XSS-Protection`, прибрати `www.agency.abect.com` (немає DNS).

### ISS-027 — Задачі власника після деплою
1. Змінити паролі всіх користувачів адмінки (до виправлення адмінка була доступна по HTTP, а Payload мав критичну вразливість відновлення пароля).
2. Призначити собі роль `superadmin` (поки її немає ні в кого, це дозволено будь-якому залогіненому). Решті — `admin` або `moderator`.
3. Налаштувати cron для `infra/scripts/backup.sh` і, бажано, `RCLONE_REMOTE` (копія поза сервер).
4. Отримати ID GA4 / Clarity і вписати в `.env.frontend` (`NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_CLARITY_ID`), потім передеплой.
5. Контент: стаття зі slug `1` (`/blog/ai-digital-professions/1`) схожа на тестову або з неправильним slug — перевірити в адмінці.
6. Після деплою відкрити головну, `/services`, `/portfolio`, `/blog` (UA і EN) — переконатися, що дані на місці (ISS-022 виправлено конструктивно, але перевірка на проді — обов'язкова).

## ⚪ Низькі / техборг

- **ISS-024** — Почистити `E:\Pet-projects\AgencyAbect\.claude\settings.local.json`: прибрати 25 правил зі шляхом `E:/Startups/ABECT/...` і надто широкі `Bash(curl *)`, `Bash(node *)`, `Bash(python3 *)`, `Bash(xargs grep *)`. Claude змінювати власні налаштування не може — правка вручну. Достатньо лишити: `npm install *`, `npm run *`, `npm audit *`, `npx tsc *`, `WebFetch(domain:agency.abect.com)`.
- **ISS-028** — Після переходу на `infra/` видалити `AgencyAbect/mongodb/` і `AgencyAbect/scripts/` локально, а на VPS — `/home/admin/www/abect/scripts/` (і `mongodb/` після переходу Mongo, див. `infra/mongodb/README.md`).
- **ISS-025** — `deepmerge` ≤ 4.3.1 (prototype poisoning у `mergeObject`), транзитивно через `payload` / `@payloadcms/db-mongodb`. Payload зливає лише власні конфіги, не дані користувача, тож ризик низький. Прибрати, коли вийде виправлена версія або Payload замінить залежність. Решта `npm audit`: 0 critical / 0 high / 0 moderate (overrides для `happy-dom`, `dompurify`, `minimatch` — у `package.json`).
- **ISS-029** — `script-src 'unsafe-inline'` потрібен для inline JSON-LD і скриптів GA/Clarity. Прибрати можна через nonce (proxy генерує nonce → заголовок CSP → `<Script nonce>`), але це робить усі сторінки динамічними. Оцінити, чи варто.
- **ISS-030** — У Next 16.4 proxy отримує URL з хостом `localhost`, а rewrite порівнюється з URL на основі `HOSTNAME`; без `skipProxyUrlNormalize: true` усі UA-сторінки дають 307-цикл / 500. Після оновлення Next перевірити, чи баг виправлено (прибрати опцію → `npm run build` → standalone з `HOSTNAME=0.0.0.0` → `curl /about` має бути 200).
- **ISS-031** — Запровадити git-теги (`v2.1.0` для релізу 2026-11-09) і підвищувати `version` у `package.json` за semver.
