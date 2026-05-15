#!/usr/bin/env bash
set -euo pipefail

# Remove bad/root placeholder if it exists
if [ -f prisma ]; then
  rm -f prisma
fi

# Remove repair/runtime artifacts from repo tracking
rm -f repair-epic4-pages.sh

cat > .gitignore <<'EOF'
node_modules/
.pnpm-store/
.next/
dist/
turbo/
.env
.env.*
!.env.example
*.tsbuildinfo
.DS_Store

# Runtime uploads
apps/dashboard/uploads/
EOF

cat > turbo.json <<'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "typecheck": {
      "dependsOn": ["^typecheck"]
    },
    "test": {
      "dependsOn": ["^test"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
EOF

cat > .prettierrc <<'EOF'
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "none",
  "printWidth": 100
}
EOF

cat > .prettierignore <<'EOF'
node_modules
.next
dist
pnpm-lock.yaml
apps/dashboard/uploads
*.tsbuildinfo
EOF

cat > eslint.config.js <<'EOF'
import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "dist/**",
      "apps/dashboard/uploads/**",
      "**/*.tsbuildinfo"
    ]
  },
  {
    files: ["**/*.{js,ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module"
    },
    rules: {
      "no-unused-vars": "off",
      "no-undef": "off"
    }
  }
];
EOF

mkdir -p .github/workflows .github

cat > .github/workflows/ci.yml <<'EOF'
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_DB: trustlayer_dev
          POSTGRES_HOST_AUTH_METHOD: trust
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U postgres -d trustlayer_dev"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379

    env:
      DATABASE_URL: postgresql://postgres@localhost:5432/trustlayer_dev?schema=public
      REDIS_URL: redis://localhost:6379
      AUTH_SECRET: ci-secret

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9.15.4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      - run: pnpm --filter @trustlayer/database prisma:generate

      - run: pnpm --filter @trustlayer/database prisma:migrate -- --name ci_init

      - run: pnpm lint

      - run: pnpm typecheck

      - run: pnpm test
EOF

cat > .github/CODEOWNERS <<'EOF'
# Require owner review for sensitive paths
/packages/database/ @basetrustlayer-cmd
/apps/dashboard/app/api/ @basetrustlayer-cmd
/apps/dashboard/lib/session.ts @basetrustlayer-cmd
/apps/dashboard/lib/db.ts @basetrustlayer-cmd
/.github/ @basetrustlayer-cmd
EOF

node - <<'NODE'
const fs = require("fs");

function patchPackage(path, patcher) {
  const pkg = JSON.parse(fs.readFileSync(path, "utf8"));
  patcher(pkg);
  fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + "\n");
}

patchPackage("package.json", (pkg) => {
  pkg.scripts = {
    dev: "turbo dev",
    build: "turbo build",
    lint: "turbo lint",
    typecheck: "turbo typecheck",
    test: "turbo test",
    format: "prettier --write .",
    "format:check": "prettier --check ."
  };

  pkg.devDependencies = pkg.devDependencies || {};
  pkg.devDependencies["@types/node"] = "^22.0.0";
});

for (const path of ["apps/web/package.json", "apps/dashboard/package.json"]) {
  patchPackage(path, (pkg) => {
    if (pkg.scripts?.lint) {
      pkg.scripts.lint = "eslint .";
    }
  });
}
NODE

# Remove tracked runtime/build artifacts if present
git rm -r --cached apps/dashboard/uploads 2>/dev/null || true
git rm --cached apps/web/tsconfig.tsbuildinfo apps/dashboard/tsconfig.tsbuildinfo 2>/dev/null || true

echo "Hardening H1 complete."
