# Документація ABECT (agency.abect.com)

Точка входу в документацію проекту. Правила роботи для Claude — у [`../CLAUDE.md`](../CLAUDE.md).

| Документ | Що всередині |
|---|---|
| [architecture.md](architecture.md) | Концепт продукту, стек, архітектура, потоки даних, структура папок |
| [rules.md](rules.md) | Правила роботи над кодом: код-стайл, best practices, заборони, Definition of Done |
| [patterns.md](patterns.md) | Патерни коду: сторінка, модуль, lib-запит, колекція Payload, i18n, SEO, ревалідація |
| [api.md](api.md) | API: власні ендпоінти, Payload REST, матриця доступів, Telegram |
| [deployment.md](deployment.md) | VPS, Docker, nginx, env-змінні, скрипти, бекапи, міграція 2026-11-09 |
| [git-workflow.md](git-workflow.md) | **Гілки, коміти, pull request: як працює розробник і як мерджить власник** |
| [issues/current.md](issues/current.md) | **Поточні проблеми** з пріоритетами |
| [issues/resolved.md](issues/resolved.md) | Історія вирішених проблем |
| [changelogs/changelog.md](changelogs/changelog.md) | Індекс змін по днях (нові зверху) |

## Репозиторій

- GitHub: **https://github.com/ABECT-Group/agency.abect.com** (гілка `main`)
- Прод: https://agency.abect.com · адмінка: https://agency.abect.com/admin

## Інфраструктура

Git-репозиторій — це лише папка `frontend/`. Поруч на диску (і на VPS) лежать папки, які **не відстежуються git** (рішення власника):

```
AgencyAbect/
├── frontend/   ← git (цей репозиторій)
├── mongodb/    ← docker-compose MongoDB, README.md всередині
└── scripts/    ← restart.sh, backup.sh, README.md всередині
```

У розробника, який клонує лише репозиторій, цих папок немає — вони потрібні тільки для сервера.
