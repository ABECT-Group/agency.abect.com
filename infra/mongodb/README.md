# infra/mongodb — база даних (продакшн)

Docker Compose для MongoDB, на якій працює Payload CMS сайту agency.abect.com.
Повна схема деплою: [`../../docs/deployment.md`](../../docs/deployment.md).

> З 2026-11-09 папка в git (раніше лежала поза репозиторієм у `/home/admin/www/abect/mongodb/` і заливалась через SFTP).
> На сервері вона доступна як `/home/admin/www/abect/frontend/infra/mongodb/` після `git pull`.

## Що тут

| Файл | Призначення |
|---|---|
| `docker-compose.yml` | Сервіс `mongo` (образ `mongo:7.0`, контейнер `abect-mongo`) |
| `.env.example` | Шаблон змінних. Реальні значення лежать на сервері в `/home/admin/www/abect/.env.db` |

## Конфігурація

| Параметр | Значення |
|---|---|
| Образ | `mongo:7.0` |
| Контейнер | `abect-mongo` |
| Порт | `27017`, **лише всередині Docker-мережі** (`expose`, не `ports`). Ззовні база недоступна |
| Мережа | `abect-shared` (external, створюється вручну) |
| Дані | Docker volume `mongodb_mongo_data` → `/data/db` |
| Compose-проект | `name: mongodb` — той самий volume, що й у старому розташуванні |
| Healthcheck | `mongosh --eval "db.adminCommand('ping')"` кожні 30 с |
| База застосунку | `abect` (з `DATABASE_URI`) |

Фронтенд підключається за адресою `mongodb://USER:PASS@abect-mongo:27017/abect?authSource=admin` через спільну мережу `abect-shared`.

## Змінні (`/home/admin/www/abect/.env.db`)

```env
MONGO_ROOT_USER=root
MONGO_ROOT_PASSWORD=довгий_випадковий_пароль
DATABASE_URI=mongodb://root:довгий_випадковий_пароль@abect-mongo:27017/abect?authSource=admin
```

- `MONGO_INITDB_ROOT_*` застосовуються **лише при першій ініціалізації** порожнього volume.
- `${MONGO_ROOT_USER}` у compose підставляється з shell, тому перед `docker compose` треба `source` (див. нижче).
- Права: `chmod 600 /home/admin/www/abect/.env.*`

## Перший запуск (чистий сервер)

```bash
docker network create abect-shared        # один раз
cd /home/admin/www/abect/frontend/infra/mongodb
set -a && source ../../../.env.db && set +a
docker compose up -d
docker ps --filter name=abect-mongo       # статус має бути healthy
```

## Перехід зі старої папки `/home/admin/www/abect/mongodb`

Робити не обов'язково: контейнер, що вже працює, далі працює. Якщо треба керувати ним з нового місця:

```bash
cd /home/admin/www/abect/mongodb && set -a && source ../.env.db && set +a && docker compose down   # БЕЗ -v!
cd /home/admin/www/abect/frontend/infra/mongodb && docker compose up -d
docker volume ls | grep mongo_data   # має бути той самий mongodb_mongo_data
```

## Корисні команди

```bash
docker logs abect-mongo --tail=50
docker exec -it abect-mongo mongosh -u "$MONGO_ROOT_USER" -p --authenticationDatabase admin abect
docker system df -v | grep mongo_data
```

## Бекап і відновлення

Див. [`../scripts/README.md`](../scripts/README.md): `backup.sh` і команда `mongorestore`.

## ⚠️ Нюанси

- Volume `mongodb_mongo_data` — єдина копія даних. `docker compose down -v` **знищить базу**.
- Для локальної розробки ця папка не потрібна: локально використовують MongoDB Atlas або власний Mongo (`frontend/.env`).
