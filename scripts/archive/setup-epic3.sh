#!/usr/bin/env bash
set -euo pipefail

mkdir -p packages/database/prisma
mkdir -p packages/database/src
mkdir -p infra/docker

cat > packages/database/package.json <<'EOF'
{
  "name": "@trustlayer/database",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "build": "prisma generate",
    "lint": "echo lint database",
    "typecheck": "tsc --noEmit",
    "test": "echo test database",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio"
  },
  "dependencies": {
    "@prisma/client": "^6.0.0"
  },
  "devDependencies": {
    "prisma": "^6.0.0"
  }
}
EOF

cat > packages/database/tsconfig.json <<'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true,
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
EOF

cat > packages/database/src/index.ts <<'EOF'
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export * from "@prisma/client";
EOF

cat > packages/database/prisma/schema.prisma <<'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum MembershipRole {
  OWNER
  ADMIN
  MEMBER
  VIEWER
}

enum VerificationStatus {
  DRAFT
  SUBMITTED
  IN_REVIEW
  APPROVED
  REJECTED
  EXPIRED
}

model Organization {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  memberships         Membership[]
  verificationRequests VerificationRequest[]
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  memberships Membership[]
}

model Membership {
  id             String         @id @default(cuid())
  role           MembershipRole @default(MEMBER)
  organizationId String
  userId         String
  createdAt      DateTime       @default(now())

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([organizationId, userId])
}

model VerificationRequest {
  id             String             @id @default(cuid())
  organizationId String
  title          String
  status         VerificationStatus @default(DRAFT)
  createdAt      DateTime           @default(now())
  updatedAt      DateTime           @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
}
EOF

cat > infra/docker/docker-compose.yml <<'EOF'
services:
  postgres:
    image: postgres:16-alpine
    container_name: trustlayer-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: trustlayer
      POSTGRES_PASSWORD: trustlayer
      POSTGRES_DB: trustlayer_dev
    ports:
      - "5432:5432"
    volumes:
      - trustlayer_postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: trustlayer-redis
    restart: unless-stopped
    ports:
      - "6379:6379"

volumes:
  trustlayer_postgres_data:
EOF

cat > .env <<'EOF'
DATABASE_URL="postgresql://trustlayer:trustlayer@localhost:5432/trustlayer_dev?schema=public"
REDIS_URL="redis://localhost:6379"
EOF

cat > .env.example <<'EOF'
DATABASE_URL="postgresql://trustlayer:trustlayer@localhost:5432/trustlayer_dev?schema=public"
REDIS_URL="redis://localhost:6379"
EOF

echo "Epic 3 database scaffold complete."
