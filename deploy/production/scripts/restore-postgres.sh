#!/usr/bin/env sh
set -eu

backup_file="${1:-}"

if [ -z "$backup_file" ]; then
  echo "Usage: ./scripts/restore-postgres.sh ./backups/trustlayer_YYYYMMDDTHHMMSSZ.sql"
  exit 1
fi

if [ ! -f "$backup_file" ]; then
  echo "Backup file not found: $backup_file"
  exit 1
fi

cat "$backup_file" | docker compose -f docker-compose.yml exec -T postgres \
  psql -U trustlayer -d trustlayer

echo "Restore completed from: $backup_file"
