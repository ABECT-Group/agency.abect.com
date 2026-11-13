# Деплой (VPS)

> Актуалізовано 2026-11-13. Патерн той самий, що в QRHUB (`abect.com`) на тому ж сервері:
> реліз — вручну, скриптом `restart-frontend.sh`. Відмінність від QRHUB: окремої гілки `prod` немає — **що в `main`, те й на проді** (рішення власника). Автоматичного CI/CD немає.
> Скрипти — `AgencyAbect/scripts/` (поза git, на сервер через `scp`), опис — `AgencyAbect/scripts/README.md`.

## Схема

```
розробник: feature/* ──► власник зливає в main (git push)
                                                          │
VPS forze-main-server (SSH, порт 54321)                   ▼
  ~/www/agency-abect/scripts/restart-frontend.sh: git pull origin main → build → up -d → health-check
        │
nginx :443 (Let's Encrypt) ──► 127.0.0.1:3333 ──► agency-abect-frontend :3000 (user node, /api/health)
                                                     │  docker network mongodb-net
                                                     ▼
                              mongodb :27017 — СПІЛЬНИЙ контейнер (/opt/mongodb, replica set rs0), БД agency-abect
```

⚠️ На сервері кілька проектів. **Тека цього — `~/www/agency-abect`.** `~/www/abect` — QRHUB, не плутати.

## Структура на сервері

```
/home/admin/www/agency-abect/
├── frontend/     # git clone https://github.com/ABECT-Group/agency.abect.com.git, гілка main
│   └── media/    # файли з адмінки (volume → /app/media, власник uid 1000)
├── scripts/      # restart-frontend.sh, backup-media.sh (scp з AgencyAbect/scripts)
├── secrets/      # .env.frontend — chmod 600, поза git
└── backups/      # архіви media (backup-media.sh)
```

| Що | Де | Хто керує |
|---|---|---|
| База | спільний контейнер `mongodb`, `/opt/mongodb/docker-compose.yml`, БД `agency-abect` | власник сервера (root) |
| Бекап бази | `/opt/mongodb/backup-mongo.sh` — cron root 03:00, дамп усіх баз, 7 днів | root |
| Бекап файлів | `scripts/backup-media.sh` — cron admin 03:10, 7 днів | admin |
| nginx | `/etc/nginx/sites-available/agency.abect.com` → `127.0.0.1:3333` | root |

### `secrets/.env.frontend`

```env
DATABASE_URI=mongodb://USER:PASS@mongodb:27017/agency-abect?authSource=admin&replicaSet=rs0
PAYLOAD_SECRET=довгий_випадковий_рядок_32+      # openssl rand -base64 32
NEXT_PUBLIC_SERVER_URL=https://agency.abect.com
NEXT_PUBLIC_GA_ID=                               # G-XXXXXXX, порожньо = вимкнено
NEXT_PUBLIC_CLARITY_ID=                          # порожньо = вимкнено
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
TELEGRAM_THREAD_ID=
NEXT_TELEMETRY_DISABLED=1
# APP_ENV=production                             # необовʼязково: на VPS і так production
```

- `NEXT_PUBLIC_*` — **build-time**: `restart-frontend.sh` робить `source` цього файлу, compose передає їх як build args. Після зміни — новий реліз (простого рестарту мало).
- `&replicaSet=rs0` — як у QRHUB: спільний Mongo працює як replica set, факт записаний у рядку підключення.
- `APP_ENV=preview` на VPS **не ставити** — закриє сайт від індексації.

## Регулярний реліз

**1. Зміни вже в `main`** (власник злив гілку й запушив — див. [git-workflow.md](git-workflow.md#53-злиття-в-main-і-деплой)).

**2. На сервері:**

```bash
ssh admin@forze-main-server            # порт 54321
~/www/agency-abect/scripts/restart-frontend.sh
```

Скрипт: `git pull origin main` → `docker compose build` (сайт працює) → `up -d` → чекає `healthy` → прибирає старі образи. Не став healthy — завершується з помилкою й підказкою.

**3. Перевірка:**

```bash
docker ps --filter name=agency-abect
curl -s http://127.0.0.1:3333/api/health          # {"status":"ok"}
docker logs agency-abect-frontend --tail=50
```

### Відкат

Відкочується сам `main` на GitHub (з машини власника), потім звичайний реліз:

```bash
git switch main && git pull --ff-only
git revert <поганий-коміт>          # або кілька; історію main не переписувати
git push origin main
# на сервері:
~/www/agency-abect/scripts/restart-frontend.sh
```

## Перехід на новий патерн (одноразово, з поточного стану сервера)

Стан до переходу (2026-11-13): контейнер `agency-abect-frontend` з образу `frontend-app` (3 міс.), порт `0.0.0.0:3333`, мережі `abect-shared` + `mongodb-net`, секрети `~/www/agency-abect/.env.db` + `.env.frontend`, у `frontend/` — гілка `main` на `88deb2a`, `scripts/restart.sh` старий (`down` → `up --build`), `mongodb/` — залишок окремого Mongo.

**0. Підготовка:** гілку `chore/deploy-like-abect` злито в `main` (2026-11-13). На сервері в `frontend/` зараз `main` на старому `88deb2a` — **запамʼятати цей коміт**, він потрібен для повернення старої версії.

**1. На сервері — страхувальні копії** (без sudo):

```bash
ssh admin@forze-main-server
cd ~/www/agency-abect
set -a; source .env.db; set +a
docker exec mongodb mongodump --uri "$DATABASE_URI" --archive --gzip > ~/agency-abect-db-before-2026-11.archive.gz
tar -czf ~/agency-abect-media-before-2026-11.tar.gz -C frontend media
ls -lh ~/agency-abect-*-before-2026-11.*
```

**2. Секрети в `secrets/`** (старі `.env.db` / `.env.frontend` поки не видаляти — потрібні для відкату):

```bash
mkdir -p secrets backups && chmod 700 secrets
{ grep -h '^DATABASE_URI=' .env.db; cat .env.frontend; } > secrets/.env.frontend
chmod 600 secrets/.env.frontend
nano secrets/.env.frontend
#   - до DATABASE_URI дописати &replicaSet=rs0
#   - NEXT_PUBLIC_SERVER_URL=https://agency.abect.com
#   - за потреби NEXT_PUBLIC_GA_ID / NEXT_PUBLIC_CLARITY_ID
```

**3. Скрипти** — з машини власника (з теки `AgencyAbect/`):

```bash
scp -P 54321 scripts/restart-frontend.sh scripts/backup-media.sh admin@forze-main-server:/home/admin/www/agency-abect/scripts/
```

На сервері:

```bash
cd ~/www/agency-abect
chmod +x scripts/*.sh && sed -i 's/\r$//' scripts/*.sh
rm scripts/restart.sh                              # старий скрипт
```

**4. Реліз:**

```bash
~/www/agency-abect/scripts/restart-frontend.sh
```

Скрипт підтягне свіжий `main`, збере образ `agency-abect-frontend:latest`, виправить власника `media/`, прибере старий контейнер (compose-проект `frontend`) і підніме новий. Простій — секунди.

**5. Перевірка:**

```bash
curl -s http://127.0.0.1:3333/api/health                              # {"status":"ok"}
docker port agency-abect-frontend                                      # 3000/tcp -> 127.0.0.1:3333
docker inspect agency-abect-frontend --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'   # mongodb-net
```

З машини власника: `https://agency.abect.com` відкривається, `/api/health` → `ok`, `http://agency.abect.com:3333` **не** відповідає. Відкрити головну, `/services`, `/portfolio`, `/blog` (UA і EN), адмінку, надіслати тестову заявку.

**Якщо щось не так — повернути стару версію** (працює, поки не виконано крок 6):

```bash
cd ~/www/agency-abect/frontend
docker rm -f agency-abect-frontend
git checkout 88deb2a                               # стара версія (detached HEAD): старий compose
docker compose up -d                               # старий образ frontend-app, старі .env.db / .env.frontend
# коли проблему виправлено в main: git checkout main && ../scripts/restart-frontend.sh
```

**6. Прибирання — лише після успішної перевірки:**

```bash
cd ~/www/agency-abect
docker image rm frontend-app                       # старий образ
docker network inspect abect-shared -f '{{len .Containers}}'   # має бути 0
docker network rm abect-shared                     # мережа більше нікому не потрібна
rm -rf mongodb                                     # залишок окремого Mongo
rm .env.db .env.frontend                           # тепер усе в secrets/.env.frontend
```

**7. Cron для бекапу файлів** (під admin, без sudo): `crontab -e`, додати рядок з `AgencyAbect/scripts/README.md` (розділ `backup-media.sh`).

**8. Задачі після першого релізу** (ISS-027): змінити паролі користувачів адмінки, призначити собі `superadmin`, перевірити контент.

## Docker

**`Dockerfile`** — multi-stage на `node:22-alpine`:
- `deps`: `npm ci`;
- `builder`: `npm run build` з build args `PAYLOAD_SECRET`/`DATABASE_URI` (заглушки — БД на білді не потрібна) і `NEXT_PUBLIC_SERVER_URL`/`NEXT_PUBLIC_GA_ID`/`NEXT_PUBLIC_CLARITY_ID`;
- `runner`: лише `.next/standalone`, `.next/static`, `public`; `USER node`; `CMD node server.js`; healthcheck `wget /api/health` (без БД).

**`docker-compose.yml`:**

| Параметр | Значення |
|---|---|
| `name` / `image` | `agency-abect` / `agency-abect-frontend:latest` — **не прибирати** (збіг тегів з іншими проектами на сервері вже клав чужий прод) |
| build args | заглушки БД + `NEXT_PUBLIC_*` з shell (`${VAR}`) |
| container | `agency-abect-frontend` |
| env_file | `../secrets/.env.frontend` |
| ports | `127.0.0.1:3333:3000` — лише для nginx |
| volumes | `./media:/app/media` |
| networks | `mongodb-net` (external) — доступ до спільного `mongodb` |
| limits | 2 CPU / 2 GB |

## nginx (`/etc/nginx/sites-available/agency.abect.com`)

Еталонна версія. Застосунок бере IP клієнта з `X-Real-IP` (rate limit заявок), тож цей заголовок **обов'язковий**. Конфіг на сервері треба звірити з еталоном (ISS-014; потрібен sudo): Next.js уже ставить HSTS та інші security-заголовки, nginx їх не дублює.

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

| Що | Скрипт | Коли | Куди |
|---|---|---|---|
| База `agency-abect` | `/opt/mongodb/backup-mongo.sh` (спільний, root) | 03:00 | `/opt/mongodb/backups/mongodb_full_*.archive.gz`, 7 днів |
| `frontend/media/` | `~/www/agency-abect/scripts/backup-media.sh` (admin) | 03:10 | `~/www/agency-abect/backups/agency-abect_media_*.tar.gz`, 7 днів |

Cron для `backup-media.sh` і відновлення — `AgencyAbect/scripts/README.md`. ⚠️ Відновлюючи базу з повного дампу, обмежувати `--nsInclude='agency-abect.*'`: контейнер спільний.

## Корисні команди

```bash
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'
docker logs agency-abect-frontend --tail=100 -f
docker inspect -f '{{.State.Health.Status}}' agency-abect-frontend
docker compose -f ~/www/agency-abect/frontend/docker-compose.yml ps
df -h / && docker system df          # місце на диску (кеш збірки росте з кожним релізом)
```
