# TrustLayer Production Runbook

## Start Production Stack

```bash
cd deploy/production
cp .env.production.example .env.production
docker compose -f docker-compose.yml up -d --build
