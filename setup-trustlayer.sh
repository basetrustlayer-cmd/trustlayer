#!/usr/bin/env bash
set -euo pipefail

mkdir -p .github/workflows
mkdir -p apps/web/app
mkdir -p apps/dashboard/app
mkdir -p services/api-gateway/src
mkdir -p packages/shared-types/src
mkdir -p infra/docker/postgres

cat > package.json <<'EOF'
{
  "name": "trustlayer",
  "version": "0.1.0",
  "private": true,
  "packageManager": "pnpm@9.15.4",
  "scripts": {
    "dev": "pnpm -r --parallel dev",
    "build": "pnpm -r build",
    "lint": "pnpm -r lint",
    "test": "pnpm -r test",
    "typecheck": "pnpm -r typecheck",
    "docker:up": "docker compose -f infra/docker/docker-compose.yml up --build",
    "docker:down": "docker compose -f infra/docker/docker-compose.yml down -v"
  },
  "devDependencies": {
    "typescript": "^5.7.3"
  }
}
EOF

cat > pnpm-workspace.yaml <<'EOF'
packages:
  - "apps/*"
  - "services/*"
  - "packages/*"
EOF

cat > tsconfig.base.json <<'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "@trustlayer/shared-types": ["packages/shared-types/src/index.ts"]
    }
  }
}
EOF

cat > .gitignore <<'EOF'
node_modules
.pnpm-store
.next
dist
coverage
.env
.env.*
!.env.example
.DS_Store
EOF

cat > .env.example <<'EOF'
NODE_ENV=development

POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=trustlayer
POSTGRES_USER=trustlayer
POSTGRES_PASSWORD=trustlayer_dev_password

REDIS_HOST=localhost
REDIS_PORT=6379

API_GATEWAY_PORT=4000
WEB_PORT=3000
DASHBOARD_PORT=3001
EOF

cat > README.md <<'EOF'
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

