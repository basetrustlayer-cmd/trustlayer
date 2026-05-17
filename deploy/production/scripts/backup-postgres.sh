#!/usr/bin/env sh
set -eu

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p ./backups

docker compose -f docker-compose.yml exec -T postgres \
  pg_dump -U trustlayer -d trustlayer \
  > "./backups/trustlayer_${timestamp}.sql"

echo "Backup created: ./backups/trustlayer_${timestamp}.sql"
