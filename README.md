# ABECT — agency.abect.com

Корпоративний сайт веб-агентства з калькулятором вартості, портфоліо, блогом та CMS.

- Прод: https://agency.abect.com · адмінка: https://agency.abect.com/admin
- Репозиторій: https://github.com/ABECT-Group/agency.abect.com
- Документація: [`docs/README.md`](docs/README.md) · ченджлог: [`docs/changelogs/changelog.md`](docs/changelogs/changelog.md) · правила для Claude: [`CLAUDE.md`](CLAUDE.md)

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

Вимоги: Node.js ≥ 22.23 (Payload 3.93), npm 10+, MongoDB (Atlas або локальний).

```bash
npm install
cp .env.example .env      # заповнити DATABASE_URI, PAYLOAD_SECRET тощо
npm run dev               # http://localhost:3000, адмінка /admin
```

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

## Деплой

На VPS через Docker, вручну:

```bash
/home/admin/www/abect/scripts/restart.sh
```

Повна інструкція (структура сервера, env, nginx, бекапи, міграція): [`docs/deployment.md`](docs/deployment.md).
Серверні скрипти (`scripts/`) і compose MongoDB (`mongodb/`) лежать поруч із цією папкою й **не входять у репозиторій**.

Робота з гілками й pull request: [`docs/git-workflow.md`](docs/git-workflow.md).
