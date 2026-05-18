# TrustLayer Staging Launch Checklist

## Goal

Validate that TrustLayer can run as an integrated staging platform before production launch.

## Pre-Deployment

- [ ] Staging server provisioned
- [ ] Domain or subdomain assigned
- [ ] TLS certificate configured
- [ ] `.env.production` created from `.env.production.example`
- [ ] `POSTGRES_PASSWORD` replaced
- [ ] `AUTH_SECRET` replaced
- [ ] `WEBHOOK_SIGNING_SECRET` replaced
- [ ] `CRON_SECRET` replaced
- [ ] Stripe test keys configured
- [ ] Redpanda enabled
- [ ] Optional Neo4j configured if fraud graph is enabled

## Deployment

cd deploy/production
cp .env.production.example .env.production
docker compose -f docker-compose.yml up -d --build

## Database

- [ ] Prisma migrations applied
- [ ] Prisma client generated
- [ ] Sandbox seed script executed
- [ ] Backup script tested

pnpm --filter @trustlayer/database prisma:generate
pnpm --filter @trustlayer/database seed:sandbox
cd deploy/production
./scripts/backup-postgres.sh

## Runtime Health

- [ ] API gateway container healthy
- [ ] PostgreSQL container healthy
- [ ] Redpanda container healthy
- [ ] `/health` returns ok
- [ ] `/metrics` returns Prometheus text
- [ ] Logs include request IDs

curl https://api.staging.trustlayer.io/health
curl https://api.staging.trustlayer.io/metrics

## API Contract

- [ ] OpenAPI lock verified
- [ ] Developer docs page loads
- [ ] OpenAPI YAML downloads
- [ ] Swagger UI link opens
- [ ] Redoc link opens

## Security

- [ ] Direct placeholder secrets removed
- [ ] API key auth required on protected `/v1/*` routes
- [ ] Stripe webhook route remains public
- [ ] Webhook signing secret has at least 32 characters
- [ ] No sensitive values committed

## Acceptance

Staging is ready when every item above passes without manual database edits.
