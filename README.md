# ABECT — agency.abect.com

Корпоративний сайт веб-агентства з калькулятором вартості, портфоліо, блогом та CMS.

- Прод: https://agency.abect.com · адмінка: https://agency.abect.com/admin
- Репозиторій: https://github.com/ABECT-Group/agency.abect.com (гілка `main` = прод)
- Правила для Claude: [`CLAUDE.md`](CLAUDE.md) · ченджлог: [`docs/changelogs/changelog.md`](docs/changelogs/changelog.md)

## Документація

| Документ | Що всередині |
|---|---|
| [docs/architecture.md](docs/architecture.md) | Концепт продукту, стек, схема роботи, рендеринг і кеш, локалі, структура папок, колекції |
| [docs/rules.md](docs/rules.md) | Правила роботи над кодом: код-стайл, best practices, заборони, перевірки, Definition of Done |
| [docs/patterns.md](docs/patterns.md) | Патерни коду: сторінка, модуль, запит до CMS, колекція Payload, заявка, аналітика, CSP |
| [docs/api.md](docs/api.md) | API: власні ендпоінти, Payload REST, матриця доступів, Telegram, env-змінні |
| [docs/deployment.md](docs/deployment.md) | VPS, Docker, nginx, env-змінні, скрипти, бекапи, міграція 2026-11-09 |
| [docs/git-workflow.md](docs/git-workflow.md) | **Гілки, коміти, pull request: як працює розробник і як мерджить власник** |
| [docs/issues/current.md](docs/issues/current.md) | **Поточні проблеми** з пріоритетами |
| [docs/issues/resolved.md](docs/issues/resolved.md) | Історія вирішених проблем |
| [docs/changelogs/changelog.md](docs/changelogs/changelog.md) | Ченджлог: короткий опис кожного дня (нові зверху) + детальні файли днів |
| [.github/pull_request_template.md](.github/pull_request_template.md) | Шаблон опису pull request |

## Стек

Next.js 16 (App Router) · React 19 · Payload CMS 3.93 · MongoDB 7 · TypeScript · next-intl (UA / EN) · SCSS · Docker + nginx.
Деталі: [`docs/architecture.md`](docs/architecture.md).

## Що вміє сайт

- **Послуги** з двома ціновими моделями: Weblium (конструктор) і Custom (індивідуальна розробка)
- **Калькулятор вартості** — 6 кроків, ціни налаштовуються в CMS
- **Портфоліо** та **блог** з категоріями
- **Заявки** з форм → CMS + сповіщення в Telegram
- **CMS** для всього контенту, ролі `superadmin` / `admin` / `moderator`

## Локальна розробка

Вимоги: Node.js `^22.23.4` або `≥ 24.22.1` (вимога Payload 3.93; на старіших версіях npm показує попередження `EBADENGINE`), npm 10+, MongoDB (Atlas або локальний). Продакшн-база для розробки не потрібна.

```bash
git clone https://github.com/ABECT-Group/agency.abect.com.git
cd agency.abect.com
npm install
cp .env.example .env      # заповнити DATABASE_URI, PAYLOAD_SECRET тощо
npm run dev               # http://localhost:3000, адмінка /admin (перший користувач стає superadmin)
```

Перш ніж щось змінювати — прочитати [`docs/git-workflow.md`](docs/git-workflow.md): робота лише у своїй гілці й через pull request.

### Команди

```bash
npm run dev                  # dev-сервер
npm run build                # production-білд (output: standalone; БД на білді не потрібна)
npm run start                # production-сервер (next start)
npm run typecheck            # tsc --noEmit
npm run lint                 # ESLint

npm run generate:types       # типи Payload після зміни колекцій
npm run generate:importmap   # import map адмінки

npm run seed:services        # seed базових послуг
npm run seed:services:extra  # seed додаткових послуг
```

## Що поза репозиторієм

Git-репозиторій — це лише папка `frontend/`. Поруч на диску власника лежить папка, яка **не відстежується git** (рішення власника):

```
AgencyAbect/
├── frontend/   ← git (цей репозиторій)
└── scripts/    ← restart-frontend.sh (реліз), backup-media.sh (бекап файлів), README.md
```

База — спільний контейнер `mongodb` на VPS (`/opt/mongodb`), власного Mongo в проекту немає. Розробнику ці речі не потрібні.

## Деплой

Деплоїть власник, вручну. Окремої гілки `prod` немає: **що в `main`, те й на проді**. Після злиття змін у `main`:

```bash
ssh admin@forze-main-server            # порт 54321
~/www/agency-abect/scripts/restart-frontend.sh
```

Повна інструкція (структура сервера, секрети, nginx, бекапи, перехід на цей патерн): [`docs/deployment.md`](docs/deployment.md).
