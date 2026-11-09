#!/usr/bin/env bash
# Деплой / передеплой фронтенду на VPS.
#   git pull → docker compose build (сайт ще працює) → up -d (заміна контейнера за секунди)
#   → health-check → очистка старих образів.
# Запуск: /home/admin/www/abect/frontend/infra/scripts/restart.sh
set -euo pipefail

ABECT_DIR="${ABECT_DIR:-/home/admin/www/abect}"
FRONTEND_DIR="$ABECT_DIR/frontend"
LOCK_FILE="/tmp/abect-deploy.lock"

# Один деплой за раз
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  echo "Інший деплой уже виконується ($LOCK_FILE)" >&2
  exit 1
fi

# Змінні для build args (NEXT_PUBLIC_*) і compose-підстановок
set -a
# shellcheck disable=SC1091
source "$ABECT_DIR/.env.db"
# shellcheck disable=SC1091
source "$ABECT_DIR/.env.frontend"
set +a

cd "$FRONTEND_DIR"

echo "==> git pull"
git pull --ff-only origin main

echo "==> docker compose build (поточна версія сайту продовжує працювати)"
docker compose build

# media/ на хості має належати користувачу node (uid 1000) — контейнер працює не від root
mkdir -p "$FRONTEND_DIR/media"
docker compose run --rm --no-deps --user root --entrypoint chown app -R 1000:1000 /app/media

echo "==> docker compose up -d"
docker compose up -d --remove-orphans

echo "==> чекаємо health-check"
for _ in $(seq 1 30); do
  status="$(docker inspect -f '{{.State.Health.Status}}' agency-abect-frontend 2>/dev/null || echo unknown)"
  if [ "$status" = "healthy" ]; then
    echo "OK: контейнер healthy"
    break
  fi
  sleep 3
done
if [ "${status:-}" != "healthy" ]; then
  echo "УВАГА: контейнер не став healthy (статус: ${status:-unknown}). Логи: docker logs agency-abect-frontend --tail=100" >&2
fi

echo "==> очистка старих образів"
docker image prune -f >/dev/null

echo "Done: $(date)"
docker compose ps
