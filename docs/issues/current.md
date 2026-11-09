# Поточні проблеми

> Оновлено: **2026-11-09**. Нові проблеми додавати з наступним вільним номером `ISS-XXX` (останній — ISS-038).
> Коли проблему виправлено, запис **переноситься** в [resolved.md](resolved.md) з датою і посиланням на ченджлог.
>
> Пріоритети: 🔴 критично, робити негайно · 🟠 високий · 🟡 середній · ⚪ низький / техборг

## Зведення

| ID | Пріоритет | Коротко | Де |
|---|---|---|---|
| ISS-026 | 🔴 | Виправлення 2026-11-09 ще не задеплоєні: на проді досі відкриті заявки, порт 3333 і вразливі версії | VPS |
| ISS-014 | 🟡 | nginx на сервері не звірений з еталоном: дубль HSTS, потрібні `X-Real-IP` і `X-Forwarded-Host` | nginx |
| ISS-027 | 🟡 | Задачі власника: паролі, роль superadmin, cron бекапів, rclone, GA/Clarity, захист `main` на GitHub | VPS / адмінка / GitHub |
| ISS-024 | ⚪ | `../.claude/settings.local.json` — мертві дозволи на `E:/Startups/ABECT` і надто широкі правила | корінь |
| ISS-025 | ⚪ | `npm audit`: 7 low — `deepmerge` 4.3.1 усередині Payload, виправленої версії не існує | залежності |
| ISS-029 | ⚪ | CSP містить `'unsafe-inline'` для скриптів (JSON-LD, аналітика) | `next.config.mjs` |
| ISS-030 | ⚪ | Обхід бага Next 16.4 `skipProxyUrlNormalize: true` — перевіряти при кожному оновленні Next | `next.config.mjs` |
| ISS-031 | ⚪ | Немає git-тегів версій (у `package.json` уже `2.1.0`) | git |
| ISS-032 | ⚪ | Токен для `/thx` зрідка коротший за 9 символів → користувача перекидає на головну замість сторінки подяки | `ContactModal.tsx`, `Calculator.tsx` |
| ISS-033 | ⚪ | Без `.gitattributes` git на Windows показує `payload-types.ts` зміненим (лише кінці рядків); `AGENTS.md` від `next dev` не закомічено | корінь |
| ISS-037 | 🟡 | Розмиття (`backdrop-filter`) у калькуляторі не працює в Chrome / Edge — Lightning CSS лишає лише `-webkit-` | `Calculator.scss` |
| ISS-036 | 🟡 | Ціни не узгоджені: hero 199/399/799 $, секція послуг у макеті 100/300/450 $, калькулятор у CMS — у UAH | дизайн / CMS |
| ISS-038 | 🟡 | Превʼю на Vercel: `payloadFetch` ходить на `127.0.0.1:$PORT`, якого на Vercel немає → дані CMS не завантажуються | `lib/payload-fetch.ts` |
| ISS-035 | ⚪ | Дрібні неточності документації: «кожна колекція» має revalidate-хуки (у `leads`, `users` немає), README без `devsafe`/`pl`, `devsafe` використовує `rm -rf` | `docs/`, `package.json` |

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
3. Залити оновлені `../scripts/*.sh` на сервер (SFTP) і налаштувати cron для `backup.sh` і, бажано, `RCLONE_REMOTE` (копія поза сервер).
4. Отримати ID GA4 / Clarity і вписати в `.env.frontend` (`NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_CLARITY_ID`), потім передеплой.
5. Контент: стаття зі slug `1` (`/blog/ai-digital-professions/1`) схожа на тестову або з неправильним slug — перевірити в адмінці.
6. Після деплою відкрити головну, `/services`, `/portfolio`, `/blog` (UA і EN) — переконатися, що дані на місці (ISS-022 виправлено конструктивно, але перевірка на проді — обов'язкова).
7. GitHub: додати розробника (Collaborators → Write), увімкнути ruleset для `main` (лише через PR, без force push і видалення), Squash merge + автовидалення гілок — див. [git-workflow.md](../git-workflow.md#41-одноразове-налаштування-github).

## ⚪ Низькі / техборг

- **ISS-024** — Почистити `E:\Pet-projects\AgencyAbect\.claude\settings.local.json`: прибрати 25 правил зі шляхом `E:/Startups/ABECT/...` і надто широкі `Bash(curl *)`, `Bash(node *)`, `Bash(python3 *)`, `Bash(xargs grep *)`. Claude змінювати власні налаштування не може — правка вручну. Достатньо лишити: `npm install *`, `npm run *`, `npm audit *`, `npx tsc *`, `WebFetch(domain:agency.abect.com)`.
- **ISS-025** — `deepmerge` ≤ 4.3.1 (prototype poisoning у `mergeObject`), транзитивно через `payload` / `@payloadcms/db-mongodb`. Payload зливає лише власні конфіги, не дані користувача, тож ризик низький. Прибрати, коли вийде виправлена версія або Payload замінить залежність. Решта `npm audit`: 0 critical / 0 high / 0 moderate (overrides для `happy-dom`, `dompurify`, `minimatch` — у `package.json`).
- **ISS-029** — `script-src 'unsafe-inline'` потрібен для inline JSON-LD і скриптів GA/Clarity. Прибрати можна через nonce (proxy генерує nonce → заголовок CSP → `<Script nonce>`), але це робить усі сторінки динамічними. Оцінити, чи варто.
- **ISS-030** — У Next 16.4 proxy отримує URL з хостом `localhost`, а rewrite порівнюється з URL на основі `HOSTNAME`; без `skipProxyUrlNormalize: true` усі UA-сторінки дають 307-цикл / 500. Після оновлення Next перевірити, чи баг виправлено (прибрати опцію → `npm run build` → standalone з `HOSTNAME=0.0.0.0` → `curl /about` має бути 200).
- **ISS-031** — Запровадити git-теги (`v2.1.0` для релізу 2026-11-09) і підвищувати `version` у `package.json` за semver.
- **ISS-032** — Токен генерується як `` `${Date.now()}-${Math.random().toString(36).slice(2, 11)}` ``, а `thx/page.tsx` вимагає рівно 9 символів (`/^(\d{13})-[a-z0-9]{9}$/`). Якщо `toString(36)` дає короткий рядок (рідко), сторінка подяки не показується. Виправлення: `.padEnd(9, '0')` або генерувати через `crypto.getRandomValues`; винести генерацію в один хелпер.
- **ISS-033** — `.gitattributes` видалили разом з `infra/` (2026-11-09), а в розробника `core.autocrlf=true`: `src/payload-types.ts` після `generate:types` / `next dev` має LF і git позначає його зміненим, хоча вміст той самий (`git diff` порожній). Варіант: повернути `.gitattributes` з `* text=auto eol=lf`. `AGENTS.md` створює й дописує `next dev` (правила для AI-агентів від Next) — Next радить його закомітити, інакше він постійно з'являтиметься як новий файл.
- **ISS-035** — `architecture.md` («Як рендеряться сторінки»): хуки `revalidateAll` є не в кожній колекції — у `leads` і `users` їх немає (і не треба, їх немає на сайті); уточнити формулювання. `README.md` не згадує скрипти `devsafe`, `pl`; `devsafe` (`rm -rf .next`) не працює в cmd на Windows.
- **ISS-036** — У hero (макет і дефолти в коді) — «Лендінг за 199 $, Сайт візитка за 399 $, Корпоративний за 799 $»; у секції «Послуги та ціни» того ж макета — 100 / 300 / 450 $; калькулятор у CMS рахує в UAH. Потрібне рішення власника, які ціни правильні. Ціни в hero можна змінити без коду: адмінка → «Калькулятор» → «Ціни на головній» (`heroPrices`).
- **ISS-037** — У `src/client/components/Calculator/Calculator.scss` у правилі є і `backdrop-filter`, і `-webkit-backdrop-filter`. Lightning CSS (збірка CSS у Next) у такому разі залишає лише `-webkit-backdrop-filter`, який Chrome / Edge ігнорують, — розмиття там не працює. Виправлення: прибрати рядок `-webkit-backdrop-filter` (префікс для Safari додасться автоматично). Знайдено 2026-11-09 під час роботи над хедером / hero, де те саме вже виправлено.
- **ISS-038** — `src/client/lib/payload-fetch.ts` бере адресу Payload як `PAYLOAD_INTERNAL_URL` або `http://127.0.0.1:$PORT`. На VPS це той самий процес, а на Vercel (serverless) за цією адресою нічого не слухає, тож сторінки з даними CMS на превʼю падають або порожні. Виправлення: якщо є `VERCEL_URL` — ходити на `https://${VERCEL_URL}`; якщо у Vercel увімкнено *Deployment Protection* для Preview — додавати заголовок `x-vercel-protection-bypass` із `VERCEL_AUTOMATION_BYPASS_SECRET` (*Protection Bypass for Automation*) або вимкнути захист превʼю.
