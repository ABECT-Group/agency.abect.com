# Документація ABECT (agency.abect.com)

Точка входу в документацію проекту. Правила роботи для Claude — у [`../CLAUDE.md`](../CLAUDE.md).

| Документ | Що всередині |
|---|---|
| [architecture.md](architecture.md) | Концепт продукту, стек, архітектура, потоки даних, структура папок |
| [rules.md](rules.md) | Правила роботи над кодом: код-стайл, best practices, заборони, Definition of Done |
| [patterns.md](patterns.md) | Патерни коду: сторінка, модуль, lib-запит, колекція Payload, i18n, SEO, ревалідація |
| [api.md](api.md) | API: власні ендпоінти, Payload REST, матриця доступів, Telegram |
| [deployment.md](deployment.md) | VPS, Docker, nginx, env-змінні, скрипти, бекапи, міграція 2026-11-09 |
| [../infra/scripts/README.md](../infra/scripts/README.md) | `restart.sh` (деплой), `backup.sh` (бекапи), cron, відновлення |
| [../infra/mongodb/README.md](../infra/mongodb/README.md) | MongoDB у Docker |
| [issues/current.md](issues/current.md) | **Поточні проблеми** з пріоритетами |
| [issues/resolved.md](issues/resolved.md) | Історія вирішених проблем |
| [changelogs/changelog.md](changelogs/changelog.md) | Індекс змін по днях (нові зверху) |

## Репозиторій

- GitHub: **https://github.com/ABECT-Group/agency.abect.com** (гілка `main`)
- Прод: https://agency.abect.com · адмінка: https://agency.abect.com/admin

## Інфраструктура

З 2026-11-09 усе в репозиторії: серверні скрипти й compose MongoDB лежать у `infra/`. Поза git лишаються лише секрети (`.env.db`, `.env.frontend` на сервері) і дані (`media/`, volume MongoDB, бекапи).
