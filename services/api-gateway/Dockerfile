FROM node:22-alpine AS base

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY packages ./packages
COPY services/api-gateway ./services/api-gateway

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @trustlayer/database prisma:generate
RUN pnpm --filter @trustlayer/api-gateway build

EXPOSE 3000

CMD ["node", "services/api-gateway/dist/index.js"]
