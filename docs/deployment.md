# Деплой

> Публічна, свідомо мінімальна версія: репозиторій відкритий, тому тут немає адрес, портів, логінів, шляхів і деталей сервера.
> Покрокова інструкція з реальними даними — у приватному runbook власника (поза git).

## Схема

```
розробник: feature/* ──push──► превʼю на Vercel
                                   │ власник перевіряє
                                   ▼
                     власник зливає в main  ──►  на VPS: restart-frontend.sh
                                                   git pull main → build → up -d → health-check
```

- **Що в `main`, те й на проді.** Окремої гілки `prod` немає. Реліз власник запускає вручну, автоматичного CI/CD немає.
- `main` на Vercel не деплоїться (`vercel.json`), прод — лише VPS.

## Як влаштовано на VPS

```
nginx (HTTPS) ──► 127.0.0.1:3333 ──► контейнер agency-abect-frontend :3000 (користувач node, /api/health)
                                         │ docker network (external, задається в compose)
                                         ▼
                                     MongoDB (окремий контейнер на тому ж сервері, БД agency-abect)
```

- Поруч із робочою копією репозиторію на сервері лежать тека `scripts/` з `restart-frontend.sh` і `backup-media.sh`, а також тека `secrets/` з `.env.frontend` (`chmod 600`). Обидві поза git.
- Порт застосунку прив'язаний лише до `127.0.0.1`. Ззовні сайт доступний тільки через nginx.

### Змінні (`secrets/.env.frontend`)

```env
DATABASE_URI=mongodb://USER:PASS@<mongo-host>:27017/agency-abect?authSource=admin
PAYLOAD_SECRET=довгий_випадковий_рядок_32+      # openssl rand -base64 32
NEXT_PUBLIC_SERVER_URL=https://agency.abect.com
NEXT_PUBLIC_GA_ID=                               # порожньо = вимкнено
NEXT_PUBLIC_CLARITY_ID=                          # порожньо = вимкнено
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
TELEGRAM_THREAD_ID=
NEXT_TELEMETRY_DISABLED=1
# APP_ENV=production                             # необовʼязково: на VPS і так production
```

- `NEXT_PUBLIC_*` підставляються **під час збірки**: `restart-frontend.sh` робить `source` цього файлу, а compose передає значення як build args. Після зміни цих змінних потрібен новий реліз, простого рестарту мало.
- `APP_ENV=preview` на проді **не ставити**: це закриє сайт від індексації.

## Реліз

1. Зміни злито в `main` і запушено (див. [git-workflow.md](git-workflow.md#53-злиття-в-main-і-деплой)).
2. На сервері запустити `scripts/restart-frontend.sh` (у теці проекту).

Що робить скрипт:
1. `git pull origin main`;
2. `docker compose build` — поки йде збірка, сайт працює на старому контейнері;
3. `up -d` — контейнер замінюється за кілька секунд;
4. чекає статусу `healthy`. Якщо його немає, скрипт завершується з помилкою;
5. прибирає старі образи.

Перевірка після релізу: `docker ps` (контейнер `healthy`), `curl -s http://127.0.0.1:3333/api/health` повертає `{"status":"ok"}`, і сайт відкривається.

### Відкат

Відкочується сам `main`, а потім запускається звичайний реліз:

```bash
git switch main && git pull --ff-only
git revert <поганий-коміт>          # історію main не переписувати
git push origin main
# на сервері — restart-frontend.sh
```

## Docker

**`Dockerfile`** — multi-stage на `node:22-alpine`:
- `deps`: `npm ci`;
- `builder`: `npm run build` з build args `PAYLOAD_SECRET`/`DATABASE_URI` (заглушки — БД на білді не потрібна) і `NEXT_PUBLIC_SERVER_URL`/`NEXT_PUBLIC_GA_ID`/`NEXT_PUBLIC_CLARITY_ID`;
- `runner`: лише `.next/standalone`, `.next/static`, `public`; `USER node`; `CMD node server.js`; healthcheck `wget /api/health` (без БД).

**`docker-compose.yml`:**

| Параметр | Значення |
|---|---|
| `name` / `image` | `agency-abect` / `agency-abect-frontend:latest`. **Не прибирати:** на сервері кілька проектів, і без явних імен Compose бере назву з теки, через що образи різних проектів можуть перезаписати один одного |
| build args | заглушки БД + `NEXT_PUBLIC_*` з shell (`${VAR}`) |
| container | `agency-abect-frontend` |
| env_file | `../secrets/.env.frontend` |
| ports | `127.0.0.1:3333:3000` — лише для nginx |
| volumes | `./media:/app/media` (власник — uid 1000; скрипт виставляє його сам) |
| networks | external-мережа, через яку видно MongoDB |
| limits | 2 CPU / 2 GB |

## nginx

Застосунок бере IP клієнта з `X-Real-IP` (rate limit заявок), тож цей заголовок **обов'язковий**. HSTS, CSP та інші security-заголовки ставить Next.js (`next.config.mjs`), у nginx їх не дублювати.

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name agency.abect.com;

    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://$host$request_uri; }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name agency.abect.com;

    ssl_certificate         /etc/letsencrypt/live/agency.abect.com/fullchain.pem;
    ssl_certificate_key     /etc/letsencrypt/live/agency.abect.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/agency.abect.com/chain.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

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

## Бекапи

- **База:** щоночі разом з іншими базами на сервері (налаштовано на рівні сервера, поза репозиторієм).
- **`media/`** (файли з адмінки): `scripts/backup-media.sh` за cron, архіви зберігаються 7 днів.
- Відновлюючи базу з дампу, обмежуйте відновлення лише БД `agency-abect` (`--nsInclude='agency-abect.*'`): MongoDB на сервері спільна.
