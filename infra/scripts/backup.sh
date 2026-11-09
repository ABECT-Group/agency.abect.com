#!/usr/bin/env bash
# Бекап MongoDB + завантажених файлів CMS (media/) з ротацією.
# Запуск вручну або з cron (див. infra/scripts/README.md):
#   /home/admin/www/abect/frontend/infra/scripts/backup.sh
#
# Налаштування через змінні середовища (необов'язково):
#   ABECT_DIR      — корінь проекту на сервері (за замовчуванням /home/admin/www/abect)
#   BACKUP_DIR     — куди класти архіви (за замовчуванням $ABECT_DIR/backups — поза git-репозиторієм)
#   KEEP_DAYS      — скільки днів зберігати (за замовчуванням 14)
#   RCLONE_REMOTE  — якщо задано (напр. "gdrive:abect-backups"), архіви копіюються ще й поза сервер
set -euo pipefail

ABECT_DIR="${ABECT_DIR:-/home/admin/www/abect}"
BACKUP_DIR="${BACKUP_DIR:-$ABECT_DIR/backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"
STAMP="$(date +%Y%m%d_%H%M%S)"

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

set -a
# shellcheck disable=SC1091
source "$ABECT_DIR/.env.db"
set +a

DB_FILE="$BACKUP_DIR/abect_db_$STAMP.gz"
MEDIA_FILE="$BACKUP_DIR/abect_media_$STAMP.tar.gz"

# Якщо щось впаде посередині — не залишати напівзаписаних архівів
cleanup() { rm -f "$DB_FILE.part" "$MEDIA_FILE.part"; }
trap cleanup EXIT

echo "==> mongodump"
docker exec abect-mongo mongodump \
  --username "$MONGO_ROOT_USER" \
  --password "$MONGO_ROOT_PASSWORD" \
  --authenticationDatabase admin \
  --archive \
  --gzip > "$DB_FILE.part"
mv "$DB_FILE.part" "$DB_FILE"

echo "==> media/"
tar -czf "$MEDIA_FILE.part" -C "$ABECT_DIR/frontend" media
mv "$MEDIA_FILE.part" "$MEDIA_FILE"

chmod 600 "$DB_FILE" "$MEDIA_FILE"

echo "==> ротація (старші за $KEEP_DAYS днів видаляються)"
find "$BACKUP_DIR" -maxdepth 1 -type f -name 'abect_*' -mtime +"$KEEP_DAYS" -delete

if [ -n "${RCLONE_REMOTE:-}" ]; then
  echo "==> копія поза сервер: $RCLONE_REMOTE"
  rclone copy "$DB_FILE" "$RCLONE_REMOTE"
  rclone copy "$MEDIA_FILE" "$RCLONE_REMOTE"
fi

echo "Backup saved: $DB_FILE, $MEDIA_FILE"
