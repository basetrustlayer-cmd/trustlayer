# TrustLayer

TrustLayer is a B2All trust infrastructure platform for identity verification, trust scoring, fraud analytics, escrow, dispute resolution, billing, notifications, and partner API integrations.

## Current Platform Capabilities

- API gateway with `/v1/*` partner endpoints
- API key authentication and audit logging
- KYC orchestration with verification tiers
- TrustScore calculation, history, and leaderboard
- Marketplace events for transactions, reviews, and disputes
- Fraud graph analytics with Neo4j
- Fraud alerts and admin monitoring
- Billing and Stripe checkout/portal integration
- Double-entry wallet ledger
- Escrow hold, release, and cancel flows
- Dispute resolution workflow
- Notification orchestration
- OpenAPI contract with lock-file validation
- Production Docker Compose deployment scaffold

## Local Development

Run:

    corepack enable
    corepack prepare pnpm@9.15.4 --activate
    pnpm install
    cp .env.example .env
    pnpm build
    pnpm test

## Useful Commands

    pnpm typecheck
    pnpm test
    pnpm build
    pnpm openapi:lock
    pnpm --filter @trustlayer/database prisma:generate
    pnpm --filter @trustlayer/database prisma:migrate

## Production Deployment

Production deployment scaffold:

    deploy/production/docker-compose.yml

Example:

    cd deploy/production
    cp .env.production.example .env.production
    docker compose -f docker-compose.yml up -d --build

## Health Check

    curl http://localhost:3000/health

Expected response:

    {"status":"ok","service":"trustlayer-api-gateway"}

## Quality Gates

Before opening a pull request:

    pnpm typecheck
    pnpm test
    pnpm openapi:lock

## Current MVP Status

The core backend MVP is functionally complete. Remaining production-readiness work includes Swagger UI, sandbox seed data, observability, infrastructure hardening, and ADRs.
