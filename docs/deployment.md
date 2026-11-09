# Деплой (VPS)

> Актуалізовано 2026-11-09. Серверні скрипти й compose MongoDB лежать **поза репозиторієм** (рішення власника):
> `AgencyAbect/scripts/` і `AgencyAbect/mongodb/` (у кожній є `README.md`). На сервер їх кладуть через SFTP.
> Деплоїть лише власник і лише з гілки `main` (див. [git-workflow.md](git-workflow.md)).

## Схема

```
GitHub ABECT-Group/agency.abect.com (main)
        │  git pull (вручну, scripts/restart.sh)
        ▼
VPS  /home/admin/www/abect/frontend ── docker compose build → up -d (сайт працює під час білду)
        │
nginx :80 → 301 https
nginx :443 (Let's Encrypt) ──► 127.0.0.1:3333 ──► agency-abect-frontend :3000 (user node, healthcheck /api/health)
                                                     │  docker network abect-shared
                                                     ▼
                                                 abect-mongo :27017 (volume mongo_data)
```

CI/CD немає: деплой запускається вручну по SSH.

## Структура на сервері

```
/home/admin/www/abect/
├── .env.db           # MONGO_ROOT_USER, MONGO_ROOT_PASSWORD, DATABASE_URI       (chmod 600)
├── .env.frontend     # PAYLOAD_SECRET, NEXT_PUBLIC_*, TELEGRAM_*                 (chmod 600)
├── frontend/         # git clone https://github.com/ABECT-Group/agency.abect.com.git
│   └── media/        # завантаження Payload (bind-mount у контейнер /app/media, власник uid 1000)
├── mongodb/          # SFTP: docker-compose MongoDB, backups/
└── scripts/          # SFTP: restart.sh, backup.sh
```

Передумови: Docker + Compose v2, nginx, certbot, користувач `admin` із sudo, DNS `agency.abect.com` → IP сервера.

## Перший деплой (чистий сервер)

```bash
# 1. Код
mkdir -p /home/admin/www/abect && cd /home/admin/www/abect
git clone https://github.com/ABECT-Group/agency.abect.com.git frontend
# mongodb/ і scripts/ залити через SFTP з локальної папки AgencyAbect/
chmod +x scripts/*.sh

# 2. Секрети
nano .env.db         # див. mongodb/README.md
nano .env.frontend   # див. нижче
chmod 600 .env.*

# 3. Мережа та MongoDB
docker network create abect-shared
cd mongodb && set -a && source ../.env.db && set +a && docker compose up -d && cd ..

# 4. nginx + SSL (конфіг нижче)
sudo nano /etc/nginx/sites-available/agency.abect.com
sudo ln -s /etc/nginx/sites-available/agency.abect.com /etc/nginx/sites-enabled/
sudo certbot certonly --webroot -w /var/www/certbot -d agency.abect.com
sudo nginx -t && sudo systemctl reload nginx

# 5. Фронтенд
scripts/restart.sh

# 6. Адмінка: https://agency.abect.com/admin → створити першого користувача (стане superadmin)
```

### `.env.frontend`

```env
PAYLOAD_SECRET=довгий_випадковий_рядок_32+     # openssl rand -base64 32
NEXT_PUBLIC_SERVER_URL=https://agency.abect.com
NEXT_PUBLIC_GA_ID=                              # G-XXXXXXX, порожньо = вимкнено
NEXT_PUBLIC_CLARITY_ID=                         # порожньо = вимкнено
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
TELEGRAM_THREAD_ID=
NEXT_TELEMETRY_DISABLED=1
```

`NEXT_PUBLIC_*` вшиваються в бандл під час білду: `restart.sh` робить `source` цього файлу, а `docker-compose.yml` передає їх як build args. Після зміни цих змінних потрібен передеплой.

## Передеплой

```bash
/home/admin/www/abect/scripts/restart.sh
docker logs agency-abect-frontend --tail=50 -f
```

Сайт працює, поки йде білд. Контейнер замінюється за кілька секунд, потім скрипт чекає `healthy`.

## Міграція 2026-11-09 (одноразово)

Оновлення 2026-11-09: Next 16, Payload 3.93, standalone-образ від користувача `node`, порт лише на localhost, нові скрипти. Порядок дій:

```bash
cd /home/admin/www/abect

# 1. Свіжий бекап СТАРИМ скриптом (про всяк випадок)
scripts/backup.sh

# 2. Залити по SFTP нові версії з локальної папки AgencyAbect/:
#    scripts/restart.sh, scripts/backup.sh, scripts/README.md, mongodb/README.md
chmod +x scripts/*.sh
sed -i 's/\r$//' scripts/*.sh         # якщо файли прийшли з CRLF (Windows)

# 3. Додати в .env.frontend змінні NEXT_PUBLIC_GA_ID / NEXT_PUBLIC_CLARITY_ID (якщо є ID)

# 4. Деплой (скрипт сам зробить git pull)
scripts/restart.sh

# 5. Перевірки
curl -s -m 5 -o /dev/null -w "%{http_code}\n" http://<IP-сервера>:3333/   # не має відповідати (порт закрито)
curl -s https://agency.abect.com/api/health                                # {"status":"ok"}
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://agency.abect.com/api/graphql   # 404
curl -s https://agency.abect.com/sitemap.xml | grep -c "<loc>"             # більше за 16

# 6. cron для бекапів — див. scripts/README.md
```

`frontend/docker-compose.yml` більше не вимагає мережі `mongodb-net` — якщо її створювали вручну, можна видалити (`docker network rm mongodb-net`).

Після деплою **змініть паролі адмінів**: до виправлення адмінка була доступна по HTTP на `:3333`, а версія Payload мала критичну вразливість відновлення пароля.
Якщо в адмінці не було користувача з роллю `superadmin` — увійдіть і призначте її собі в «Користувачі» (поки суперадміна немає, це дозволено будь-якому залогіненому).

## Docker

**`Dockerfile`** — multi-stage на `node:22-alpine`:
- `deps`: `npm ci`;
- `builder`: `npm run build` з build args `PAYLOAD_SECRET`/`DATABASE_URI` (заглушки — БД на білді не потрібна) і `NEXT_PUBLIC_SERVER_URL`/`NEXT_PUBLIC_GA_ID`/`NEXT_PUBLIC_CLARITY_ID`;
- `runner`: лише `.next/standalone`, `.next/static`, `public`; `USER node`; `CMD node server.js`; healthcheck `wget /api/health` (без БД).

**`docker-compose.yml`:**

| Параметр | Значення |
|---|---|
| build args | заглушки БД + `NEXT_PUBLIC_*` з shell (`${VAR}`) |
| container | `agency-abect-frontend` |
| env_file | `../.env.db`, `../.env.frontend` (runtime) |
| ports | `127.0.0.1:3333:3000` — лише для nginx |
| volumes | `./media:/app/media` |
| networks | `abect-shared` (external) |
| limits | 2 CPU / 2 GB |

## nginx (`/etc/nginx/sites-available/agency.abect.com`)

Еталонна версія. Застосунок бере IP клієнта з `X-Real-IP` (rate limit заявок), тож цей заголовок **обов'язковий**. Конфіг на сервері треба звірити з еталоном (ISS-014): Next.js уже ставить HSTS та інші security-заголовки, nginx їх не дублює.

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name agency.abect.com;

    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://$host$request_uri; }
}

server {
    listen 443 ssl http2;                       # nginx 1.24 (на сервері). З ≥ 1.25: "listen 443 ssl;" + "http2 on;"
    listen [::]:443 ssl http2;
    server_name agency.abect.com;

    ssl_certificate         /etc/letsencrypt/live/agency.abect.com/fullchain.pem;
    ssl_certificate_key     /etc/letsencrypt/live/agency.abect.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/agency.abect.com/chain.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # HSTS, X-Frame-Options, nosniff, Referrer-Policy, CSP ставить Next.js (next.config.mjs),
    # тут не дублювати.

    access_log /var/log/nginx/agency.abect.com.access.log;
    error_log  /var/log/nginx/agency.abect.com.error.log;

    client_max_body_size 50M;                   # завантаження медіа в адмінці

    location / {
        proxy_pass http://127.0.0.1:3333;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }

    location /_next/static {
        proxy_pass http://127.0.0.1:3333;
        proxy_set_header Host $host;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

На сервері nginx `1.24.0 (Ubuntu)`. `www.agency.abect.com` не має DNS, тому в `server_name` його немає.

## Бекапи

`scripts/backup.sh` (поза git) → `mongodb/backups/abect_db_*.gz` + `mongodb/backups/abect_media_*.tar.gz`, ротація 14 днів, опційна копія через rclone. Cron і відновлення — у `AgencyAbect/scripts/README.md`.

## Корисні команди

```bash
docker ps
docker logs agency-abect-frontend --tail=100 -f
docker inspect -f '{{.State.Health.Status}}' agency-abect-frontend
docker logs abect-mongo --tail=50
docker compose -f /home/admin/www/abect/frontend/docker-compose.yml ps
df -h && docker system df             # місце на диску
sudo tail -f /var/log/nginx/agency.abect.com.error.log
```
