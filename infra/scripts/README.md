# infra/scripts — серверні скрипти

Bash-скрипти для обслуговування продакшну на VPS. **Запускаються лише на сервері.**
Повна схема деплою: [`../../docs/deployment.md`](../../docs/deployment.md).

> З 2026-11-09 скрипти в git (раніше лежали в `/home/admin/www/abect/scripts/` поза репозиторієм).
> Після `git pull` вони доступні як `/home/admin/www/abect/frontend/infra/scripts/*.sh`.
> Корінь можна змінити змінною `ABECT_DIR` (за замовчуванням `/home/admin/www/abect`).

## Розташування на сервері

```
/home/admin/www/abect/
├── .env.db           # MONGO_ROOT_USER, MONGO_ROOT_PASSWORD, DATABASE_URI
├── .env.frontend     # PAYLOAD_SECRET, NEXT_PUBLIC_*, TELEGRAM_*
├── backups/          # архіви backup.sh (поза git)
└── frontend/         # git clone https://github.com/ABECT-Group/agency.abect.com.git
    ├── media/        # файли з CMS (volume контейнера)
    └── infra/
        ├── mongodb/  # docker-compose для MongoDB
        └── scripts/  # ← ці файли
```

Права на виконання зберігаються в git. Якщо ні: `chmod +x /home/admin/www/abect/frontend/infra/scripts/*.sh`.

---

## `restart.sh` — деплой / передеплой

```bash
/home/admin/www/abect/frontend/infra/scripts/restart.sh
```

1. Lock-файл (`/tmp/abect-deploy.lock`) — два деплої одночасно не запустяться.
2. `source` `.env.db` і `.env.frontend` → `NEXT_PUBLIC_*` потрапляють у build args.
3. `git pull --ff-only origin main`.
4. `docker compose build` — **сайт у цей час працює** на старому контейнері.
5. Виставляє власника `media/` на uid 1000 (контейнер працює від користувача `node`, не root).
6. `docker compose up -d` — заміна контейнера за кілька секунд.
7. Чекає `healthy` (ендпоінт `/api/health`) до 90 с, інакше пише попередження.
8. `docker image prune -f` — прибирає старі образи.

> Скрипт оновлює себе через `git pull`. Якщо змінився сам `restart.sh`, нова версія спрацює з наступного запуску.

Логи: `docker logs agency-abect-frontend --tail=50 -f`

## `backup.sh` — бекап бази й медіа

```bash
/home/admin/www/abect/frontend/infra/scripts/backup.sh
```

- `mongodump --archive --gzip` → `backups/abect_db_YYYYMMDD_HHMMSS.gz`
- `tar` папки `frontend/media` → `backups/abect_media_YYYYMMDD_HHMMSS.tar.gz`
- Ротація: старші за `KEEP_DAYS` (14) днів видаляються.
- `trap`: при збої напівзаписані файли не лишаються.
- Якщо задано `RCLONE_REMOTE` (наприклад `gdrive:abect-backups`), архіви копіюються ще й поза сервер. Попередньо: `rclone config`.

### Розклад (cron)

```bash
crontab -e
# щодня о 03:00
0 3 * * * /home/admin/www/abect/frontend/infra/scripts/backup.sh >> /home/admin/www/abect/backups/backup.log 2>&1
# з копією в хмару:
# 0 3 * * * RCLONE_REMOTE=gdrive:abect-backups /home/admin/www/abect/frontend/infra/scripts/backup.sh >> ... 2>&1
```

### Відновлення

```bash
cd /home/admin/www/abect
set -a && source .env.db && set +a
# база (--drop спершу видаляє наявні колекції — зробіть свіжий бекап перед цим)
docker exec -i abect-mongo mongorestore \
  --username "$MONGO_ROOT_USER" --password "$MONGO_ROOT_PASSWORD" \
  --authenticationDatabase admin \
  --archive --gzip --drop < backups/abect_db_YYYYMMDD_HHMMSS.gz
# медіа
tar -xzf backups/abect_media_YYYYMMDD_HHMMSS.tar.gz -C frontend
```
