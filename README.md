# TrustLayer Platform Foundation

Epic 1 establishes the TrustLayer monorepo foundation.

## Apps and Services

- apps/web: public website
- apps/dashboard: integrator dashboard
- services/api-gateway: REST API gateway
- packages/shared-types: shared TypeScript contracts
- infra/docker: local PostgreSQL and Redis

## Local Start

```bash
corepack enable
pnpm install
cp .env.example .env
pnpm docker:up

